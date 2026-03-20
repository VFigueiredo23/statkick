from django.db import migrations, models
import django.db.models.deletion


def preencher_organizacao(apps, schema_editor):
    Organizacao = apps.get_model("organizacoes", "Organizacao")
    Evento = apps.get_model("eventos", "Evento")

    organizacao = Organizacao.objects.get(slug="default")
    Evento.objects.filter(organizacao__isnull=True).update(organizacao=organizacao)


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("organizacoes", "0002_seed_default_organization"),
        ("equipes", "0003_equipe_organizacao"),
        ("jogadores", "0004_jogador_e_avaliacao_organizacao"),
        ("partidas", "0003_partida_organizacao"),
        ("eventos", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="evento",
            name="organizacao",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="eventos", to="organizacoes.organizacao"),
        ),
        migrations.RunPython(preencher_organizacao, noop),
        migrations.AlterField(
            model_name="evento",
            name="organizacao",
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="eventos", to="organizacoes.organizacao"),
        ),
    ]
