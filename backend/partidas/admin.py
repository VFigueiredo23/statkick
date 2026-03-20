from django.contrib import admin

from partidas.models import Partida


@admin.register(Partida)
class PartidaAdmin(admin.ModelAdmin):
    list_display = ("id", "organizacao", "equipe_casa", "equipe_fora", "competicao", "data", "tipo_video")
    list_filter = ("organizacao", "tipo_video", "competicao")
    search_fields = ("organizacao__nome", "equipe_casa__nome", "equipe_fora__nome", "competicao", "url_video")
