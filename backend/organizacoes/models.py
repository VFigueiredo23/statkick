from django.conf import settings
from django.db import models
from django.utils.text import slugify
import uuid


class Organizacao(models.Model):
    PLANO_TESTE = "teste"
    PLANO_PROFISSIONAL = "profissional"
    PLANO_EMPRESA = "empresa"

    OPCOES_PLANO = [
        (PLANO_TESTE, "Teste"),
        (PLANO_PROFISSIONAL, "Profissional"),
        (PLANO_EMPRESA, "Empresa"),
    ]

    STATUS_TESTE = "teste"
    STATUS_ATIVA = "ativa"
    STATUS_SUSPENSA = "suspensa"

    OPCOES_STATUS = [
        (STATUS_TESTE, "Teste"),
        (STATUS_ATIVA, "Ativa"),
        (STATUS_SUSPENSA, "Suspensa"),
    ]

    nome = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    plano = models.CharField(max_length=20, choices=OPCOES_PLANO, default=PLANO_TESTE)
    limite_membros = models.PositiveIntegerField(default=5)
    limite_equipes = models.PositiveIntegerField(default=30)
    limite_jogadores = models.PositiveIntegerField(default=200)
    limite_partidas = models.PositiveIntegerField(default=50)
    limite_armazenamento_bytes = models.BigIntegerField(default=5 * 1024 * 1024 * 1024)
    status = models.CharField(max_length=20, choices=OPCOES_STATUS, default=STATUS_TESTE)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["nome", "id"]
        verbose_name = "organizacao"
        verbose_name_plural = "organizacoes"

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.nome) or "organizacao"
            slug = base_slug
            indice = 2
            while Organizacao.objects.exclude(pk=self.pk).filter(slug=slug).exists():
                slug = f"{base_slug}-{indice}"
                indice += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return self.nome


class MembroOrganizacao(models.Model):
    PAPEL_OWNER = "owner"
    PAPEL_ADMIN = "admin"
    PAPEL_ANALISTA = "analista"
    PAPEL_VIEWER = "viewer"

    OPCOES_PAPEL = [
        (PAPEL_OWNER, "Owner"),
        (PAPEL_ADMIN, "Admin"),
        (PAPEL_ANALISTA, "Analista"),
        (PAPEL_VIEWER, "Viewer"),
    ]

    organizacao = models.ForeignKey(Organizacao, on_delete=models.CASCADE, related_name="membros")
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="membros_organizacao")
    papel = models.CharField(max_length=20, choices=OPCOES_PAPEL, default=PAPEL_ANALISTA)
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["organizacao__nome", "usuario__email", "id"]
        constraints = [
            models.UniqueConstraint(fields=["organizacao", "usuario"], name="uq_membro_organizacao_usuario")
        ]
        verbose_name = "membro da organizacao"
        verbose_name_plural = "membros da organizacao"

    def __str__(self) -> str:
        return f"{self.usuario} @ {self.organizacao}"


class ConviteOrganizacao(models.Model):
    STATUS_PENDENTE = "pendente"
    STATUS_ACEITO = "aceito"
    STATUS_CANCELADO = "cancelado"
    STATUS_EXPIRADO = "expirado"

    OPCOES_STATUS = [
        (STATUS_PENDENTE, "Pendente"),
        (STATUS_ACEITO, "Aceito"),
        (STATUS_CANCELADO, "Cancelado"),
        (STATUS_EXPIRADO, "Expirado"),
    ]

    organizacao = models.ForeignKey(Organizacao, on_delete=models.CASCADE, related_name="convites")
    email = models.EmailField()
    papel = models.CharField(max_length=20, choices=MembroOrganizacao.OPCOES_PAPEL, default=MembroOrganizacao.PAPEL_ANALISTA)
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    status = models.CharField(max_length=20, choices=OPCOES_STATUS, default=STATUS_PENDENTE)
    criado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="convites_criados",
    )
    aceito_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="convites_aceitos",
    )
    expira_em = models.DateTimeField()
    respondido_em = models.DateTimeField(null=True, blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-criado_em", "-id"]
        verbose_name = "convite da organizacao"
        verbose_name_plural = "convites da organizacao"

    def __str__(self) -> str:
        return f"{self.email} -> {self.organizacao}"


class AuditLog(models.Model):
    ACAO_AUTH_LOGIN = "auth.login"
    ACAO_AUTH_REGISTER = "auth.register"
    ACAO_ORGANIZACAO_ATUALIZADA = "organizacao.atualizada"
    ACAO_CONVITE_CRIADO = "convite.criado"
    ACAO_CONVITE_CANCELADO = "convite.cancelado"
    ACAO_CONVITE_ACEITO = "convite.aceito"
    ACAO_MEMBRO_ATUALIZADO = "membro.atualizado"
    ACAO_EQUIPE_CRIADA = "equipe.criada"
    ACAO_JOGADOR_CRIADO = "jogador.criado"
    ACAO_AVALIACAO_CRIADA = "avaliacao.criada"
    ACAO_PARTIDA_CRIADA = "partida.criada"
    ACAO_PARTIDA_ATUALIZADA = "partida.atualizada"
    ACAO_PARTIDA_EXCLUIDA = "partida.excluida"
    ACAO_EVENTO_CRIADO = "evento.criado"
    ACAO_LIMITE_BLOQUEADO = "limite.bloqueado"

    organizacao = models.ForeignKey(Organizacao, on_delete=models.CASCADE, related_name="auditorias")
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="auditorias",
    )
    acao = models.CharField(max_length=80)
    recurso_tipo = models.CharField(max_length=80, blank=True)
    recurso_id = models.CharField(max_length=80, blank=True)
    descricao = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-criado_em", "-id"]
        verbose_name = "log de auditoria"
        verbose_name_plural = "logs de auditoria"

    def __str__(self) -> str:
        return f"{self.organizacao} - {self.acao}"
