# Treino System Mobile

Aplicativo mobile do aluno, integrado à TreinoAPI e separado do painel web.

## Stack

- Expo SDK 58 + React Native + TypeScript.
- Expo Router para navegação por rotas.
- NativeWind 4.2.7 + Tailwind CSS 3.4.
- AsyncStorage para preservar localmente uma sessão de treino em andamento, histórico local e fila de sincronização.
- SecureStore para tokens de autenticação e credenciais biométricas; AsyncStorage guarda a preferência `Lembrar de mim`.
- Expo Local Authentication para impressão digital e reconhecimento facial.
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

### Configurar a API

Copie `.env.example` para `.env` e configure `EXPO_PUBLIC_API_URL` com a URL HTTPS acessível pelo aparelho, sem barra no final. Em um aparelho físico, `localhost` aponta para o próprio celular; use o endereço de rede da máquina que hospeda a API ou o domínio publicado. Reinicie o Expo depois de alterar o `.env`.

Validação local:

```powershell
npm run typecheck
npm run lint
npx expo-doctor
```

## Telas do protótipo

- **Hoje:** carrega o treino do dia e a agenda da periodização, calcula sessões sincronizadas na semana e sequência de dias concluídos, mostra notificações reais e permite retomar uma sessão local.
- **Treinos:** consulta as fichas ativas, exercícios, agenda semanal e periodização do aluno autenticado.
- **Detalhe do treino:** exibe os exercícios e os valores prescritos pela API, incluindo variações disponíveis.
- **Execução de força:** prescrição do personal e registro editável são páginas alternáveis do mesmo card: `Prescrição` (somente leitura) e `Editar valores` (campos editáveis), com transição horizontal, abas, setas e indicadores clicáveis. As mudanças de página usam deslocamento, fade e escala; o progresso preenche suavemente, o cronômetro entra com movimento, a barra de descanso acompanha a contagem regressiva, a próxima etapa aparece com animação e sua seta se movimenta discretamente durante o intervalo. O RIR selecionado recebe um pulso e o botão principal responde ao toque. As expansões e recolhimentos de conteúdo também usam transições suaves. Os campos realizados começam em zero; se o aluno avançar sem editar carga, repetições ou RIR, a execução assume os valores prescritos. Ao editar pela primeira vez um dos três campos de desempenho, os outros recebem os valores prescritos como referência, evitando registrar zeros artificiais. O RIR realizado mostra o símbolo `+` e uma explicação em repetições em reserva (ex.: `Aguentaria +3 repetições`). O aluno também informa o tempo de descanso realmente realizado, em segundos, por série, distinguindo valor não informado de zero segundos registrado. Ao iniciar o descanso, o carrossel força a página `2. Editar valores` e bloqueia o retorno à prescrição até avançar. Durante o intervalo, o cabeçalho do exercício, as barras de progresso, variações, descrição, vídeo demonstrativo e feedback de dor/observação ficam ocultos; permanecem o slide editável, o cronômetro dentro da página 2 e a próxima etapa logo abaixo. O cronômetro usa o intervalo prescrito como contagem regressiva (por exemplo, `90 s` começa em `01:30`), com controles manuais para iniciar, pausar, continuar e reiniciar; ao chegar a `00:00`, para sem avançar a série automaticamente. Ao salvar e avançar, o fluxo retorna à página de prescrição da próxima série/exercício.
- **Inatividade:** após 30 minutos sem interação, um modal informa que a sessão foi pausada. O tempo já acumulado do cronômetro de descanso ou do cardio é preservado; os minutos sem interação não são somados. O aluno retoma pelo próprio modal.
- **Execução de cardio:** tela própria, com duração planejada e cronômetro opcional. Se o cronômetro ficar desligado, a tela continua utilizável sem exibir a contagem de tempo e a duração não é medida. Quando ligado, pode ser iniciado, pausado, retomado ou desligado sem perder o tempo já acompanhado. Ao encerrar antes da meta, o tempo realmente medido é salvo no histórico local para futura sincronização com o personal. Com os avisos ativados, o app agenda notificações locais com som aos 25%, 50%, 75% e 100% do tempo planejado. Pausar cancela os avisos pendentes; retomar agenda apenas os marcos restantes.
- **Conclusão do treino:** registra início e fim da sessão, parabeniza o aluno e compara duração total com a estimativa calculada a partir das séries e intervalos prescritos. Para força, compara por exercício/série repetições, carga, RIR e descanso, incluindo séries pendentes, variação selecionada e relatos. Se o aluno não editou carga, repetições ou RIR, o resumo identifica o uso da prescrição. A conclusão antecipada não marca séries não realizadas como concluídas.
- **Envio consolidado:** ao tocar em `Continuar`, o app grava o histórico e envia a sessão completa em uma única requisição `PUT /api/treinos/{treinoId}/execucoes/atual`. O pacote inclui um `sessionId` idempotente, início/fim, duração real/esperada, cardio, exercícios, variações, séries, RIR, descanso prescrito/real e relatos. A API permite mais de uma sessão do mesmo treino no mesmo dia e usa o `sessionId` para não duplicar uma tentativa reenviada. A sessão é salva primeiro na fila local `@treino-system/pending-workout-submissions`; só é removida após resposta de sucesso. Se a API estiver indisponível, permanece na fila e o app tenta sincronizar novamente após autenticação e navegação.
- **Evolução:** utiliza avaliações corporais, histórico de execuções e ciclos de acompanhamento de volume retornados pela API. Inclui um calendário mensal expansível com histórico de avaliações, solicitações pendentes e datas agendadas. O aluno escolhe uma data no calendário, informa um motivo opcional e pode marcar a solicitação como urgente após confirmação explícita; o envio registra data/hora e notifica todos os personais com vínculo ativo. A tela mostra a última atualização da ficha e a próxima avaliação agendada.
- **Perfil:** usa os dados do aluno autenticado, lista personais vinculados, abre conversa com o profissional e consulta notificações; também permite encerrar a sessão.
- **Mensagens:** conversa com os personais vinculados por meio dos endpoints de comunicação existentes, atualiza a conversa aberta a cada 15 segundos e mostra quando uma mensagem enviada já foi lida.
- **Feedback:** envia nota de 1 a 5, categoria e comentário para toda a equipe ou para um personal específico; consulta o histórico e as respostas registradas pela equipe.

### Autenticação e cadastro

- **Login:** autentica na rota `POST /api/auth/mobile/login` e consulta `GET /api/auth/me`. O app aceita somente contas do tipo `ALUNO`.
- **Lembrar de mim:** salva a preferência e o e-mail no AsyncStorage e guarda os tokens no SecureStore nativo (no web, o adaptador de armazenamento usa o AsyncStorage/localStorage). Sem essa opção, os tokens ficam apenas em memória.
- **Biometria:** quando o aparelho possui biometria cadastrada, o aluno pode ativar o acesso por digital/rosto. A credencial fica no SecureStore com `requireAuthentication`; o próprio sistema operacional exige autenticação ao recuperá-la. O teste de Face ID exige um development build no iOS, não funciona no Expo Go.
- **Cadastro:** `POST /api/auth/mobile/register` cria a conta de aluno pendente. Em seguida, o app abre o questionário definido separadamente em `data/cadastroPerguntas.ts`, espelhando as perguntas de `web-system/app/src/screen/cadastroPerguntas.ts`.
- **Questionário:** envia `{ respostas }` para `POST /api/cadastro-aluno/respostas`. A tela de espera consulta `/api/auth/me` a cada 30 segundos e libera a área do aluno quando o status muda para `APROVADO`.
- **Sessão nativa:** a API mantém os endpoints web baseados em cookies HttpOnly e oferece rotas mobile bearer separadas (`/api/auth/mobile/login`, `register`, `refresh` e `logout`). O cliente renova o access token com o refresh token rotativo e envia `Authorization: Bearer` nas rotas protegidas.

## Estado atual

O login, cadastro, aprovação, consulta de ficha/periodização, avaliações, agenda de avaliações, histórico, ciclos de volume, notificações, conversas, feedback e envio consolidado de execução estão conectados à TreinoAPI. O aluno pode solicitar uma nova avaliação pela agenda; o pedido é persistido com motivo, urgência e timestamp, e gera uma notificação para cada personal vinculado. O profissional pode analisar, agendar ou recusar a solicitação pelo Controle de Aluno web. O aluno também pode avaliar o acompanhamento, direcionar o feedback a um personal vinculado ou à equipe e acompanhar a resposta no aplicativo. Os endpoints de leitura liberados para `ALUNO` validam o vínculo do aluno com cada recurso por meio de `OwnershipService`; criação/edição de ficha, periodização e avaliação continuam restritas a `PERSONAL`/`ADMIN`.

### Limitações do contrato atual da API

- A entidade `Treino` ainda não expõe tipo nem duração prescrita. Por isso, fichas retornadas pela API são interpretadas como treino de força; o tempo esperado é uma estimativa local baseada em aproximadamente 45 segundos por série mais os intervalos prescritos. A tela de cardio já consegue enviar seus tempos se receber um plano desse tipo, mas a criação/identificação de cardio na ficha ainda depende de ampliar o contrato de treino.
- O DTO de exercício ainda não fornece grupo muscular; a tela indica que essa informação não foi cadastrada, em vez de inferi-la pelo nome.
- A API não oferece edição de dados básicos do perfil do aluno. A tela de perfil consulta os dados existentes, mas não simula uma atualização.
- As migrations `MobileWorkoutSessionMetrics` e `MobileWorkoutSessionIdempotency` adicionam os campos de início/fim/duração, tipo de sessão, dados de cardio, variação, feedback, descanso prescrito, conclusão de série e identificador idempotente de sessão; também permitem múltiplas execuções do mesmo treino no mesmo dia. Em desenvolvimento, `Program.cs` aplica migrations ao iniciar a API; o PostgreSQL precisa estar disponível para que essa atualização seja aplicada.

### Notificações locais

O serviço reutilizável está em `services/notifications.ts`:

- `notifyNow({ title, body })`: exibe uma notificação imediatamente.
- `scheduleAppNotification({ title, body }, seconds)`: agenda uma notificação após um intervalo.
- `cancelAppNotifications(ids)`: cancela notificações agendadas pelos IDs retornados.
- `scheduleCardioMilestones(durationSeconds, elapsedSeconds)`: agenda os marcos de progresso do cardio.

O app pede permissão do sistema quando o aluno inicia o cronômetro com os avisos ligados. São notificações locais do aparelho; push remoto e sincronização com o servidor não fazem parte deste protótipo.

Próximas evoluções do contrato: expor tipo/duração do treino e grupo muscular; habilitar edição segura do perfil; e ampliar os dados de evolução conforme novas métricas forem persistidas.
