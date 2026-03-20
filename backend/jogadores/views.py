from rest_framework import viewsets
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser

from jogadores.models import AvaliacaoJogador, Jogador
from jogadores.serializers import AvaliacaoJogadorSerializer, JogadorSerializer


class JogadorViewSet(viewsets.ModelViewSet):
    serializer_class = JogadorSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        queryset = Jogador.objects.select_related("equipe").prefetch_related("avaliacoes").all().order_by("nome")
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


class AvaliacaoJogadorViewSet(viewsets.ModelViewSet):
    serializer_class = AvaliacaoJogadorSerializer

    def get_queryset(self):
        queryset = AvaliacaoJogador.objects.select_related("jogador", "jogador__equipe").all()
        jogador_id = self.request.query_params.get("jogador")

        if jogador_id:
            queryset = queryset.filter(jogador_id=jogador_id)

         return queryset
