from django.utils import timezone
from rest_framework import serializers

from equipes.models import Equipe
from partidas.models import Partida


class PartidaSerializer(serializers.ModelSerializer):
    equipe_casa = serializers.PrimaryKeyRelatedField(queryset=Equipe.objects.all(), required=False)
    equipe_casa_nome = serializers.CharField(source="equipe_casa.nome", read_only=True)
    equipe_casa_nome_input = serializers.CharField(write_only=True, required=False, allow_blank=False)
    equipe_fora = serializers.PrimaryKeyRelatedField(queryset=Equipe.objects.all(), required=False)
    equipe_fora_nome = serializers.CharField(source="equipe_fora.nome", read_only=True)
    equipe_fora_nome_input = serializers.CharField(write_only=True, required=False, allow_blank=False)
    arquivo_video = serializers.FileField(required=False, allow_null=True)
    data = serializers.DateTimeField(required=False)

    def to_representation(self, instance):
        dados = super().to_representation(instance)
        if instance.tipo_video == Partida.TIPO_VIDEO_UPLOAD and instance.arquivo_video:
            dados["url_video"] = instance.arquivo_video.url
        return dados

    def _resolver_equipe_por_nome(self, nome: str) -> Equipe:
        equipe, _ = Equipe.objects.get_or_create(nome=nome.strip())
        return equipe

    def validate(self, attrs):
        tipo_video = attrs.get("tipo_video")
        arquivo_video = attrs.get("arquivo_video")
        url_video = attrs.get("url_video")
        equipe_casa = attrs.get("equipe_casa")
        equipe_fora = attrs.get("equipe_fora")
        equipe_casa_nome_input = attrs.pop("equipe_casa_nome_input", "").strip()
        equipe_fora_nome_input = attrs.pop("equipe_fora_nome_input", "").strip()

        if not equipe_casa and equipe_casa_nome_input:
            equipe_casa = self._resolver_equipe_por_nome(equipe_casa_nome_input)
            attrs["equipe_casa"] = equipe_casa

        if not equipe_fora and equipe_fora_nome_input:
            equipe_fora = self._resolver_equipe_por_nome(equipe_fora_nome_input)
            attrs["equipe_fora"] = equipe_fora

        if self.instance is None and (not equipe_casa or not equipe_fora):
            raise serializers.ValidationError("Informe os nomes ou ids das duas equipes.")

        if equipe_casa and equipe_fora and equipe_casa == equipe_fora:
            raise serializers.ValidationError("equipe_casa e equipe_fora precisam ser diferentes")

        if self.instance is not None:
            if tipo_video is None:
                tipo_video = self.instance.tipo_video
            if arquivo_video is None:
                arquivo_video = self.instance.arquivo_video
            if url_video is None:
                url_video = self.instance.url_video

        if tipo_video == Partida.TIPO_VIDEO_UPLOAD and not arquivo_video:
            raise serializers.ValidationError("Para tipo_video='upload', envie arquivo_video")

        if tipo_video == Partida.TIPO_VIDEO_LINK and not url_video:
            raise serializers.ValidationError("Para tipo_video='link', url_video e obrigatorio")

        return attrs

    def create(self, validated_data):
        arquivo_video = validated_data.get("arquivo_video")
        if validated_data.get("tipo_video") == Partida.TIPO_VIDEO_LINK:
            validated_data["arquivo_video"] = None
            validated_data["tamanho_armazenamento_video"] = 0
        elif arquivo_video:
            validated_data["url_video"] = ""
            validated_data["tamanho_armazenamento_video"] = arquivo_video.size
        validated_data.setdefault("data", timezone.now())
        return super().create(validated_data)

    def update(self, instance, validated_data):
        arquivo_video = validated_data.get("arquivo_video")
        tipo_video = validated_data.get("tipo_video", instance.tipo_video)

        if tipo_video == Partida.TIPO_VIDEO_LINK:
            if instance.arquivo_video:
                instance.arquivo_video.delete(save=False)
            validated_data["arquivo_video"] = None
            validated_data["tamanho_armazenamento_video"] = 0
        elif arquivo_video:
            validated_data["url_video"] = ""
            validated_data["tamanho_armazenamento_video"] = arquivo_video.size

        return super().update(instance, validated_data)

    class Meta:
        model = Partida
        fields = [
            "id",
            "equipe_casa",
            "equipe_casa_nome",
            "equipe_casa_nome_input",
            "equipe_fora",
            "equipe_fora_nome",
            "equipe_fora_nome_input",
            "competicao",
            "data",
            "tipo_video",
            "url_video",
            "arquivo_video",
            "tamanho_armazenamento_video",
        ]
