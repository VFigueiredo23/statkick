from rest_framework import viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser

from equipes.models import Equipe
from equipes.serializers import EquipeSerializer
from organizacoes.auditoria import registrar_auditoria
from organizacoes.contexto import obter_organizacao_atual
from organizacoes.limites import garantir_limite_entidade, registrar_limite_bloqueado
from organizacoes.models import AuditLog
from organizacoes.permissoes import CanAccessScoutingData


class EquipeViewSet(viewsets.ModelViewSet):
    serializer_class = EquipeSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    permission_classes = [CanAccessScoutingData]

    def get_queryset(self):
        organizacao = obter_organizacao_atual(self.request)
        queryset = Equipe.objects.filter(organizacao=organizacao).order_by("nome")
        termo = self.request.query_params.get("q")
        if termo:
            queryset = queryset.filter(nome__icontains=termo)
        return queryset

    def perform_create(self, serializer):
        organizacao = obter_organizacao_atual(self.request)
        try:
            garantir_limite_entidade(organizacao, "equipes")
        except ValidationError as exc:
            registrar_limite_bloqueado(
                organizacao=organizacao,
                usuario=self.request.user,
                chave="equipes",
                detalhe="Tentativa de criar equipe acima do limite do plano.",
            )
            raise exc
        equipe = serializer.save(organizacao=organizacao)
        registrar_auditoria(
            organizacao=organizacao,
            usuario=self.request.user,
            acao=AuditLog.ACAO_EQUIPE_CRIADA,
            recurso_tipo="equipe",
            recurso_id=equipe.id,
            descricao="Nova equipe cadastrada.",
            metadata={"nome": equipe.nome},
        )
