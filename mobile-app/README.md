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
- **Execução de força:** prescrição do personal e registro editável são páginas alternáveis do mesmo card: `Prescrição` (somente leitura) e `Editar valores` (campos editáveis), com transição horizontal, abas, setas e indicadores clicáveis. Os campos realizados começam em zero; se o aluno avançar sem editar, a execução assume os valores prescritos. Indicadores mostram exercício atual, série ativa, séries concluídas e progresso geral. O botão de variações aparece somente na primeira série de cada exercício, imediatamente acima do progresso do exercício. O cronômetro de descanso usa o intervalo prescrito como contagem regressiva (por exemplo, `90 s` começa em `01:30`), com controles manuais para iniciar, pausar, continuar e reiniciar; ao chegar a `00:00`, para sem avançar a série automaticamente.
- **Inatividade:** após 30 minutos sem interação, um modal informa que a sessão foi pausada. O tempo já acumulado do cronômetro de descanso ou do cardio é preservado; os minutos sem interação não são somados. O aluno retoma pelo próprio modal.
- **Execução de cardio:** tela própria, com duração planejada e cronômetro opcional. Se o cronômetro ficar desligado, a tela continua utilizável sem exibir a contagem de tempo e a duração não é medida. Quando ligado, pode ser iniciado, pausado, retomado ou desligado sem perder o tempo já acompanhado. Ao encerrar antes da meta, o tempo realmente medido é salvo no histórico local para futura sincronização com o personal. Com os avisos ativados, o app agenda notificações locais com som aos 25%, 50%, 75% e 100% do tempo planejado. Pausar cancela os avisos pendentes; retomar agenda apenas os marcos restantes.
- **Evolução:** indicadores e gráficos ilustrativos de medidas e força.
- **Perfil:** dados do aluno, profissional responsável, avaliações, lembretes e suporte.

## Estado atual

Este é um protótipo navegável com dados fictícios. Não há login, sincronização, envio de execução, feedback ou consulta à API ainda. A sessão em andamento fica salva apenas no dispositivo para demonstrar o fluxo de pausa e retomada. Os números da tela Evolução também são ilustrativos e não devem ser tratados como dados reais.

O card de periodização lê `PERIODIZATION_PLAN.objectiveGeneral`. No painel web, o campo **Objetivo geral** está vinculado ao campo `Periodizacao.nome`, que já é persistido pela API. O app mobile ainda não consulta esse valor pela API; por enquanto, seu objetivo é um dado de demonstração (`Hipertrofia`).

### Notificações locais

O serviço reutilizável está em `services/notifications.ts`:

- `notifyNow({ title, body })`: exibe uma notificação imediatamente.
- `scheduleAppNotification({ title, body }, seconds)`: agenda uma notificação após um intervalo.
- `cancelAppNotifications(ids)`: cancela notificações agendadas pelos IDs retornados.
- `scheduleCardioMilestones(durationSeconds, elapsedSeconds)`: agenda os marcos de progresso do cardio.

O app pede permissão do sistema quando o aluno inicia o cronômetro com os avisos ligados. São notificações locais do aparelho; push remoto e sincronização com o servidor não fazem parte deste protótipo.

Próxima etapa de integração: autenticar como `ALUNO`, consultar os treinos/periodização autorizados e enviar ao backend as séries executadas e os relatos de desconforto/dor, preservando o vínculo com o aluno.
