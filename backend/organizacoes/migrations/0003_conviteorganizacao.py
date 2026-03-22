from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):
    dependencies = [
        ("organizacoes", "0002_seed_default_organization"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="ConviteOrganizacao",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("email", models.EmailField(max_length=254)),
                (
                    "papel",
                    models.CharField(
                        choices=[("owner", "Owner"), ("admin", "Admin"), ("analista", "Analista"), ("viewer", "Viewer")],
                        default="analista",
                        max_length=20,
                    ),
                ),
                ("token", models.UUIDField(default=uuid.uuid4, editable=False, unique=True)),
                (
                    "status",
                    models.CharField(
                        choices=[("pendente", "Pendente"), ("aceito", "Aceito"), ("cancelado", "Cancelado"), ("expirado", "Expirado")],
                        default="pendente",
                        max_length=20,
                    ),
                ),
                ("expira_em", models.DateTimeField()),
                ("respondido_em", models.DateTimeField(blank=True, null=True)),
                ("criado_em", models.DateTimeField(auto_now_add=True)),
                (
                    "aceito_por",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="convites_aceitos",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "criado_por",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="convites_criados",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "organizacao",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="convites",
                        to="organizacoes.organizacao",
                    ),
                ),
            ],
            options={
                "verbose_name": "convite da organizacao",
                "verbose_name_plural": "convites da organizacao",
                "ordering": ["-criado_em", "-id"],
            },
        ),
    ]
