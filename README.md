# Treino System

Plataforma web para personal trainers criarem e acompanharem fichas de alunos. Esta primeira versão concentra o fluxo profissional: cadastro de alunos, avaliações físicas, prescrição de treinos, periodização, volume semanal e registro de execução por série.

## Stack

- **Frontend:** React 19, TypeScript, React Router 7, Tailwind CSS 4 e TanStack Query.
- **API:** ASP.NET Core 10, C#, Entity Framework Core 10.
- **Banco:** PostgreSQL.
- **Autenticação:** cookies HttpOnly com JWT de acesso e refresh token rotativo, proteção CSRF e autorização por papel/propriedade.

## O que está disponível

- Login seguro para ADMIN e PERSONAL, com permissões separadas.
- Cadastro e gerenciamento de alunos, com vínculo automático ao Personal que os cadastrou.
- Criação de contas profissionais com e-mail e senha inicial, além de gerenciamento dos vínculos (ADMIN).
- Ficha do aluno com anamnese, dados antropométricos e avaliações físicas ilimitadas.
- Cada avaliação reúne medidas, perímetros, dobras cutâneas, teste de carga e parecer/observações.
- Comparação entre quaisquer duas avaliações, arquivamento sem exclusão física e histórico de quem criou/alterou cada avaliação.
- Agenda de avaliações integrada ao app do aluno e ao Controle de Aluno: solicitações com data desejada, motivo opcional, prioridade urgente e timestamp de envio; a equipe tem uma fila compartilhada para agendar ou recusar, e solicitações urgentes notificam todos os personais ativos. Agendamentos diretos também podem ser criados por qualquer personal com descrição opcional.
- Atendimento simples: o Personal abre qualquer aluno da equipe, volta ao diretório para trocar de aluno ou encerra o atendimento atual.
- Salvamento automático opcional, configurável por profissional (2, 4, 6 ou 10 segundos de inatividade), disponível em Configurações e na tela Salvar; o salvamento manual continua disponível.
- Prescrição de treinos, exercícios e variações.
- Periodização por semanas/dias e associação de treinos.
- Volume semanal por grupo muscular.
- Registro de execução diária por série, incluindo carga, repetições, RIR/RPE, descanso, velocidade, cluster, drop-set, rest-pause e falha.
- Importação/exportação de fichas em JSON.
- Chat em tempo real via SignalR entre aluno e personal, com escolha do profissional, confirmação de entrega/leitura, presença, digitação, anexos verificados e expiração após 48 horas sem mensagens. Conversas internas da equipe permanecem permanentes.

O aluno acessa a experiência mobile após aprovação do cadastro por convite. O ADMIN gerencia a equipe; todo PERSONAL ativo pode visualizar e alterar alunos ativos da equipe, inclusive revisar cadastros pendentes. A origem do convite é mantida apenas para atribuição e auditoria.

## Requisitos

- .NET SDK 10.
- Node.js 22.13+ (mínimo do Expo SDK 58; também atende ao Vite 8).
- PostgreSQL 16 ou superior.
- Ferramenta dotnet-ef disponível para aplicar migrations manualmente, quando necessário.

## Configuração local

### 1. Banco de dados

Crie um banco PostgreSQL chamado **treino_system** (ou use outro nome e atualize o .env).

Exemplo SQL:

~~~sql
CREATE DATABASE treino_system;
~~~

### 2. API

No PowerShell, a partir da raiz do repositório:

~~~powershell
Copy-Item TreinoAPI/.env.example TreinoAPI/.env
notepad TreinoAPI/.env
~~~

Preencha os valores locais:

| Variável | Uso |
| --- | --- |
| **DB_HOST** | Host do PostgreSQL, normalmente localhost |
| **DB_PORT** | Porta do PostgreSQL, normalmente 5432 |
| **DB_NAME** | Nome do banco, normalmente treino_system |
| **DB_USER** | Usuário do PostgreSQL |
| **DB_PASSWORD** | Senha local do PostgreSQL |
| **AUTH_JWT_SECRET** | Segredo aleatório exclusivo com pelo menos 32 bytes |
| **FRONTEND_ORIGINS** | Origem do frontend; localmente http://localhost:5173 |
| **ADMIN_EMAIL** | E-mail da conta ADMIN inicial |
| **ADMIN_PASSWORD** | Senha forte da conta ADMIN inicial (mínimo 8 caracteres) |

Gere um segredo JWT no PowerShell sem reutilizar o exemplo:

~~~powershell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(48))
~~~

Defina uma senha ADMIN forte e guarde-a em um gerenciador de senhas. Não compartilhe nem versione o arquivo **TreinoAPI/.env**.

Instale a ferramenta EF se necessário:

~~~powershell
dotnet tool install --global dotnet-ef
~~~

Aplique as migrations:

~~~powershell
Set-Location TreinoAPI
dotnet ef database update
~~~

Inicie a API usando HTTPS:

~~~powershell
dotnet dev-certs https --trust
dotnet run --launch-profile https
~~~

- API: https://localhost:7285
- Swagger (Development): https://localhost:7285/swagger

Em Development, a API também aplica migrations pendentes na inicialização. O comando dotnet ef database update é útil para validar/aplicar o schema antes de iniciar.

### 3. Frontend

Em outro terminal, a partir da raiz:

~~~powershell
Set-Location web-system
Copy-Item .env.example .env
npm ci
npm run dev
~~~

Acesse http://localhost:5173/training-Aplication/. O arquivo **web-system/.env** deve apontar **VITE_API_URL=https://localhost:7285**.

### 4. App mobile do aluno

Em outro terminal, a partir da raiz:

~~~powershell
Set-Location mobile-app
npm ci
npx expo start
~~~

Abra o QR Code no Expo Go compatível com o SDK 58. Configure `mobile-app/.env` com `EXPO_PUBLIC_API_URL` apontando para a API HTTPS acessível pelo aparelho. O app possui login, cadastro pendente de aprovação, consulta de ficha, execução sincronizada, notificações, mensagens e calendário de avaliações. Consulte `mobile-app/README.md` para detalhes das telas e validações.

## Primeiro acesso

1. Inicie PostgreSQL e API.
2. A primeira inicialização cria os grupos musculares padrão e cria o ADMIN indicado em **ADMIN_EMAIL** / **ADMIN_PASSWORD**, caso ainda não exista uma conta ADMIN. Defina essas credenciais localmente antes de iniciar a API pela primeira vez; em produção, injete-as pelo gerenciador de segredos do provedor. Não registre senhas na documentação nem as compartilhe em mensagens.
3. Inicie o frontend e entre com as credenciais ADMIN.
4. Na seção **Equipe**, o ADMIN cria os Personais com e-mail e senha inicial e vincula alunos já cadastrados.
5. Compartilhe as credenciais iniciais com cada profissional por um canal seguro. O Personal entra pela mesma tela de login, mas não terá acesso à seção Equipe nem às funções administrativas.
6. Um Personal pode cadastrar alunos diretamente; nesse caso, o vínculo com ele é criado automaticamente.
7. No painel, o Personal usa **Assumir atendimento** para abrir um aluno. Na barra superior pode voltar à lista para trocar de aluno ou **Encerrar atendimento** para limpar a seleção atual. Alterações não salvas são protegidas por confirmação antes de trocar/encerrar.
8. Abra **Avaliações** para criar quantos registros forem necessários. Use **Comparação** para escolher duas avaliações e **Histórico** para consultar autoria e alterações. Na área **Controle de Aluno → Evolução**, analise as solicitações de avaliação e marque novas datas; o aluno acompanha o calendário e recebe uma notificação no app.
9. Se quiser, ative o **Salvamento automático** em **Configurações** ou em **Salvar** e escolha o intervalo de inatividade. A preferência é individual e fica neste navegador; apenas a configuração é local, os dados da ficha continuam sendo enviados ao PostgreSQL. O botão **Salvar agora** permanece disponível.

## Comandos de validação

Frontend:

~~~powershell
Set-Location web-system
npm run typecheck
npm run build
~~~

API:

~~~powershell
Set-Location TreinoAPI
dotnet build
dotnet ef migrations list
~~~

## Segurança e dados

- Senhas são armazenadas com hash BCrypt.
- Access token e refresh token são enviados em cookies HttpOnly; o refresh token é rotacionado.
- Operações mutáveis exigem token antifalsificação CSRF.
- Login/cadastro/refresh possuem rate limit.
- A API aplica autenticação por padrão. ADMIN e qualquer PERSONAL ativo podem consultar e modificar alunos ativos da equipe, inclusive cadastros pendentes para análise; ALUNO só acessa os próprios dados. `ConvidadoPorPersonalId`, `ConvitePersonalId` e `PersonalAluno` preservam origem/histórico, mas não são regras de autorização. Somente ADMIN gerencia contas da equipe.
- O chat valida os participantes ativos em cada operação. O aluno pode conversar com qualquer Personal ativo; as mensagens e anexos permanecem privados entre os participantes, mas o acesso à ficha do aluno pela equipe não depende de conversa nem de vínculo de convite. Anexos ficam em armazenamento privado, são validados por assinatura e precisam passar por um antivírus configurado antes de serem publicados.
- O ADMIN inicial é criado por seed idempotente. Alterar as variáveis de ambiente depois que a conta já existe não troca automaticamente sua senha.
- Excluir um aluno remove seus dados relacionados; a ação é irreversível. Treinos removidos da ficha são arquivados para preservar o histórico de execução.

## Limites desta primeira versão

- O banco deve estar com todas as migrations aplicadas. Em Development, a API aplica migrations pendentes na inicialização; fora desse ambiente, aplique-as manualmente antes de publicar e faça backup antes de qualquer atualização de schema.
- Solicitações urgentes de avaliação notificam todos os personais ativos; as demais aparecem na fila compartilhada de acompanhamento. Push remoto de mensagens usa Expo Push e exige configuração do projeto EAS e credenciais APNs/FCM.
- Relatórios administrativos, indicadores por profissional, auditoria técnica para ADMIN e histórico de atividades por aluno estão implementados. A auditoria geral registra operações mutáveis; a timeline do aluno associa os eventos aos recursos e ao aluno relacionado.
- O envio de convite/recuperação de senha por e-mail não está integrado; as credenciais iniciais devem ser entregues por canal seguro.
- Para produção, configure HTTPS real, CORS com domínios definitivos, secrets no provedor de deploy, backups PostgreSQL e aplique migrations antes de iniciar a API. A aplicação não executa migrations automaticamente fora de Development.
- Para configurar antivírus, armazenamento de anexos, push mobile e operação/escala do chat, consulte [`CHAT_SETUP.md`](CHAT_SETUP.md).

## Publicação para o cliente

Antes de liberar o primeiro acesso, siga [`RELEASE_READINESS.md`](RELEASE_READINESS.md). O documento reúne configuração por ambiente, build de produção, migrations, backups, health checks, smoke tests, rollback e limitações conhecidas. Não use os valores dos arquivos `.env.example` como credenciais reais.

### Imagens Docker

Execute os builds a partir da raiz do repositório. A imagem da API usa o contexto raiz para copiar somente o projeto .NET; a imagem web recebe a URL pública da API no momento do build.

~~~powershell
docker build -f TreinoAPI/Dockerfile -t treino-system-api:release .
docker build -f web-system/Dockerfile --build-arg VITE_API_URL=https://api.seu-dominio.com -t treino-system-web:release web-system
~~~

Configure as variáveis de produção no provedor, mantenha `/data` da API em armazenamento persistente e exponha os containers somente por um proxy HTTPS configurado. Não publique a API diretamente sem ajustar `AllowedHosts`, `FRONTEND_ORIGINS` e, quando aplicável, `FORWARDED_HEADERS_ENABLED`/`FORWARDED_TRUSTED_PROXIES`.
