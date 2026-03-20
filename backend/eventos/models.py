from django.db import models

from equipes.models import Equipe
from jogadores.models import Jogador
from partidas.models import Partida


class Evento(models.Model):
    partida = models.ForeignKey(Partida, on_delete=models.CASCADE, related_name="eventos")
    equipe = models.ForeignKey(Equipe, on_delete=models.SET_NULL, null=True, blank=True)
    jogador = models.ForeignKey(Jogador, on_delete=models.SET_NULL, null=True, blank=True)
    tipo_evento = models.CharField(max_length=100)
    minuto = models.PositiveIntegerField(default=0)
    segundo = models.PositiveIntegerField(default=0)
    posicao_x = models.FloatField(null=True, blank=True)
    posicao_y = models.FloatField(null=True, blank=True)
    observacoes = models.TextField(blank=True)

    class Meta:
        ordering = ["minuto", "segundo", "id"]

    def __str__(self) -> str:
        return f"{self.tipo_evento} - {self.minuto}:{self.segundo:02d}"
