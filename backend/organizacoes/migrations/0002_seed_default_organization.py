from django.db import migrations


def seed_default_organization(apps, schema_editor):
    Organizacao = apps.get_model("organizacoes", "Organizacao")
    Usuario = apps.get_model("usuarios", "Usuario")
    MembroOrganizacao = apps.get_model("organizacoes", "MembroOrganizacao")

    organizacao, _ = Organizacao.objects.get_or_create(
        slug="default",
        defaults={"nome": "Organizacao Default", "status": "teste"},
    )

    for usuario in Usuario.objects.all():
        papel = "owner" if usuario.is_superuser else "admin"
        MembroOrganizacao.objects.get_or_create(
            organizacao=organizacao,
            usuario=usuario,
            defaults={"papel": papel, "ativo": True},
        )


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("organizacoes", "0001_initial"),
        ("usuarios", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_default_organization, noop),
    ]
