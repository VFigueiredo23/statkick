from django.db import models

from organizacoes.models import Organizacao


class Equipe(models.Model):
    organizacao = models.ForeignKey(Organizacao, on_delete=models.CASCADE, related_name="equipes")
    nome = models.CharField(max_length=255)
    brasao = models.ImageField(upload_to="equipes/brasoes/", blank=True, null=True)
    categoria_organizacao = models.CharField(max_length=120, blank=True)
    informacoes_analista = models.TextField(blank=True)

    def __str__(self) -> str:
        return self.nome
