from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

from eventos.serializers import EventoSerializer
from organizacoes.auditoria import registrar_auditoria
from organizacoes.contexto import obter_organizacao_atual
from organizacoes.limites import garantir_limite_armazenamento, garantir_limite_entidade, registrar_limite_bloqueado
from organizacoes.models import AuditLog
from organizacoes.permissoes import CanAccessScoutingData
from partidas.models import Partida
from partidas.serializers import PartidaSerializer


class PartidaViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = PartidaSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    permission_classes = [CanAccessScoutingData]

    def get_queryset(self):
        organizacao = obter_organizacao_atual(self.request)
        return Partida.objects.select_related("equipe_casa", "equipe_fora").filter(organizacao=organizacao).order_by("-data")

    def perform_create(self, serializer):
        organizacao = obter_organizacao_atual(self.request)
        try:
            garantir_limite_entidade(organizacao, "partidas")
        except ValidationError as exc:
            registrar_limite_bloqueado(
                organizacao=organizacao,
                usuario=self.request.user,
                chave="partidas",
                detalhe="Tentativa de criar partida acima do limite do plano.",
            )
            raise exc
        arquivo_video = serializer.validated_data.get("arquivo_video")
        if arquivo_video is not None:
            try:
                garantir_limite_armazenamento(organizacao, getattr(arquivo_video, "size", 0))
            except ValidationError as exc:
                registrar_limite_bloqueado(
                    organizacao=organizacao,
                    usuario=self.request.user,
                    chave="armazenamento",
                    detalhe="Tentativa de upload acima do limite de armazenamento do plano.",
                )
                raise exc
        partida = serializer.save(organizacao=organizacao)
        registrar_auditoria(
            organizacao=organizacao,
            usuario=self.request.user,
            acao=AuditLog.ACAO_PARTIDA_CRIADA,
            recurso_tipo="partida",
            recurso_id=partida.id,
            descricao="Nova partida cadastrada.",
            metadata={"competicao": partida.competicao},
        )

    def perform_update(self, serializer):
        organizacao = obter_organizacao_atual(self.request)
        partida_atual = self.get_object()
        arquivo_video = serializer.validated_data.get("arquivo_video")
        tipo_video = serializer.validated_data.get("tipo_video", partida_atual.tipo_video)

        if tipo_video == Partida.TIPO_VIDEO_UPLOAD and arquivo_video is not None:
            tamanho_atual = partida_atual.tamanho_armazenamento_video if partida_atual.tipo_video == Partida.TIPO_VIDEO_UPLOAD else 0
            delta = max(getattr(arquivo_video, "size", 0) - tamanho_atual, 0)
            if delta > 0:
                try:
                    garantir_limite_armazenamento(organizacao, delta)
                except ValidationError as exc:
                    registrar_limite_bloqueado(
                        organizacao=organizacao,
                        usuario=self.request.user,
                        chave="armazenamento",
                        detalhe="Tentativa de atualizar video acima do limite de armazenamento do plano.",
                    )
                    raise exc

        nome_anterior = f"{partida_atual.equipe_casa.nome} x {partida_atual.equipe_fora.nome}"
        partida = serializer.save(organizacao=organizacao)
        registrar_auditoria(
            organizacao=organizacao,
            usuario=self.request.user,
            acao=AuditLog.ACAO_PARTIDA_ATUALIZADA,
            recurso_tipo="partida",
            recurso_id=partida.id,
            descricao="Partida atualizada.",
            metadata={
                "nome_anterior": nome_anterior,
                "nome_atual": f"{partida.equipe_casa.nome} x {partida.equipe_fora.nome}",
                "competicao": partida.competicao,
            },
        )

    def destroy(self, request, *args, **kwargs):
        partida = self.get_object()
        organizacao = obter_organizacao_atual(request)
        nome_partida = f"{partida.equipe_casa.nome} x {partida.equipe_fora.nome}"
        recurso_video = partida.arquivo_video
        self.perform_destroy(partida)
        if recurso_video:
            recurso_video.delete(save=False)
        registrar_auditoria(
            organizacao=organizacao,
            usuario=request.user,
            acao=AuditLog.ACAO_PARTIDA_EXCLUIDA,
            recurso_tipo="partida",
            recurso_id=partida.id,
            descricao="Partida excluida.",
            metadata={"nome": nome_partida},
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["get"], url_path="eventos")
    def eventos(self, request, pk=None):
        partida = self.get_object()
        serializer = EventoSerializer(partida.eventos.select_related("equipe", "jogador"), many=True)
        return Response(serializer.data)
