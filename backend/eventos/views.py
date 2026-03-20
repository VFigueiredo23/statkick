from rest_framework import mixins, viewsets

from eventos.models import Evento
from eventos.serializers import EventoSerializer
from organizacoes.contexto import obter_organizacao_atual


class EventoViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = EventoSerializer

    def get_queryset(self):
        organizacao = obter_organizacao_atual(self.request)
        queryset = Evento.objects.select_related("partida", "equipe", "jogador").filter(organizacao=organizacao)
        partida_id = self.request.query_params.get("partida")
        if partida_id:
            queryset = queryset.filter(partida_id=partida_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(organizacao=obter_organizacao_atual(self.request))
