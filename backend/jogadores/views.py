from rest_framework import viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser

from jogadores.models import AvaliacaoJogador, Jogador
from jogadores.serializers import AvaliacaoJogadorSerializer, JogadorSerializer
from organizacoes.auditoria import registrar_auditoria
from organizacoes.contexto import obter_organizacao_atual
from organizacoes.limites import garantir_limite_entidade, registrar_limite_bloqueado
from organizacoes.models import AuditLog
from organizacoes.permissoes import CanAccessScoutingData


class JogadorViewSet(viewsets.ModelViewSet):
    serializer_class = JogadorSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    permission_classes = [CanAccessScoutingData]

    def get_queryset(self):
        organizacao = obter_organizacao_atual(self.request)
        queryset = (
            Jogador.objects.select_related("equipe")
            .prefetch_related("avaliacoes")
            .filter(organizacao=organizacao)
            .order_by("nome")
        )
        equipe_id = self.request.query_params.get("equipe")
        independente = self.request.query_params.get("independente")
        termo = self.request.query_params.get("q")

        if equipe_id:
            queryset = queryset.filter(equipe_id=equipe_id)
        if independente in {"true", "1"}:
            queryset = queryset.filter(independente=True)
        if independente in {"false", "0"}:
            queryset = queryset.filter(independente=False)
        if termo:
            queryset = queryset.filter(nome__icontains=termo)
        return queryset

    def perform_create(self, serializer):
        organizacao = obter_organizacao_atual(self.request)
        try:
            garantir_limite_entidade(organizacao, "jogadores")
        except ValidationError as exc:
            registrar_limite_bloqueado(
                organizacao=organizacao,
                usuario=self.request.user,
                chave="jogadores",
                detalhe="Tentativa de criar jogador acima do limite do plano.",
            )
            raise exc
        jogador = serializer.save(organizacao=organizacao)
        registrar_auditoria(
            organizacao=organizacao,
            usuario=self.request.user,
            acao=AuditLog.ACAO_JOGADOR_CRIADO,
            recurso_tipo="jogador",
            recurso_id=jogador.id,
            descricao="Novo jogador cadastrado.",
            metadata={"nome": jogador.nome},
        )


class AvaliacaoJogadorViewSet(viewsets.ModelViewSet):
    serializer_class = AvaliacaoJogadorSerializer
    permission_classes = [CanAccessScoutingData]

    def get_queryset(self):
        organizacao = obter_organizacao_atual(self.request)
        queryset = AvaliacaoJogador.objects.select_related("jogador", "jogador__equipe").filter(organizacao=organizacao)
        jogador_id = self.request.query_params.get("jogador")

        if jogador_id:
            queryset = queryset.filter(jogador_id=jogador_id)

        return queryset

    def perform_create(self, serializer):
        organizacao = obter_organizacao_atual(self.request)
        avaliacao = serializer.save(organizacao=organizacao)
        registrar_auditoria(
            organizacao=organizacao,
            usuario=self.request.user,
            acao=AuditLog.ACAO_AVALIACAO_CRIADA,
            recurso_tipo="avaliacao",
            recurso_id=avaliacao.id,
            descricao="Nova avaliacao de jogador registrada.",
            metadata={"jogador_id": avaliacao.jogador_id},
        )
