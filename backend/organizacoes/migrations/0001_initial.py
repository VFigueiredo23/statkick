from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Organizacao",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("nome", models.CharField(max_length=255)),
                ("slug", models.SlugField(max_length=255, unique=True)),
                ("status", models.CharField(choices=[("teste", "Teste"), ("ativa", "Ativa"), ("suspensa", "Suspensa")], default="teste", max_length=20)),
                ("criado_em", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "verbose_name": "organizacao",
                "verbose_name_plural": "organizacoes",
                "ordering": ["nome", "id"],
            },
        ),
        migrations.CreateModel(
            name="MembroOrganizacao",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("papel", models.CharField(choices=[("owner", "Owner"), ("admin", "Admin"), ("analista", "Analista"), ("viewer", "Viewer")], default="analista", max_length=20)),
                ("ativo", models.BooleanField(default=True)),
                ("criado_em", models.DateTimeField(auto_now_add=True)),
                ("organizacao", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="membros", to="organizacoes.organizacao")),
                ("usuario", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="membros_organizacao", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "verbose_name": "membro da organizacao",
                "verbose_name_plural": "membros da organizacao",
                "ordering": ["organizacao__nome", "usuario__email", "id"],
            },
        ),
        migrations.AddConstraint(
            model_name="membroorganizacao",
            constraint=models.UniqueConstraint(fields=("organizacao", "usuario"), name="uq_membro_organizacao_usuario"),
        ),
    ]
