
import {
  type RouteConfig,
  index,
  route,
  layout,
} from "@react-router/dev/routes";

export default [
  index("src/screen/painel.tsx"),

  // Rotas que possuem navegação entre etapas
  layout("src/components/AvaliacaoLayout.tsx", [
    route("avaliacao1", "src/screen/avaliacao1.tsx"),
    route("avaliacao2", "src/screen/avaliacao2.tsx"),
    route("comparacao", "src/screen/comparacao.tsx"),
    route("prescricao", "src/screen/prescricao.tsx"),
    route("periodizacao", "src/screen/periodizacao.tsx"),
    route("volume", "src/screen/volume.tsx"),
    route("intensidade", "src/screen/intensidade.tsx"),
    route("salvar", "src/screen/salvar.tsx"),
  ]),

  // Rotas independentes
  route("login", "src/screen/login.tsx"),
  route("register", "src/screen/register.tsx"),

] satisfies RouteConfig;
