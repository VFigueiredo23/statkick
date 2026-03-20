from django.db import migrations, models
import django.db.models.deletion


def preencher_organizacao(apps, schema_editor):
    Organizacao = apps.get_model("organizacoes", "Organizacao")
    Partida = apps.get_model("partidas", "Partida")

    organizacao = Organizacao.objects.get(slug="default")
    Partida.objects.filter(organizacao__isnull=True).update(organizacao=organizacao)


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("organizacoes", "0002_seed_default_organization"),
        ("equipes", "0003_equipe_organizacao"),
        ("partidas", "0002_partida_arquivo_video"),
    ]

    operations = [
        migrations.AddField(
            model_name="partida",
            name="organizacao",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="partidas", to="organizacoes.organizacao"),
        ),
        migrations.RunPython(preencher_organizacao, noop),
        migrations.AlterField(
            model_name="partida",
            name="organizacao",
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="partidas", to="organizacoes.organizacao"),
        ),
    ]
