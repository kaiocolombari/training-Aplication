# Tratamento de dados ausentes e indisponíveis

## Regra central

O sistema diferencia quatro situações e não deve converter uma na outra:

| Estado | Significado | Apresentação |
|---|---|---|
| Carregando | A consulta ainda não terminou | Indicador de carregamento; não mostrar lista vazia ou KPIs zerados |
| Sem registro | Consulta terminou com sucesso, mas não há registros | Estado vazio explicando como os dados serão cadastrados |
| Campo não informado | O registro existe, mas um campo opcional está nulo | `—`, “Não informado” ou “Não calculado” |
| Indisponível | A API falhou, a rota não existe, houve falha de rede ou não há permissão | Aviso explícito, retry quando aplicável e preservação dos dados anteriores |

## Painel web do personal

- Métricas nullable aparecem como `—`; zero continua sendo zero apenas quando foi calculado.
- Adesão de cardio fica indisponível quando não há duração planejada ou duração real registrada.
- Adesão de força fica indisponível quando a execução não contém séries.
- Tonelagem fica indisponível quando não há séries concluídas.
- Duração nula é apresentada como “Não informada”; duração igual a zero continua como zero.
- Uma falha de atualização não apaga os dados anteriores: o painel mostra o último snapshot e informa que está desatualizado.
- Sem cache e sem resposta da API, a tela apresenta erro e retry. HTTP 403 informa falta de permissão; não é apresentado como carteira vazia.
- Se a ação de marcar uma execução como revisada falhar, a interface informa que a sessão continua pendente.

## Mobile

O contrato `StudentDashboardData.unavailableSections` lista seções que falharam ao carregar: `periodizacao`, `avaliacoes`, `volume`, `notificacoes`, `personais`, `feedbacks`, `feedback-personais` e `execucoes`.

- Os endpoints secundários são consultados independentemente. Uma falha parcial não impede a exibição das outras seções.
- HTTP 401/403 continua sendo erro de autenticação/autorização e não é convertido em lista vazia.
- Falhas de rede, servidor e rota indisponível marcam a seção correspondente como indisponível.
- Home, Planejamento e Evolução mostram avisos específicos e valores indisponíveis como `—`.
- Mensagens e notificações não exibem “lista vazia” ao mesmo tempo que exibem erro de carregamento.
- A tela de prescrição identifica campos não informados. Exercícios sem número de séries cadastrado não podem iniciar uma sessão, evitando criar um treino sem séries executáveis.
- Duração estimada igual a zero por falta de séries/intervalos não é apresentada como “1 min”; é exibida como “Duração não estimada”.

## Limitações e próximos passos

- A tela mobile ainda depende do endpoint principal `/api/treinos` e da leitura dos exercícios da ficha; falha nesses recursos críticos impede montar uma prescrição utilizável, então a tela informa indisponibilidade em vez de fabricar uma ficha.
- Não foi executado teste integrado com API fora do ar, HTTP 403 real ou aparelho em modo avião nesta alteração. Os cenários estão descritos abaixo para validação manual.

## Testes manuais recomendados

1. Desligar a API na abertura do app: Home, Treinos e Evolução devem exibir indisponibilidade e não métricas zero como se fossem dados válidos.
2. Com o app carregado, interromper a API e atualizar: os dados anteriores devem permanecer visíveis com aviso de atualização falha.
3. Simular falha apenas no endpoint de avaliações: treinos, mensagens e outras seções continuam disponíveis; calendário/peso mostram indisponibilidade.
4. Simular falha apenas no endpoint de periodização: não deve aparecer “agenda vazia”; deve aparecer “agenda indisponível”.
5. Cadastrar uma avaliação sem peso: o gráfico não deve criar ponto em zero.
6. Concluir uma sessão sem duração medida de cardio: o personal deve ver adesão não calculada, não 0%.
7. Criar uma execução sem séries concluídas: tonelagem deve aparecer como não calculada.
8. Criar exercício sem quantidade de séries na ficha: mobile deve indicar prescrição incompleta e impedir iniciar esse treino.
9. Simular HTTP 403 no painel: deve aparecer aviso de permissão, nunca estado vazio.
10. Fazer a API falhar ao marcar revisão: a execução continua pendente e a tela mostra erro da ação.
