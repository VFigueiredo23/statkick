from django.conf import settings
from django.db import models
from django.utils.text import slugify


class Organizacao(models.Model):
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
