from organizacoes.models import AuditLog, Organizacao


def registrar_auditoria(
    *,
    organizacao: Organizacao,
    acao: str,
    usuario=None,
    recurso_tipo: str = "",
    recurso_id: str | int | None = None,
    descricao: str = "",
    metadata: dict | None = None,
):
    return AuditLog.objects.create(
        organizacao=organizacao,
        usuario=usuario,
        acao=acao,
        recurso_tipo=recurso_tipo,
        recurso_id=str(recurso_id or ""),
        descricao=descricao,
        metadata=metadata or {},
    )
