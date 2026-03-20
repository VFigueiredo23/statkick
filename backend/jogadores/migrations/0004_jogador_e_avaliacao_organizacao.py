from django.db import migrations, models
import django.db.models.deletion


def preencher_organizacao(apps, schema_editor):
    Organizacao = apps.get_model("organizacoes", "Organizacao")
    Jogador = apps.get_model("jogadores", "Jogador")
    AvaliacaoJogador = apps.get_model("jogadores", "AvaliacaoJogador")

    organizacao = Organizacao.objects.get(slug="default")
    Jogador.objects.filter(organizacao__isnull=True).update(organizacao=organizacao)
    AvaliacaoJogador.objects.filter(organizacao__isnull=True).update(organizacao=organizacao)


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("organizacoes", "0002_seed_default_organization"),
        ("equipes", "0003_equipe_organizacao"),
        ("jogadores", "0003_jogador_foto_avaliacaojogador"),
    ]

    operations = [
        migrations.AddField(
            model_name="jogador",
            name="organizacao",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="jogadores", to="organizacoes.organizacao"),
        ),
        migrations.AddField(
            model_name="avaliacaojogador",
            name="organizacao",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="avaliacoes_jogadores", to="organizacoes.organizacao"),
        ),
        migrations.RunPython(preencher_organizacao, noop),
        migrations.AlterField(
            model_name="jogador",
            name="organizacao",
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="jogadores", to="organizacoes.organizacao"),
        ),
        migrations.AlterField(
            model_name="avaliacaojogador",
            name="organizacao",
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="avaliacoes_jogadores", to="organizacoes.organizacao"),
        ),
    ]
