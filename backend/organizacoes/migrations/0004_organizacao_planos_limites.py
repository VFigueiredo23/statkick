from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("organizacoes", "0003_conviteorganizacao"),
    ]

    operations = [
        migrations.AddField(
            model_name="organizacao",
            name="limite_armazenamento_bytes",
            field=models.BigIntegerField(default=5368709120),
        ),
        migrations.AddField(
            model_name="organizacao",
            name="limite_equipes",
            field=models.PositiveIntegerField(default=30),
        ),
        migrations.AddField(
            model_name="organizacao",
            name="limite_jogadores",
            field=models.PositiveIntegerField(default=200),
        ),
        migrations.AddField(
            model_name="organizacao",
            name="limite_membros",
            field=models.PositiveIntegerField(default=5),
        ),
        migrations.AddField(
            model_name="organizacao",
            name="limite_partidas",
            field=models.PositiveIntegerField(default=50),
        ),
        migrations.AddField(
            model_name="organizacao",
            name="plano",
            field=models.CharField(choices=[("teste", "Teste"), ("profissional", "Profissional"), ("empresa", "Empresa")], default="teste", max_length=20),
        ),
    ]
