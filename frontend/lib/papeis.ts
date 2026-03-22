export function rotuloPapel(papel: string | null | undefined) {
  switch (papel) {
    case "owner":
      return "Proprietario";
    case "admin":
      return "Administrador";
    case "analista":
      return "Analista";
    case "viewer":
      return "Visualizador";
    default:
      return papel ?? "-";
  }
}

export function rotuloPlano(plano: string | null | undefined) {
  switch (plano) {
    case "teste":
      return "Plano de teste";
    case "profissional":
      return "Plano profissional";
    case "empresa":
      return "Plano empresa";
    default:
      return plano ?? "-";
  }
}
