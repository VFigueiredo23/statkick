from django.db import models


class Equipe(models.Model):
    nome = models.CharField(max_length=255)
    brasao = models.ImageField(upload_to="equipes/brasoes/", blank=True, null=True)
    categoria_organizacao = models.CharField(max_length=120, blank=True)
    informacoes_analista = models.TextField(blank=True)

    def __str__(self) -> str:
        return self.nome
