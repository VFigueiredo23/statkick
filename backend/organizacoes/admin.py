from django.contrib import admin

from organizacoes.models import MembroOrganizacao, Organizacao


@admin.register(Organizacao)
class OrganizacaoAdmin(admin.ModelAdmin):
    list_display = ("id", "nome", "slug", "status", "criado_em")
    search_fields = ("nome", "slug")
    list_filter = ("status",)


@admin.register(MembroOrganizacao)
class MembroOrganizacaoAdmin(admin.ModelAdmin):
    list_display = ("id", "organizacao", "usuario", "papel", "ativo", "criado_em")
    search_fields = ("organizacao__nome", "usuario__email", "usuario__nome")
    list_filter = ("papel", "ativo")
