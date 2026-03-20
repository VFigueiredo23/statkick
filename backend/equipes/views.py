from rest_framework import viewsets
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser

from equipes.models import Equipe
from equipes.serializers import EquipeSerializer


class EquipeViewSet(viewsets.ModelViewSet):
    serializer_class = EquipeSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        queryset = Equipe.objects.all().order_by("nome")
        termo = self.request.query_params.get("q")
        if termo:
            queryset = queryset.filter(nome__icontains=termo)
        return queryset
