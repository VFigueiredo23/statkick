from django.conf import settings
from django.contrib import admin
from django.urls import include, path, re_path
from django.views.static import serve
from rest_framework.routers import DefaultRouter

from equipes.views import EquipeViewSet
from eventos.views import EventoViewSet
from jogadores.views import AvaliacaoJogadorViewSet, JogadorViewSet
from partidas.views import PartidaViewSet

router = DefaultRouter(trailing_slash=False)
router.register("partidas", PartidaViewSet, basename="partida")
router.register("eventos", EventoViewSet, basename="evento")
router.register("equipes", EquipeViewSet, basename="equipe")
router.register("jogadores", JogadorViewSet, basename="jogador")
router.register("avaliacoes-jogador", AvaliacaoJogadorViewSet, basename="avaliacao-jogador")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", include(router.urls)),
    re_path(r"^media/(?P<path>.*)$", serve, {"document_root": settings.MEDIA_ROOT}),
]
