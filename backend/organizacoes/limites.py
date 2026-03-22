from django.db.models import Sum
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from organizacoes.auditoria import registrar_auditoria
from organizacoes.models import AuditLog
from organizacoes.models import ConviteOrganizacao, MembroOrganizacao, Organizacao


def _percentual(utilizado: int, limite: int) -> float:
    if limite <= 0:
        return 100.0
    return round((utilizado / limite) * 100, 2)


def _capacidade(utilizado: int, limite: int, unidade: str):
    return {
        "utilizado": utilizado,
        "limite": limite,
        "restante": max(limite - utilizado, 0),
        "percentual": _percentual(utilizado, limite),
        "unidade": unidade,
    }


def calcular_uso_organizacao(organizacao: Organizacao):
    membros_ativos = organizacao.membros.filter(ativo=True).count()
    convites_pendentes = organizacao.convites.filter(
        status=ConviteOrganizacao.STATUS_PENDENTE,
        expira_em__gt=timezone.now(),
    ).count()
    equipes = organizacao.equipes.count()
    jogadores = organizacao.jogadores.count()
    partidas = organizacao.partidas.count()
    armazenamento_bytes = organizacao.partidas.aggregate(total=Sum("tamanho_armazenamento_video"))["total"] or 0

    onboarding = [
        {
            "id": "organizacao",
            "titulo": "Configurar organizacao",
            "descricao": "Defina o nome e prepare o workspace.",
            "concluido": bool(organizacao.nome.strip()),
        },
        {
            "id": "equipe",
            "titulo": "Cadastrar primeira equipe",
            "descricao": "Estruture a base inicial de clubes observados.",
            "concluido": equipes > 0,
        },
        {
            "id": "jogador",
            "titulo": "Cadastrar primeiro jogador",
            "descricao": "Monte o primeiro perfil scout do workspace.",
            "concluido": jogadores > 0,
        },
        {
            "id": "partida",
            "titulo": "Cadastrar primeira partida",
            "descricao": "Suba um video ou link para iniciar a analise.",
            "concluido": partidas > 0,
        },
        {
            "id": "membro",
            "titulo": "Trazer mais uma pessoa",
            "descricao": "Convide um colaborador para testar o fluxo multiusuario.",
            "concluido": membros_ativos > 1,
        },
    ]

    concluidos = sum(1 for item in onboarding if item["concluido"])

    return {
        "membros": _capacidade(membros_ativos, organizacao.limite_membros, "membros"),
        "convites_pendentes": convites_pendentes,
        "equipes": _capacidade(equipes, organizacao.limite_equipes, "equipes"),
        "jogadores": _capacidade(jogadores, organizacao.limite_jogadores, "jogadores"),
        "partidas": _capacidade(partidas, organizacao.limite_partidas, "partidas"),
        "armazenamento": _capacidade(armazenamento_bytes, organizacao.limite_armazenamento_bytes, "bytes"),
        "onboarding": {
            "total": len(onboarding),
            "concluidos": concluidos,
            "percentual": _percentual(concluidos, len(onboarding)),
            "etapas": onboarding,
        },
    }


def garantir_limite_entidade(organizacao: Organizacao, chave: str, incremento: int = 1):
    uso = calcular_uso_organizacao(organizacao)
    capacidade = uso[chave]
    if capacidade["utilizado"] + incremento > capacidade["limite"]:
        rotulos = {
            "equipes": "equipes",
            "jogadores": "jogadores",
            "partidas": "partidas",
        }
        raise ValidationError(f"Limite do plano atingido para {rotulos.get(chave, chave)}.")


def garantir_limite_membros(organizacao: Organizacao, incremento: int = 1, considerar_convites: bool = False):
    uso = calcular_uso_organizacao(organizacao)
    ocupacao = uso["membros"]["utilizado"] + incremento
    if considerar_convites:
        ocupacao += uso["convites_pendentes"]
    if ocupacao > uso["membros"]["limite"]:
        raise ValidationError("Limite de membros do plano atingido para esta organizacao.")


def garantir_limite_armazenamento(organizacao: Organizacao, bytes_adicionais: int):
    uso = calcular_uso_organizacao(organizacao)
    capacidade = uso["armazenamento"]
    if capacidade["utilizado"] + max(bytes_adicionais, 0) > capacidade["limite"]:
        raise ValidationError("Limite de armazenamento de videos do plano atingido para esta organizacao.")


def pode_editar_conteudo(membro: MembroOrganizacao | None):
    if membro is None:
        return False
    return membro.papel in {
        MembroOrganizacao.PAPEL_OWNER,
        MembroOrganizacao.PAPEL_ADMIN,
        MembroOrganizacao.PAPEL_ANALISTA,
    }


def registrar_limite_bloqueado(*, organizacao: Organizacao, usuario=None, chave: str, detalhe: str):
    registrar_auditoria(
        organizacao=organizacao,
        usuario=usuario,
        acao=AuditLog.ACAO_LIMITE_BLOQUEADO,
        recurso_tipo="limite",
        recurso_id=chave,
        descricao=detalhe,
        metadata={"chave": chave},
    )
