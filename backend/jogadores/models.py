from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils import timezone

from equipes.models import Equipe


class Jogador(models.Model):
    nome = models.CharField(max_length=255)
    posicao = models.CharField(max_length=50)
    equipe = models.ForeignKey(Equipe, on_delete=models.CASCADE, related_name="jogadores", null=True, blank=True)
    idade = models.PositiveIntegerField()
    independente = models.BooleanField(default=False)
    categoria_organizacao = models.CharField(max_length=120, blank=True)
    informacoes_analista = models.TextField(blank=True)
    foto = models.ImageField(upload_to="jogadores/fotos/", blank=True, null=True)

    def clean(self):
        if not self.independente and self.equipe is None:
            raise ValidationError({"equipe": "Jogador nao independente precisa ter equipe vinculada."})

    def __str__(self) -> str:
        return self.nome


class AvaliacaoJogador(models.Model):
    jogador = models.ForeignKey(Jogador, on_delete=models.CASCADE, related_name="avaliacoes")
    data_avaliacao = models.DateTimeField(default=timezone.now)
    observacoes = models.TextField(blank=True)
    tecnica = models.PositiveSmallIntegerField(validators=[MinValueValidator(0), MaxValueValidator(99)])
    fisico = models.PositiveSmallIntegerField(validators=[MinValueValidator(0), MaxValueValidator(99)])
    velocidade = models.PositiveSmallIntegerField(validators=[MinValueValidator(0), MaxValueValidator(99)])
    inteligencia_tatica = models.PositiveSmallIntegerField(validators=[MinValueValidator(0), MaxValueValidator(99)])
    competitividade = models.PositiveSmallIntegerField(validators=[MinValueValidator(0), MaxValueValidator(99)])
    potencial = models.PositiveSmallIntegerField(validators=[MinValueValidator(0), MaxValueValidator(99)])

    class Meta:
        ordering = ["-data_avaliacao", "-id"]
        verbose_name = "avaliacao do jogador"
        verbose_name_plural = "avaliacoes dos jogadores"

    @property
    def nota_geral(self) -> int:
        atributos = [
            self.tecnica,
            self.fisico,
            self.velocidade,
            self.inteligencia_tatica,
            self.competitividade,
            self.potencial,
        ]
        return round(sum(atributos) / len(atributos))

    def __str__(self) -> str:
        return f"{self.jogador.nome} - {self.data_avaliacao:%d/%m/%Y}"
