# Onboarding por convite e acesso compartilhado da equipe

## O que mudou

### Acesso aos alunos
- Todo usuário PERSONAL ativo pode consultar e modificar qualquer aluno ativo/aprovado da equipe, conforme as permissões funcionais do endpoint.
- PersonalAluno e Aluno.ConvidadoPorPersonalId não são regras de autorização. São dados de origem/histórico.
- O profissional que enviou o convite permanece registrado em Aluno.ConvidadoPorPersonalId e Aluno.ConvitePersonalId.
- A associação histórica não restringe o acesso dos outros profissionais.
- Desativar um profissional não remove o acompanhamento dos alunos e não apaga a origem do convite.
- O detalhe do aluno mostra quem o convidou, checklist compartilhado e eventos de auditoria.

### Convites
- Cada personal cria quantos links precisar, identificados por um apelido/campanha.
- Cada link recebe 256 bits aleatórios; somente o SHA-256 do token é armazenado.
- O token bruto é exibido uma única vez ao criar o link. A tela não consegue recuperar o token depois; gere outro se perder.
- Links expiram após 30 dias por padrão, podem ser revogados e têm limite de 100 registros por hora por convite.
- O aluno só consegue criar conta usando um convite válido.
- O endpoint antigo de cadastro aberto (POST /api/auth/register) e o endpoint de cadastro mobile (POST /api/auth/mobile/register) retornam HTTP 410.
- A rota pública do site é /convite/:token. Sem convite, a landing page direciona para o WhatsApp configurado.
- Depois de criar a conta, o aluno preenche o formulário no site. O aplicativo mobile oferece somente login; contas pendentes recebem uma tela de status e link para o site.

### Análise de cadastro
- O formulário não é apagado quando o cadastro é aprovado ou devolvido para ajustes.
- A análise registra status, observação, usuário avaliador e data.
- Aprovação libera o aluno e notifica aluno/equipe.
- Solicitação de ajustes devolve o aluno ao formulário, preservando o texto da análise e permitindo reenvio.
- A origem do convite aparece na fila de análise.
- O sistema ainda não calcula pontuação automática. O formulário atual contém perguntas, mas não existe uma rubrica definida no código. Para pontuação automática, o cliente precisa informar pesos por resposta, escala e nota mínima de aprovação.

### Tarefas e auditoria
- Tarefas relacionadas a alunos são compartilhadas pela equipe; PersonalId é opcional e não controla acesso.
- ADMIN e PERSONAL podem criar/concluir tarefas de um aluno que esteja acessível à equipe.
- A tela de controle do aluno contém uma aba de checklist.
- O histórico do aluno exibe eventos de auditoria com usuário, tipo, data, método, rota e status HTTP quando esses dados estão disponíveis.
- A área administrativa de auditoria continua sendo a visão técnica mais completa.

## Configuração obrigatória

### API
Configure os valores reais no ambiente de produção (não versione .env):

| Variável | Uso |
|---|---|
| TURNSTILE_SITE_KEY | Site key pública do Cloudflare Turnstile, também informada ao frontend |
| TURNSTILE_SECRET_KEY | Secret key privada, somente na API |
| TURNSTILE_EXPECTED_HOSTNAME | Hostname exato do site, sem protocolo ou caminho |
| Turnstile__Enabled | Deve ser true em produção |
| Invites__ValidityDays | Validade dos links; padrão 30, limite efetivo 1–90 dias |
| Invites__MaxRegistrationsPerHourPerInvite | Limite de registros por convite/hora; padrão 100 |
| FRONTEND_ORIGINS | Origens exatas do site, separadas por ; |
| AllowedHosts | Hostnames públicos da API, sem wildcard |
| FORWARDED_HEADERS_ENABLED | true somente quando atrás de proxy reverso confiável |
| FORWARDED_TRUSTED_PROXIES | IPs reais dos proxies confiáveis, separados por ; |

A API falha no startup em produção se Turnstile estiver desativado ou se site key, secret ou hostname estiverem ausentes. Em desenvolvimento, o Turnstile fica desativado por padrão e o widget usa um token local de bypass; esse bypass só é aceito pelo backend em Development.

### Web
| Variável | Uso |
|---|---|
| VITE_API_URL | URL pública da API |
| VITE_TURNSTILE_SITE_KEY | Site key pública do Turnstile (nunca coloque a secret key aqui) |
| VITE_WHATSAPP_CONTACT_URL | Link completo de contato da equipe, usando o número real |
| VITE_MOBILE_APP_URL | URL HTTPS de download do APK Android distribuído pela equipe |

### Mobile
| Variável | Uso |
|---|---|
| EXPO_PUBLIC_API_URL | URL pública da API |
| EXPO_PUBLIC_WEB_APP_URL | URL base do site, usada para abrir o formulário pendente |
| EXPO_PUBLIC_WHATSAPP_CONTACT_URL | Link de contato da equipe |

O cliente precisa fornecer o número/URL oficial do WhatsApp e a URL de hospedagem do APK. Esses valores não foram inventados.

## Proteções anti-bot
1. Cloudflare Turnstile é validado no servidor; não basta enviar um token do navegador.
2. A API verifica success, action e hostname.
3. Registro e formulário têm honeypot oculto e limite de tamanho de requisição.
4. Rotas públicas de convite/registro/formulário usam rate limit de 5 solicitações por IP em 10 minutos.
5. Criação de convites é limitada a 12 por usuário/hora.
6. Cada link limita novos registros a 100 por hora por padrão.
7. Login mantém seu rate limit separado.
8. O token do convite tem alta entropia e é armazenado somente como hash.

**Limite importante:** o rate limiter ASP.NET é local ao processo. Ele reduz abuso por IP, mas não substitui proteção volumétrica distribuída. Para uma botnet com muitos IPs, publique a API atrás da Cloudflare (proxy laranja) e configure WAF/rate limiting de borda para /api/auth/register/invite, /api/convites/validar e /api/cadastro-aluno/respostas. Mantenha FORWARDED_HEADERS_ENABLED=true apenas com IPs reais e confiáveis do proxy; nunca confie em X-Forwarded-For enviado diretamente pelo cliente. Atualize as faixas oficiais do proxy quando mudarem.

## Migrações e publicação
Foram geradas, mas não aplicadas:
1. TeamInvitationsAndReviewHistory: cria ConvitesPersonais; registra convite/origem em Alunos; adiciona status, observação e avaliador à solicitação de cadastro; faz backfill da origem somente para alunos legados com exatamente um vínculo ativo. Alunos com vários vínculos ou sem vínculo ficam sem origem inferida, porque não há dado confiável para escolher um convidante.
2. SharedTeamTasks: torna TarefaPersonal.PersonalId nullable para permitir tarefas compartilhadas sem profissional responsável.

Antes de publicar:
1. Fazer backup validado do PostgreSQL.
2. Configurar secrets/variáveis da API, web e mobile.
3. Criar/configurar o site Cloudflare Turnstile com hostname de produção e as ações student_register e student_form.
4. Configurar regras de WAF/rate limit na borda.
5. Aplicar as migrations em janela controlada, antes de subir a API que depende das novas colunas.
6. Publicar a API e o web.
7. Gerar o APK Android (por exemplo, build de distribuição interna/preview), hospedar em URL HTTPS e preencher VITE_MOBILE_APP_URL.
8. Distribuir o link do APK diretamente aos alunos. Instalação fora da Play Store pode exigir autorização de instalação de fontes externas no Android.
9. Publicar o mobile com EXPO_PUBLIC_WEB_APP_URL e EXPO_PUBLIC_WHATSAPP_CONTACT_URL configurados.
10. Testar o fluxo completo com um convite real antes de divulgar.

Não execute rollback de migrations depois de já existirem convites/cadastros novos sem plano de preservação dos dados.

## Testes manuais antes do primeiro aluno
- Personal A cria dois convites com apelidos diferentes; ambos devem atribuir a origem ao mesmo personal.
- Personal B cria convite próprio; a origem do novo aluno deve ser B.
- Link expirado e link revogado devem ser recusados sem revelar detalhes internos.
- Um token aleatório/inválido não deve permitir cadastro.
- Sem Turnstile, com token expirado, ação incorreta ou hostname incorreto, registro e formulário devem falhar.
- Honeypot preenchido deve recusar o envio.
- Exceder o limite por IP e o limite por convite deve ser bloqueado.
- Conta criada por convite aparece como pendente; formulário aparece na fila com origem.
- Reprovar exige observação; aluno recebe notificação e consegue reenviar o formulário no site.
- Aprovar preserva as respostas e libera o aluno.
- Personal A e Personal B conseguem abrir e modificar o mesmo aluno, mesmo que apenas A o tenha convidado.
- O detalhe do aluno mostra a origem, checklist e eventos de auditoria.
- ADMIN vê por personal a quantidade e a lista de alunos convidados, com status de análise.
- Mobile não oferece cadastro; login pendente abre a tela de análise e link para o site.
- Link de download do APK e contato do WhatsApp abrem os destinos configurados.

## Pontuação do formulário — pendente de regra de negócio
Antes de implementar pontuação automática, confirmar com o cliente:
- escala total (ex.: 0–100);
- pontos/peso de cada pergunta e alternativa;
- nota mínima para aprovação;
- se alguma resposta é eliminatória independentemente da soma;
- se a aprovação continua exigindo revisão humana mesmo com nota suficiente.