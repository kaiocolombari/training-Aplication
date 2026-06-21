import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("src/screen/avaliacao1.tsx"),
  route("avaliacao2", "src/screen/avaliacao2.tsx"),
  route("comparacao", "src/screen/comparacao.tsx"),
  route("prescricao", "src/screen/prescricao.tsx"),
  route("periodizacao", "src/screen/periodizacao.tsx"),
  route("volume", "src/screen/volume.tsx"),
  route("intensidade", "src/screen/intensidade.tsx"),
  route("salvar", "src/screen/salvar.tsx"),
] satisfies RouteConfig;