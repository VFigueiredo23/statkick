from datetime import timedelta

from django.db import transaction
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from organizacoes.contexto import obter_membro_atual, obter_organizacao_atual
from organizacoes.models import ConviteOrganizacao, MembroOrganizacao
from organizacoes.permissoes import CanManageOrganization, IsOrganizacaoMembro
from organizacoes.serializers import (
    ConviteOrganizacaoCriacaoSerializer,
    ConviteOrganizacaoSerializer,
    ConvitePublicoSerializer,
    MembroOrganizacaoAtualizacaoSerializer,
    MembroOrganizacaoSerializer,
    OrganizacaoAtualizacaoSerializer,
    OrganizacaoDetalheSerializer,
)


def validar_gestao_owner(membro_alvo: MembroOrganizacao, membro_executor: MembroOrganizacao, novo_papel: str | None, novo_ativo: bool | None):
    if membro_alvo.papel == MembroOrganizacao.PAPEL_OWNER and membro_executor.papel != MembroOrganizacao.PAPEL_OWNER:
        raise PermissionDenied("Apenas proprietarios podem alterar outro proprietario.")

    if novo_papel == MembroOrganizacao.PAPEL_OWNER and membro_executor.papel != MembroOrganizacao.PAPEL_OWNER:
        raise PermissionDenied("Apenas proprietarios podem promover um membro para proprietario.")

    if membro_alvo.papel == MembroOrganizacao.PAPEL_OWNER:
        removendo_owner = novo_papel not in {None, MembroOrganizacao.PAPEL_OWNER} or novo_ativo is False
        if removendo_owner:
            owners_ativos = MembroOrganizacao.objects.filter(
                organizacao=membro_alvo.organizacao,
                papel=MembroOrganizacao.PAPEL_OWNER,
                ativo=True,
            ).count()
            if owners_ativos <= 1:
                raise ValidationError("A organizacao precisa manter pelo menos um proprietario ativo.")


class OrganizacaoAtualView(APIView):
    permission_classes = [IsOrganizacaoMembro]

    def get(self, request):
        organizacao = obter_organizacao_atual(request)
        serializer = OrganizacaoDetalheSerializer(organizacao, context={"request": request})
        return Response(serializer.data)

    def patch(self, request):
        organizacao = obter_organizacao_atual(request)
        membro = obter_membro_atual(request, organizacao)
        if membro is None or membro.papel not in {MembroOrganizacao.PAPEL_OWNER, MembroOrganizacao.PAPEL_ADMIN}:
            raise PermissionDenied("Voce nao pode alterar esta organizacao.")

        serializer = OrganizacaoAtualizacaoSerializer(organizacao, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(OrganizacaoDetalheSerializer(organizacao, context={"request": request}).data)


class OrganizacaoMembrosView(APIView):
    permission_classes = [IsOrganizacaoMembro]

    def get(self, request):
        organizacao = obter_organizacao_atual(request)
        membros = (
            organizacao.membros.select_related("usuario")
            .filter(ativo=True)
            .order_by("papel", "usuario__nome", "usuario__email", "id")
        )
        return Response(MembroOrganizacaoSerializer(membros, many=True).data)


class OrganizacaoMembroDetalheView(APIView):
    permission_classes = [CanManageOrganization]

    @transaction.atomic
    def patch(self, request, membro_id: int):
        organizacao = obter_organizacao_atual(request)
        membro_executor = obter_membro_atual(request, organizacao)
        membro_alvo = organizacao.membros.select_related("usuario").filter(id=membro_id).first()

        if membro_alvo is None:
            raise ValidationError("Membro nao encontrado para a organizacao atual.")

        serializer = MembroOrganizacaoAtualizacaoSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        dados = serializer.validated_data

        novo_papel = dados.get("papel")
        novo_ativo = dados.get("ativo")
        validar_gestao_owner(membro_alvo, membro_executor, novo_papel, novo_ativo)

        for campo, valor in dados.items():
            setattr(membro_alvo, campo, valor)
        membro_alvo.save(update_fields=[*dados.keys()])

        return Response(MembroOrganizacaoSerializer(membro_alvo).data)


class OrganizacaoConvitesView(APIView):
    permission_classes = [IsOrganizacaoMembro]

    def get(self, request):
        organizacao = obter_organizacao_atual(request)
        convites = organizacao.convites.select_related("criado_por").all()
        serializer = ConviteOrganizacaoSerializer(
            convites,
            many=True,
            context={"request": request, "frontend_base_url": request.headers.get("Origin", "").strip()},
        )
        return Response(serializer.data)

    @transaction.atomic
    def post(self, request):
        organizacao = obter_organizacao_atual(request)
        membro = obter_membro_atual(request, organizacao)
        if membro is None or membro.papel not in {MembroOrganizacao.PAPEL_OWNER, MembroOrganizacao.PAPEL_ADMIN}:
            raise PermissionDenied("Voce nao pode convidar membros para esta organizacao.")

        serializer = ConviteOrganizacaoCriacaoSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        convite = ConviteOrganizacao.objects.create(
            organizacao=organizacao,
            email=serializer.validated_data["email"],
            papel=serializer.validated_data["papel"],
            criado_por=request.user,
            expira_em=timezone.now() + timedelta(days=7),
        )

        return Response(
            ConviteOrganizacaoSerializer(
                convite,
                context={"request": request, "frontend_base_url": request.headers.get("Origin", "").strip()},
            ).data,
            status=status.HTTP_201_CREATED,
        )


class ConviteDetalheView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, token):
        convite = ConviteOrganizacao.objects.select_related("organizacao").filter(token=token).first()
        if convite is None:
            return Response({"detail": "Convite nao encontrado."}, status=status.HTTP_404_NOT_FOUND)

        if convite.status == ConviteOrganizacao.STATUS_PENDENTE and convite.expira_em <= timezone.now():
            convite.status = ConviteOrganizacao.STATUS_EXPIRADO
            convite.respondido_em = timezone.now()
            convite.save(update_fields=["status", "respondido_em"])

        return Response(ConvitePublicoSerializer(convite, context={"request": request}).data)


class ConviteAceitarView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request, token):
        convite = ConviteOrganizacao.objects.select_related("organizacao").filter(token=token).first()
        if convite is None:
            return Response({"detail": "Convite nao encontrado."}, status=status.HTTP_404_NOT_FOUND)
        if convite.status != ConviteOrganizacao.STATUS_PENDENTE:
            return Response({"detail": "Este convite nao esta mais disponivel."}, status=status.HTTP_400_BAD_REQUEST)
        if convite.expira_em <= timezone.now():
            convite.status = ConviteOrganizacao.STATUS_EXPIRADO
            convite.respondido_em = timezone.now()
            convite.save(update_fields=["status", "respondido_em"])
            return Response({"detail": "Este convite expirou."}, status=status.HTTP_400_BAD_REQUEST)
        if request.user.email.lower() != convite.email.lower():
            return Response(
                {"detail": "Este convite foi emitido para outro email."},
                status=status.HTTP_403_FORBIDDEN,
            )

        membro, _ = MembroOrganizacao.objects.update_or_create(
            organizacao=convite.organizacao,
            usuario=request.user,
            defaults={"papel": convite.papel, "ativo": True},
        )

        convite.status = ConviteOrganizacao.STATUS_ACEITO
        convite.aceito_por = request.user
        convite.respondido_em = timezone.now()
        convite.save(update_fields=["status", "aceito_por", "respondido_em"])

        return Response(MembroOrganizacaoSerializer(membro).data)


class ConviteCancelarView(APIView):
    permission_classes = [CanManageOrganization]

    @transaction.atomic
    def post(self, request, token):
        organizacao = obter_organizacao_atual(request)
        convite = organizacao.convites.filter(token=token).first()
        if convite is None:
            return Response({"detail": "Convite nao encontrado."}, status=status.HTTP_404_NOT_FOUND)
        if convite.status != ConviteOrganizacao.STATUS_PENDENTE:
            return Response({"detail": "Somente convites pendentes podem ser cancelados."}, status=status.HTTP_400_BAD_REQUEST)

        convite.status = ConviteOrganizacao.STATUS_CANCELADO
        convite.respondido_em = timezone.now()
        convite.save(update_fields=["status", "respondido_em"])
        return Response(ConviteOrganizacaoSerializer(convite, context={"request": request}).data)
