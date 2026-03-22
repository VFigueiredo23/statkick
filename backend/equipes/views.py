from rest_framework import viewsets
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser

from equipes.models import Equipe
from equipes.serializers import EquipeSerializer
from organizacoes.contexto import obter_organizacao_atual
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
        serializer.save(organizacao=obter_organizacao_atual(self.request))
