from rest_framework import serializers

from clipes.models import Clipe


class ClipeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Clipe
        fields = ["id", "evento", "url_clipe", "duracao"]
