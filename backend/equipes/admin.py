from django.contrib import admin

from equipes.models import Equipe


@admin.register(Equipe)
class EquipeAdmin(admin.ModelAdmin):
    list_display = ("id", "nome", "categoria_organizacao")
    search_fields = ("nome", "categoria_organizacao", "informacoes_analista")
