from django.contrib import admin

from jogadores.models import AvaliacaoJogador, Jogador


class AvaliacaoJogadorInline(admin.TabularInline):
    model = AvaliacaoJogador
    extra = 0
    fields = (
        "data_avaliacao",
        "tecnica",
        "fisico",
        "velocidade",
        "inteligencia_tatica",
        "competitividade",
        "potencial",
    )


@admin.register(Jogador)
class JogadorAdmin(admin.ModelAdmin):
    list_display = ("id", "nome", "organizacao", "equipe", "independente", "categoria_organizacao")
    list_filter = ("organizacao", "independente", "posicao")
    search_fields = ("nome", "organizacao__nome", "equipe__nome", "categoria_organizacao", "informacoes_analista")
    inlines = [AvaliacaoJogadorInline]
