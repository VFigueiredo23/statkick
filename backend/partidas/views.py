from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

from eventos.serializers import EventoSerializer
from partidas.models import Partida
from partidas.serializers import PartidaSerializer


class PartidaViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = PartidaSerializer
    queryset = Partida.objects.select_related("equipe_casa", "equipe_fora").all().order_by("-data")
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    @action(detail=True, methods=["get"], url_path="eventos")
    def eventos(self, request, pk=None):
        partida = self.get_object()
        serializer = EventoSerializer(partida.eventos.select_related("equipe", "jogador"), many=True)
        return Response(serializer.data)
