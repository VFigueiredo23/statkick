from django.db import migrations, models
import django.db.models.deletion


def preencher_organizacao(apps, schema_editor):
    Organizacao = apps.get_model("organizacoes", "Organizacao")
    Equipe = apps.get_model("equipes", "Equipe")

    organizacao = Organizacao.objects.get(slug="default")
    Equipe.objects.filter(organizacao__isnull=True).update(organizacao=organizacao)


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("organizacoes", "0002_seed_default_organization"),
        ("equipes", "0002_remove_equipe_pais_equipe_categoria_organizacao_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="equipe",
            name="organizacao",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="equipes", to="organizacoes.organizacao"),
        ),
        migrations.RunPython(preencher_organizacao, noop),
        migrations.AlterField(
            model_name="equipe",
            name="organizacao",
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="equipes", to="organizacoes.organizacao"),
        ),
    ]
