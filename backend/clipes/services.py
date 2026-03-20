from eventos.models import Evento


class ServicoGeracaoClipe:
    """Ponto de extensao para geracao futura de clipes com FFmpeg."""

    def gerar_a_partir_evento(self, evento: Evento) -> dict:
        # Implementacao futura: extrair clipe ao redor do timestamp do evento via FFmpeg.
        raise NotImplementedError("Geracao de clipes sera implementada em uma versao futura.")
