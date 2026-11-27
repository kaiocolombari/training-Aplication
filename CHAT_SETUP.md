# Chat em tempo real — configuração e operação

## O que foi implementado

- ASP.NET Core SignalR em `/hubs/chat`, autenticado pelo JWT existente.
- Envio instantâneo por WebSocket, confirmação de entrega e leitura, presença online e evento de digitação.
- Conversa privada aluno–personal: o aluno pode escolher qualquer personal ativo cadastrado. Cada conversa continua privada entre seus participantes; o acesso compartilhado à ficha do aluno não transforma as mensagens em um chat coletivo.
- Conversas aluno–personal expiram 48 horas após a última mensagem de qualquer participante. Cada nova mensagem reinicia a janela. A limpeza roda a cada minuto e apaga mensagens, notificações relacionadas e arquivos anexados. Conversas internas ADMIN–PERSONAL continuam permanentes.
- Anexos por REST, guardados fora de `wwwroot`, com download restrito aos participantes.
- Push mobile via Expo Push, inclusive quando o aplicativo está em segundo plano, se o projeto EAS/APNs/FCM estiver configurado.
- Presença online reflete uma conexão SignalR ativa do app mobile ou do painel web; no mobile a conexão fica ativa enquanto o app está em primeiro plano.
- Contexto do aluno no painel do personal: ficha e anamnese, avaliações com medidas, perímetros e dobras, autor da criação/última alteração, snapshots do histórico da avaliação, prescrições e exercícios ativos, periodizações, execuções com indicadores de dor/feedback, feedbacks do aluno, solicitações e eventos de auditoria com usuário, rota, método e status.
- Todo Personal ativo pode consultar o contexto do prontuário de qualquer aluno aprovado da equipe, independentemente de convite ou conversa. As mensagens e anexos do chat continuam restritos aos participantes da conversa; a conversa não é regra de autorização para ficha/treino.

## Configuração obrigatória para anexos

O upload é **fail-closed**: sem antivírus configurado, o servidor rejeita o envio. Isso evita tratar uma checagem de extensão/MIME como se fosse análise antimalware.

1. Instale ClamAV no servidor da API e mantenha as assinaturas atualizadas (`freshclam`).
2. Configure no ambiente da API:

```env
CHAT_FILES_STORAGE_PATH=App_Data/chat-anexos
CHAT_ANTIVIRUS_COMMAND=clamscan
CHAT_ANTIVIRUS_ARGUMENTS=--no-summary "{file}"
```

No Windows, `CHAT_ANTIVIRUS_COMMAND` pode apontar para o executável do scanner instalado; ajuste `CHAT_ANTIVIRUS_ARGUMENTS` conforme a CLI desse scanner. O processo deve retornar `0` para arquivo limpo e `1` para ameaça detectada (convenção ClamAV). Qualquer erro, timeout ou retorno desconhecido bloqueia o arquivo.

Tipos aceitos: JPEG, PNG, WEBP, MP4, MOV, PDF, TXT e DOCX sem macros nem referências externas. Limite: 20 MB por arquivo. A validação de assinatura e a inspeção do DOCX são camadas adicionais; não substituem o antivírus.

## Configuração de push mobile

1. Configure o projeto Expo/EAS e as credenciais de push do Android/iOS.
2. Defina `EXPO_PUBLIC_EAS_PROJECT_ID` no ambiente de build do app mobile ou `expo.extra.eas.projectId` no `app.json`.
3. O app solicita permissão, registra o Expo Push Token em `/api/comunicacao/push-token` e o backend envia notificações pelo Expo Push Service.
4. `EXPO_ACCESS_TOKEN` no backend é opcional, mas pode ser definido quando o projeto usa Enhanced Push Security.

Sem `EXPO_PUBLIC_EAS_PROJECT_ID`, o app não registra token e as notificações em segundo plano não serão enviadas. A conexão SignalR cobre o app em primeiro plano; o push é o mecanismo para segundo plano. Push de navegador web (Web Push/VAPID) não está configurado nesta etapa.

No painel web, quando a permissão de notificações do navegador já está concedida, uma aba em segundo plano também mostra um aviso de nova mensagem. Isso não substitui Web Push: com o navegador completamente fechado, a notificação web não é entregue.

## Banco de dados

Foram adicionadas migrations:

- `ChatRealtimeAndTemporaryConversations`
- `ChatMessageAttachments`
- `ChatPushTokens`

Antes de aplicar em um banco compartilhado/produção, faça backup e revise o SQL. A primeira migration marca conversas existentes entre aluno e personal como temporárias e calcula a expiração a partir da última mensagem (ou da criação, se vazia). Depois aplique com:

```powershell
cd TreinoAPI
dotnet ef database update
```

## Escalabilidade e operação

- A presença online é mantida em memória e o chat SignalR está pronto para uma instância da API. Ao executar múltiplas instâncias, configure Redis backplane ou Azure SignalR e mova a presença para um mecanismo distribuído.
- O worker de expiração roda por instância; a exclusão é idempotente, mas o armazenamento de anexos deve ser compartilhado entre instâncias (ou migrado para object storage privado) antes de escalar horizontalmente.
- O armazenamento local é apropriado para desenvolvimento/uma instância. Em produção distribuída, prefira bucket privado com URLs assinadas de curta duração, mantendo o mesmo fluxo de varredura antes de publicar.
- A limpeza ocorre em lotes de até 250 conversas por ciclo. O prazo de 48h é lógico; a exclusão física acontece no próximo ciclo do worker.
