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
