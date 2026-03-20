from rest_framework import serializers

from eventos.models import Evento
from jogadores.models import Jogador
from organizacoes.contexto import obter_organizacao_atual
from partidas.models import Partida
from equipes.models import Equipe


class EventoSerializer(serializers.ModelSerializer):
    equipe_nome = serializers.CharField(source="equipe.nome", read_only=True)
    jogador_nome = serializers.CharField(source="jogador.nome", read_only=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        if request is None:
            return
        organizacao = obter_organizacao_atual(request)
        self.fields["partida"].queryset = Partida.objects.filter(organizacao=organizacao)
        self.fields["equipe"].queryset = Equipe.objects.filter(organizacao=organizacao)
        self.fields["jogador"].queryset = Jogador.objects.filter(organizacao=organizacao)

    def validate(self, attrs):
        request = self.context.get("request")
        organizacao = obter_organizacao_atual(request) if request is not None else None

        partida = attrs.get("partida", getattr(self.instance, "partida", None))
        equipe = attrs.get("equipe", getattr(self.instance, "equipe", None))
        jogador = attrs.get("jogador", getattr(self.instance, "jogador", None))

        if organizacao is not None and partida is not None and partida.organizacao_id != organizacao.id:
            raise serializers.ValidationError("Partida precisa pertencer a organizacao atual.")
        if organizacao is not None and equipe is not None and equipe.organizacao_id != organizacao.id:
            raise serializers.ValidationError("Equipe precisa pertencer a organizacao atual.")
        if organizacao is not None and jogador is not None and jogador.organizacao_id != organizacao.id:
            raise serializers.ValidationError("Jogador precisa pertencer a organizacao atual.")

        return attrs

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
