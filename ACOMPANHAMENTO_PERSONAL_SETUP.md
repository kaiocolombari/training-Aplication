# Central de acompanhamento do personal

## Fluxo de envio

O aplicativo mobile já monta um pacote de execução quando o aluno conclui o treino. O envio contém identificador idempotente da sessão, horários, duração, tipo de treino, exercícios, séries, carga, repetições, RIR, descanso, indicação de dor e feedback por exercício. Se não houver conexão, o pacote permanece na fila local; o app tenta sincronizá-lo ao concluir um treino e quando o aluno retorna/navega pelo aplicativo. Não há listener dedicado para detectar instantaneamente o retorno da conexão enquanto o app permanece parado na mesma tela.

A API persiste as sessões em `ExecucoesTreino`, os exercícios em `ExecucoesExercicio` e as séries em `ExecucoesSerie`. Uma sessão é considerada concluída quando possui `Fim`.

## Central web

A seção **Controle do aluno**, quando nenhum aluno individual está aberto, agora apresenta a Central de acompanhamento:

- carteira de alunos ativos vinculados ao personal;
- sessões concluídas recebidas nos últimos dias;
- adesão às séries (ou duração planejada versus realizada para cardio);
- tonelagem calculada somente com séries concluídas;
- duração, relatos de dor/desconforto e feedback por exercício;
- solicitações de avaliação, feedbacks novos e tarefas vencidas;
- fila priorizada de pendências;
- atalhos para abrir o controle individual, carregar a ficha técnica, acessar tarefas e abrir análises estatísticas;
- atualização automática a cada 30 segundos.

A revisão do envio é explícita: o personal marca a sessão como revisada. O registro guarda data/hora e identificador do usuário que revisou.

## API

- `GET /api/personal/acompanhamento`: resumo e fila de trabalho do usuário autenticado.
- `PATCH /api/personal/acompanhamento/execucoes/{id}/revisao`: marca ou desmarca uma execução como revisada.

O personal recebe somente alunos com vínculo ativo em `PersonalAluno`. O administrador recebe o consolidado de todos os alunos ativos. A revisão também valida o acesso ao aluno no servidor; não confia no identificador enviado pela interface.

## Banco de dados

Aplicar a migration antes de usar a central:

```powershell
dotnet ef database update --project TreinoAPI --startup-project TreinoAPI
```

A migration `PersonalExecutionReview` adiciona `RevisadaEm` e `RevisadaPorUsuarioId` em `ExecucoesTreino`. Sessões concluídas anteriores à migration são inicializadas como já revisadas para não transformar todo o histórico legado em uma fila de pendências.

## Roteiro de teste manual

1. Aplicar a migration e reiniciar a API.
2. Entrar no mobile como aluno vinculado a um personal.
3. Concluir um treino de força com séries concluídas, uma série não concluída, feedback em um exercício e um relato de desconforto/dor.
4. Conferir que a sessão aparece na Central do personal com adesão, tonelagem, duração, alerta e feedback.
5. Marcar a sessão como revisada e confirmar que ela sai da fila de revisão após a atualização.
6. Repetir com um treino de cardio e conferir a relação entre duração real e planejada.
7. Desconectar o aparelho antes de concluir uma sessão, concluir offline e reconectar. Confirmar que a fila mobile sincroniza e o registro aparece na central.
8. Criar/abrir uma ficha, abrir o controle individual e acessar tarefas/análises pelos atalhos.

## Limites atuais e evolução para IA

Os alertas são derivados de eventos explícitos (dor/desconforto, solicitações, feedbacks, tarefas e envios ainda não revisados). Não há diagnóstico, inferência de lesão ou recomendação automática de alteração de treino.

A central fornece uma base estruturada para futura IA: eventos de execução, histórico, medidas e ações do profissional. Uma futura camada inteligente deve apresentar evidências e explicações, permitir revisão humana e nunca alterar fichas sem aprovação do personal. Check-ins subjetivos, metas e diário técnico ainda dependem de seus respectivos fluxos de coleta e persistência.
