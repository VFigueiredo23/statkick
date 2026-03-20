from rest_framework import serializers

from equipes.models import Equipe


class EquipeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Equipe
        fields = ["id", "nome", "brasao", "categoria_organizacao", "informacoes_analista"]
