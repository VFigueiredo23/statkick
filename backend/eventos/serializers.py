from rest_framework import serializers

from eventos.models import Evento


class EventoSerializer(serializers.ModelSerializer):
    equipe_nome = serializers.CharField(source="equipe.nome", read_only=True)
    jogador_nome = serializers.CharField(source="jogador.nome", read_only=True)

    class Meta:
        model = Evento
        fields = [
            "id",
            "partida",
            "equipe",
            "equipe_nome",
            "jogador",
            "jogador_nome",
            "tipo_evento",
            "minuto",
            "segundo",
            "posicao_x",
            "posicao_y",
            "observacoes",
        ]
