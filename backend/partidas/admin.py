from django.contrib import admin

from partidas.models import Partida


@admin.register(Partida)
class PartidaAdmin(admin.ModelAdmin):
    list_display = ("id", "equipe_casa", "equipe_fora", "competicao", "data", "tipo_video")
    list_filter = ("tipo_video", "competicao")
    search_fields = ("equipe_casa__nome", "equipe_fora__nome", "competicao", "url_video")
