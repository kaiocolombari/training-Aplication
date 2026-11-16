import {
  type RouteConfig,
  index,
  route,
  layout,
} from "@react-router/dev/routes";

export default [
  layout("src/components/ProtectedLayout.tsx", [
    index("src/screen/painel.tsx"),
    route("acesso-negado", "src/screen/acessoNegado.tsx"),
    route("cadastro/formulario", "src/screen/formularioCadastro.tsx"),
    route("cadastro/aguardando", "src/screen/cadastroAguardando.tsx"),
    route("cadastro/app", "src/screen/cadastroApp.tsx"),
    route("*", "src/screen/notFound.tsx"),

    layout("src/components/AvaliacaoLayout.tsx", [
      route("avaliacoes", "src/screen/avaliacoes.tsx"),
      route("avaliacoes/:avaliacaoId", "src/screen/avaliacao1.tsx"),
      route("comparacao", "src/screen/comparacao.tsx"),
      route("prescricao", "src/screen/prescricao.tsx"),
      route("periodizacao", "src/screen/periodizacao.tsx"),
      route("volume", "src/screen/volume.tsx"),
      route("intensidade", "src/screen/intensidade.tsx"),
      route("salvar", "src/screen/salvar.tsx"),
    ]),
  ]),

  layout("src/components/PublicOnlyLayout.tsx", [
    route("register", "src/screen/register.tsx"),
  ]),
] satisfies RouteConfig;
