from rest_framework import mixins, viewsets

from eventos.models import Evento
from eventos.serializers import EventoSerializer
from organizacoes.auditoria import registrar_auditoria
from organizacoes.contexto import obter_organizacao_atual
from organizacoes.models import AuditLog
from organizacoes.permissoes import CanAccessScoutingData


class EventoViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = EventoSerializer
    permission_classes = [CanAccessScoutingData]

    def get_queryset(self):
        organizacao = obter_organizacao_atual(self.request)
        queryset = Evento.objects.select_related("partida", "equipe", "jogador").filter(organizacao=organizacao)
        partida_id = self.request.query_params.get("partida")
        if partida_id:
            queryset = queryset.filter(partida_id=partida_id)
        return queryset

    def perform_create(self, serializer):
        organizacao = obter_organizacao_atual(self.request)
        evento = serializer.save(organizacao=organizacao)
        registrar_auditoria(
            organizacao=organizacao,
            usuario=self.request.user,
            acao=AuditLog.ACAO_EVENTO_CRIADO,
            recurso_tipo="evento",
            recurso_id=evento.id,
            descricao="Novo evento registrado na analise.",
            metadata={"tipo_evento": evento.tipo_evento, "partida_id": evento.partida_id},
        )
