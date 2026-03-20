from django.contrib import admin

from equipes.models import Equipe


@admin.register(Equipe)
class EquipeAdmin(admin.ModelAdmin):
    list_display = ("id", "nome", "organizacao", "categoria_organizacao")
    search_fields = ("nome", "organizacao__nome", "categoria_organizacao", "informacoes_analista")
