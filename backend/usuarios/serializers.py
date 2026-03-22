from rest_framework import serializers

from organizacoes.models import Organizacao
from usuarios.models import Usuario


class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ["id", "nome", "email", "plano", "armazenamento_usado", "limite_armazenamento", "criado_em"]


class OrganizacaoResumoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organizacao
        fields = ["id", "nome", "slug", "status", "criado_em"]


class AuthRegisterSerializer(serializers.Serializer):
    nome = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)
    organizacao_nome = serializers.CharField(max_length=255)

    def validate_email(self, value):
        if Usuario.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Ja existe um usuario com este email.")
        return value.lower()


class AuthLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate_email(self, value):
        return value.lower()
