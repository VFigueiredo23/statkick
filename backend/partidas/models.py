from django.core.exceptions import ValidationError
from django.db import models

from equipes.models import Equipe


class Partida(models.Model):
    TIPO_VIDEO_UPLOAD = "upload"
    TIPO_VIDEO_LINK = "link"

    OPCOES_TIPO_VIDEO = [
        (TIPO_VIDEO_UPLOAD, "Upload"),
        (TIPO_VIDEO_LINK, "Link"),
    ]

    equipe_casa = models.ForeignKey(Equipe, on_delete=models.CASCADE, related_name="partidas_casa")
    equipe_fora = models.ForeignKey(Equipe, on_delete=models.CASCADE, related_name="partidas_fora")
    competicao = models.CharField(max_length=255)
    data = models.DateTimeField()
    tipo_video = models.CharField(max_length=10, choices=OPCOES_TIPO_VIDEO)
    url_video = models.CharField(max_length=500, blank=True)
    arquivo_video = models.FileField(upload_to="videos/", blank=True, null=True)
    tamanho_armazenamento_video = models.BigIntegerField(default=0)

    def clean(self):
        if self.equipe_casa_id and self.equipe_fora_id and self.equipe_casa_id == self.equipe_fora_id:
            raise ValidationError("equipe_casa e equipe_fora precisam ser diferentes")

        if self.tipo_video == self.TIPO_VIDEO_LINK and not self.url_video:
            raise ValidationError({"url_video": "Para tipo_video='link', url_video e obrigatorio"})

        if self.tipo_video == self.TIPO_VIDEO_UPLOAD and not self.arquivo_video:
            raise ValidationError({"arquivo_video": "Para tipo_video='upload', envie arquivo_video"})

    def save(self, *args, **kwargs):
        if self.tipo_video == self.TIPO_VIDEO_LINK:
            self.arquivo_video = None
            self.tamanho_armazenamento_video = 0
        elif self.arquivo_video:
            self.url_video = ""
            self.tamanho_armazenamento_video = self.arquivo_video.size

        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"{self.equipe_casa} x {self.equipe_fora}"
