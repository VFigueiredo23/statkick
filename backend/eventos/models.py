from django.core.exceptions import ValidationError
from django.db import models

from equipes.models import Equipe
from jogadores.models import Jogador
from organizacoes.models import Organizacao
from partidas.models import Partida


class Evento(models.Model):
    organizacao = models.ForeignKey(Organizacao, on_delete=models.CASCADE, related_name="eventos")
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

    def clean(self):
        if self.partida_id and self.organizacao_id and self.partida.organizacao_id != self.organizacao_id:
            raise ValidationError({"partida": "Partida precisa pertencer a mesma organizacao do evento."})
        if self.equipe_id and self.organizacao_id and self.equipe.organizacao_id != self.organizacao_id:
            raise ValidationError({"equipe": "Equipe precisa pertencer a mesma organizacao do evento."})
        if self.jogador_id and self.organizacao_id and self.jogador.organizacao_id != self.organizacao_id:
            raise ValidationError({"jogador": "Jogador precisa pertencer a mesma organizacao do evento."})

    def __str__(self) -> str:
        return f"{self.tipo_evento} - {self.minuto}:{self.segundo:02d}"
