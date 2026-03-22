from django.contrib.auth import authenticate
from django.db import transaction
from rest_framework import permissions, status
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.views import APIView

from organizacoes.contexto import garantir_membro_na_organizacao_default
from organizacoes.models import MembroOrganizacao, Organizacao
from usuarios.models import Usuario
from usuarios.serializers import (
    AuthLoginSerializer,
    AuthRegisterSerializer,
    OrganizacaoResumoSerializer,
    UsuarioSerializer,
)


def montar_payload_auth(usuario: Usuario):
    membro_atual = garantir_membro_na_organizacao_default(usuario)
    membros = (
        MembroOrganizacao.objects.select_related("organizacao")
        .filter(usuario=usuario, ativo=True)
        .order_by("organizacao__nome", "id")
    )

    return {
        "usuario": UsuarioSerializer(usuario).data,
        "organizacoes": [
            {
                **OrganizacaoResumoSerializer(membro.organizacao).data,
                "papel": membro.papel,
            }
            for membro in membros
        ],
        "organizacao_atual": OrganizacaoResumoSerializer(membro_atual.organizacao).data if membro_atual else None,
    }


class AuthRegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    @transaction.atomic
    def post(self, request):
        serializer = AuthRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        dados = serializer.validated_data

        usuario = Usuario.objects.create_user(
            email=dados["email"],
            password=dados["password"],
            nome=dados["nome"],
        )
        organizacao = Organizacao.objects.create(nome=dados["organizacao_nome"])
        MembroOrganizacao.objects.create(
            usuario=usuario,
            organizacao=organizacao,
            papel=MembroOrganizacao.PAPEL_OWNER,
            ativo=True,
        )
        token = Token.objects.create(user=usuario)

        return Response(
            {
                "token": token.key,
                **montar_payload_auth(usuario),
            },
            status=status.HTTP_201_CREATED,
        )


class AuthLoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = AuthLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        usuario = authenticate(
            request=request,
            username=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
        )
        if usuario is None:
            return Response({"detail": "Email ou senha invalidos."}, status=status.HTTP_400_BAD_REQUEST)
        if not usuario.is_active:
            return Response({"detail": "Usuario inativo."}, status=status.HTTP_403_FORBIDDEN)

        Token.objects.filter(user=usuario).delete()
        token = Token.objects.create(user=usuario)

        return Response(
            {
                "token": token.key,
                **montar_payload_auth(usuario),
            }
        )


class AuthMeView(APIView):
    def get(self, request):
        return Response(montar_payload_auth(request.user))


class AuthLogoutView(APIView):
    def post(self, request):
        if request.auth is not None:
            request.auth.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class HealthCheckView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({"status": "ok"})
