# Treino System Mobile

Protótipo do aplicativo do aluno, separado do painel web e da API.

## Stack

- Expo SDK 58 + React Native + TypeScript.
- Expo Router para navegação por rotas.
- NativeWind 4.2.7 + Tailwind CSS 3.4.
- AsyncStorage para preservar localmente uma sessão de treino em andamento.
- `expo-notifications` para notificações locais com som.
- Lucide para ícones.

## Executar

Na raiz do repositório:

```powershell
Set-Location mobile-app
npm ci
npx expo start
```

Abra o QR Code com o Expo Go compatível com o SDK do projeto ou inicie um emulador Android com `npx expo start --android`.

Validação local:

```powershell
npm run typecheck
npm run lint
npx expo-doctor
```

## Telas do protótipo

- **Hoje:** treino do dia, semana, consistência e retomada de uma sessão salva.
- **Treinos:** agenda semanal, ficha atual e periodização.
- **Detalhe do treino:** exercícios, séries, repetições, carga e descanso prescritos.
- **Execução de força:** prescrição do personal e registro editável são páginas alternáveis do mesmo card: `Prescrição` (somente leitura) e `Editar valores` (campos editáveis), com transição horizontal, abas, setas e indicadores clicáveis. As mudanças de página usam deslocamento, fade e escala; o progresso preenche suavemente, o cronômetro entra com movimento, a barra de descanso acompanha a contagem regressiva, a próxima etapa aparece com animação e sua seta se movimenta discretamente durante o intervalo. O RIR selecionado recebe um pulso e o botão principal responde ao toque. As expansões e recolhimentos de conteúdo também usam transições suaves. Os campos realizados começam em zero; se o aluno avançar sem editar carga, repetições ou RIR, a execução assume os valores prescritos. Ao editar pela primeira vez um dos três campos de desempenho, os outros recebem os valores prescritos como referência, evitando registrar zeros artificiais. O RIR realizado mostra o símbolo `+` e uma explicação em repetições em reserva (ex.: `Aguentaria +3 repetições`). O aluno também informa o tempo de descanso realmente realizado, em segundos, por série. Ao concluir uma série, o carrossel muda automaticamente para `Editar valores`, mas continua permitindo voltar à `Prescrição` durante o descanso para consultar o planejamento inicial. O cabeçalho do exercício e os indicadores de progresso geral e do exercício permanecem visíveis. O cronômetro regressivo fica fora do card, imediatamente abaixo do carrossel; durante o descanso, descrição, vídeo demonstrativo e feedback de dor/observação ficam ocultos. A próxima etapa permanece abaixo do cronômetro. O cronômetro usa o intervalo prescrito como contagem regressiva (por exemplo, `90 s` começa em `01:30`), com controles manuais para iniciar, pausar, continuar e reiniciar; ao chegar a `00:00`, para sem avançar a série automaticamente. Ao salvar e avançar, o fluxo retorna à página de prescrição da próxima série/exercício.
- **Inatividade:** após 30 minutos sem interação, um modal informa que a sessão foi pausada. O tempo já acumulado do cronômetro de descanso ou do cardio é preservado; os minutos sem interação não são somados. O aluno retoma pelo próprio modal.
- **Execução de cardio:** tela própria, com duração planejada e cronômetro opcional. Se o cronômetro ficar desligado, a tela continua utilizável sem exibir a contagem de tempo e a duração não é medida. Quando ligado, pode ser iniciado, pausado, retomado ou desligado sem perder o tempo já acompanhado. Ao encerrar antes da meta, o tempo realmente medido é salvo no histórico local para futura sincronização com o personal. Com os avisos ativados, o app agenda notificações locais com som aos 25%, 50%, 75% e 100% do tempo planejado. Pausar cancela os avisos pendentes; retomar agenda apenas os marcos restantes.
- **Conclusão do treino:** a sessão registra o instante em que o aluno toca em iniciar e o instante em que conclui/encerra. A tela final parabeniza o aluno, compara a duração total com o tempo médio esperado definido em `WorkoutPlan.duration`, mostra o progresso e, para força, compara por exercício e série os valores prescritos e realizados (repetições, carga, RIR e descanso), incluindo séries pendentes e relatos. Se o aluno não editou carga, repetições ou RIR, o resumo identifica que os valores prescritos foram usados como realizado. No cardio, compara a duração planejada com o tempo efetivamente acompanhado pelo cronômetro. A conclusão antecipada também abre o resumo sem marcar séries de força não feitas como concluídas. O botão `Continuar` fecha o resumo e salva o registro consolidado.
- **Envio em lote preparado:** ao tocar em `Continuar` no resumo, o app grava o histórico e coloca um único payload consolidado da sessão na fila local `@treino-system/pending-workout-submissions`. Esse payload contém todos os exercícios e séries, valores planejados/realizados, duração, descanso e feedback. Há deduplicação por sessão. `getPendingWorkoutSubmissions` lê a fila e `flushPendingWorkoutSubmissions(sendBatch)` permite conectar futuramente uma função HTTP que envie um payload por sessão; o item só é removido da fila depois que a função de envio concluir com sucesso. A API ainda não está conectada: não há requisição HTTP neste estágio.
- **Evolução:** indicadores e gráficos ilustrativos de medidas e força.
- **Perfil:** dados do aluno, profissional responsável, avaliações, lembretes e suporte.

## Estado atual

Este é um protótipo navegável com dados fictícios. Não há login, sincronização ou consulta à API ainda. As sessões em andamento, o histórico e a fila de payloads para futura sincronização ficam salvos apenas no dispositivo. Nenhuma requisição HTTP de execução é feita neste estágio. Os números da tela Evolução também são ilustrativos e não devem ser tratados como dados reais.

O card de periodização lê `PERIODIZATION_PLAN.objectiveGeneral`. No painel web, o campo **Objetivo geral** está vinculado ao campo `Periodizacao.nome`, que já é persistido pela API. O app mobile ainda não consulta esse valor pela API; por enquanto, seu objetivo é um dado de demonstração (`Hipertrofia`).

### Notificações locais

O serviço reutilizável está em `services/notifications.ts`:

- `notifyNow({ title, body })`: exibe uma notificação imediatamente.
- `scheduleAppNotification({ title, body }, seconds)`: agenda uma notificação após um intervalo.
- `cancelAppNotifications(ids)`: cancela notificações agendadas pelos IDs retornados.
- `scheduleCardioMilestones(durationSeconds, elapsedSeconds)`: agenda os marcos de progresso do cardio.

O app pede permissão do sistema quando o aluno inicia o cronômetro com os avisos ligados. São notificações locais do aparelho; push remoto e sincronização com o servidor não fazem parte deste protótipo.

Próxima etapa de integração: autenticar como `ALUNO`, consultar os treinos/periodização autorizados e consumir a fila de sessões pendentes com uma requisição por treino concluído, preservando o vínculo com o aluno. O identificador do aluno deverá ser associado pelo contexto de autenticação quando o login/API forem implementados.
