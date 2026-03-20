import os

from rest_framework.exceptions import NotFound

from organizacoes.models import MembroOrganizacao, Organizacao


def obter_organizacao_padrao() -> Organizacao:
    slug = os.getenv("DEFAULT_ORGANIZACAO_SLUG", "").strip()
    if slug:
        organizacao = Organizacao.objects.filter(slug=slug).first()
        if organizacao is not None:
            return organizacao

    organizacao = Organizacao.objects.order_by("id").first()
    if organizacao is None:
        raise NotFound("Nenhuma organizacao disponivel.")
    return organizacao


def obter_organizacao_atual(request) -> Organizacao:
    usuario = getattr(request, "user", None)

    if usuario is None or not getattr(usuario, "is_authenticated", False):
        return obter_organizacao_padrao()

    membros = MembroOrganizacao.objects.select_related("organizacao").filter(usuario=usuario, ativo=True)
    organizacao_id = request.headers.get("X-Organizacao-Id", "").strip()
    organizacao_slug = request.headers.get("X-Organizacao-Slug", "").strip()

    if organizacao_id:
        membro = membros.filter(organizacao_id=organizacao_id).first()
        if membro is None:
            raise NotFound("Organizacao nao encontrada para este usuario.")
        return membro.organizacao

    if organizacao_slug:
        membro = membros.filter(organizacao__slug=organizacao_slug).first()
        if membro is None:
            raise NotFound("Organizacao nao encontrada para este usuario.")
        return membro.organizacao

    membro = membros.order_by("id").first()
    if membro is None:
        raise NotFound("Usuario sem organizacao ativa.")
    return membro.organizacao
