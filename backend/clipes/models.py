from django.db import models

from eventos.models import Evento


class Clipe(models.Model):
    evento = models.ForeignKey(Evento, on_delete=models.CASCADE, related_name="clipes")
    url_clipe = models.CharField(max_length=500)
    duracao = models.PositiveIntegerField()

    def __str__(self) -> str:
        return self.url_clipe
