from rest_framework import serializers

from jogadores.models import AvaliacaoJogador, Jogador
from organizacoes.contexto import obter_organizacao_atual


class AvaliacaoJogadorSerializer(serializers.ModelSerializer):
    nota_geral = serializers.SerializerMethodField()

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        if request is None:
            return
        organizacao = obter_organizacao_atual(request)
        self.fields["jogador"].queryset = Jogador.objects.filter(organizacao=organizacao)

    def get_nota_geral(self, obj: AvaliacaoJogador) -> int:
        return obj.nota_geral

    class Meta:
        model = AvaliacaoJogador
        fields = [
            "id",
            "jogador",
            "data_avaliacao",
            "observacoes",
            "tecnica",
            "fisico",
            "velocidade",
            "inteligencia_tatica",
            "competitividade",
            "potencial",
            "nota_geral",
        ]


class JogadorSerializer(serializers.ModelSerializer):
    equipe_nome = serializers.CharField(source="equipe.nome", read_only=True)
    avaliacoes = AvaliacaoJogadorSerializer(many=True, read_only=True)
    ultima_avaliacao = serializers.SerializerMethodField()
    avaliacao_anterior = serializers.SerializerMethodField()

    def to_internal_value(self, data):
        if hasattr(data, "copy"):
            data = data.copy()

        if data.get("equipe") == "":
            data["equipe"] = None

        return super().to_internal_value(data)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        if request is None:
            return
        organizacao = obter_organizacao_atual(request)
        self.fields["equipe"].queryset = self.fields["equipe"].queryset.filter(organizacao=organizacao)

    def validate(self, attrs):
        independente = attrs.get("independente")
        equipe = attrs.get("equipe")
        organizacao = None
        request = self.context.get("request")
        if request is not None:
            organizacao = obter_organizacao_atual(request)

        if self.instance is not None:
            if independente is None:
                independente = self.instance.independente
            if equipe is None:
                equipe = self.instance.equipe
            if organizacao is None:
                organizacao = self.instance.organizacao

        if not independente and equipe is None:
            raise serializers.ValidationError("Jogador nao independente precisa ter equipe vinculada.")
        if equipe is not None and organizacao is not None and equipe.organizacao_id != organizacao.id:
            raise serializers.ValidationError("Equipe precisa pertencer a mesma organizacao do jogador.")

        return attrs

    def get_ultima_avaliacao(self, obj: Jogador):
        avaliacao = obj.avaliacoes.first()
        if avaliacao is None:
            return None
        return AvaliacaoJogadorSerializer(avaliacao).data

    def get_avaliacao_anterior(self, obj: Jogador):
        avaliacoes = list(obj.avaliacoes.all()[:2])
        if len(avaliacoes) < 2:
            return None
        return AvaliacaoJogadorSerializer(avaliacoes[1]).data

    class Meta:
        model = Jogador
        fields = [
            "id",
            "nome",
            "posicao",
            "equipe",
            "equipe_nome",
            "idade",
            "independente",
            "categoria_organizacao",
            "informacoes_analista",
            "foto",
            "avaliacoes",
            "ultima_avaliacao",
            "avaliacao_anterior",
        ]
