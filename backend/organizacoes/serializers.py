from django.utils import timezone
from rest_framework import serializers

from organizacoes.contexto import obter_membro_atual, obter_organizacao_atual
from organizacoes.models import ConviteOrganizacao, MembroOrganizacao, Organizacao
from usuarios.models import Usuario
from usuarios.serializers import UsuarioSerializer


class OrganizacaoDetalheSerializer(serializers.ModelSerializer):
    papel_atual = serializers.SerializerMethodField()
    pode_gerir = serializers.SerializerMethodField()
    pode_editar_conteudo = serializers.SerializerMethodField()
    total_membros = serializers.SerializerMethodField()

    class Meta:
        model = Organizacao
        fields = [
            "id",
            "nome",
            "slug",
            "status",
            "criado_em",
            "papel_atual",
            "pode_gerir",
            "pode_editar_conteudo",
            "total_membros",
        ]

    def get_papel_atual(self, obj: Organizacao):
        request = self.context.get("request")
        membro = obter_membro_atual(request, obj) if request is not None else None
        return membro.papel if membro is not None else None

    def get_pode_gerir(self, obj: Organizacao):
        papel = self.get_papel_atual(obj)
        return papel in {MembroOrganizacao.PAPEL_OWNER, MembroOrganizacao.PAPEL_ADMIN}

    def get_pode_editar_conteudo(self, obj: Organizacao):
        papel = self.get_papel_atual(obj)
        return papel in {
            MembroOrganizacao.PAPEL_OWNER,
            MembroOrganizacao.PAPEL_ADMIN,
            MembroOrganizacao.PAPEL_ANALISTA,
        }

    def get_total_membros(self, obj: Organizacao):
        return obj.membros.filter(ativo=True).count()


class OrganizacaoAtualizacaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organizacao
        fields = ["nome"]


class MembroOrganizacaoSerializer(serializers.ModelSerializer):
    usuario = UsuarioSerializer(read_only=True)

    class Meta:
        model = MembroOrganizacao
        fields = ["id", "papel", "ativo", "criado_em", "usuario"]


class MembroOrganizacaoAtualizacaoSerializer(serializers.Serializer):
    papel = serializers.ChoiceField(choices=MembroOrganizacao.OPCOES_PAPEL, required=False)
    ativo = serializers.BooleanField(required=False)

    def validate(self, attrs):
        if not attrs:
            raise serializers.ValidationError("Informe ao menos um campo para atualizar.")
        return attrs


class ConviteOrganizacaoSerializer(serializers.ModelSerializer):
    criado_por = UsuarioSerializer(read_only=True)
    link_convite = serializers.SerializerMethodField()

    class Meta:
        model = ConviteOrganizacao
        fields = [
            "id",
            "email",
            "papel",
            "status",
            "token",
            "link_convite",
            "expira_em",
            "respondido_em",
            "criado_em",
            "criado_por",
        ]

    def get_link_convite(self, obj: ConviteOrganizacao):
        request = self.context.get("request")
        base_url = self.context.get("frontend_base_url")

        if request is not None:
            origin = request.headers.get("Origin", "").strip()
            if origin:
                base_url = origin

        if not base_url:
            return f"/convites/{obj.token}"

        return f"{base_url.rstrip('/')}/convites/{obj.token}"


class ConviteOrganizacaoCriacaoSerializer(serializers.Serializer):
    email = serializers.EmailField()
    papel = serializers.ChoiceField(choices=MembroOrganizacao.OPCOES_PAPEL)

    def validate_email(self, value):
        return value.lower()

    def validate(self, attrs):
        request = self.context["request"]
        organizacao = obter_organizacao_atual(request)
        email = attrs["email"]

        if MembroOrganizacao.objects.filter(
            organizacao=organizacao,
            usuario__email__iexact=email,
            ativo=True,
        ).exists():
            raise serializers.ValidationError("Este email ja faz parte da organizacao.")

        convite_pendente = ConviteOrganizacao.objects.filter(
            organizacao=organizacao,
            email__iexact=email,
            status=ConviteOrganizacao.STATUS_PENDENTE,
            expira_em__gt=timezone.now(),
        ).exists()
        if convite_pendente:
            raise serializers.ValidationError("Ja existe um convite pendente para este email.")

        return attrs


class ConvitePublicoSerializer(serializers.ModelSerializer):
    organizacao = OrganizacaoDetalheSerializer(read_only=True)

    class Meta:
        model = ConviteOrganizacao
        fields = ["email", "papel", "status", "expira_em", "criado_em", "organizacao"]
