from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils import timezone

from equipes.models import Equipe
from organizacoes.models import Organizacao


class Jogador(models.Model):
    organizacao = models.ForeignKey(Organizacao, on_delete=models.CASCADE, related_name="jogadores")
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
        if self.equipe_id and self.organizacao_id and self.equipe.organizacao_id != self.organizacao_id:
            raise ValidationError({"equipe": "Equipe precisa pertencer a mesma organizacao do jogador."})

    def __str__(self) -> str:
        return self.nome


class AvaliacaoJogador(models.Model):
    organizacao = models.ForeignKey(Organizacao, on_delete=models.CASCADE, related_name="avaliacoes_jogadores")
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

    def clean(self):
        if self.jogador_id and self.organizacao_id and self.jogador.organizacao_id != self.organizacao_id:
            raise ValidationError({"jogador": "Jogador precisa pertencer a mesma organizacao da avaliacao."})

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
