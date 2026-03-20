from django.contrib import admin

from eventos.models import Evento


@admin.register(Evento)
class EventoAdmin(admin.ModelAdmin):
    list_display = ("id", "organizacao", "partida", "tipo_evento", "minuto", "segundo")
    list_filter = ("organizacao", "tipo_evento")
    search_fields = ("organizacao__nome", "partida__equipe_casa__nome", "partida__equipe_fora__nome", "tipo_evento", "observacoes")
