from rest_framework import mixins, viewsets

from eventos.models import Evento
from eventos.serializers import EventoSerializer


class EventoViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = EventoSerializer

    def get_queryset(self):
        queryset = Evento.objects.select_related("partida", "equipe", "jogador").all()
        partida_id = self.request.query_params.get("partida")
        if partida_id:
            queryset = queryset.filter(partida_id=partida_id)
        return queryset
