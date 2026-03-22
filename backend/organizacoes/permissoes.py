from rest_framework.permissions import SAFE_METHODS, BasePermission

from organizacoes.contexto import obter_membro_atual, obter_organizacao_atual
from organizacoes.models import MembroOrganizacao


PAPEIS_GESTAO = {
    MembroOrganizacao.PAPEL_OWNER,
    MembroOrganizacao.PAPEL_ADMIN,
}

PAPEIS_EDICAO_CONTEUDO = {
    MembroOrganizacao.PAPEL_OWNER,
    MembroOrganizacao.PAPEL_ADMIN,
    MembroOrganizacao.PAPEL_ANALISTA,
}


def obter_papel_usuario(request):
    if request.user is None or not request.user.is_authenticated:
        return None

    organizacao = obter_organizacao_atual(request)
    membro = obter_membro_atual(request, organizacao)
    return membro.papel if membro is not None else None


class IsOrganizacaoMembro(BasePermission):
    def has_permission(self, request, view):
        if request.user is None or not request.user.is_authenticated:
            return False
        organizacao = obter_organizacao_atual(request)
        return obter_membro_atual(request, organizacao) is not None


class CanAccessScoutingData(BasePermission):
    def has_permission(self, request, view):
        if request.user is None or not request.user.is_authenticated:
            return False

        papel = obter_papel_usuario(request)
        if papel is None:
            return False

        if request.method in SAFE_METHODS:
            return True

        return papel in PAPEIS_EDICAO_CONTEUDO


class CanManageOrganization(BasePermission):
    def has_permission(self, request, view):
        if request.user is None or not request.user.is_authenticated:
            return False
        return obter_papel_usuario(request) in PAPEIS_GESTAO
