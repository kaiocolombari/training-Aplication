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
- Atendimento simples: o Personal assume um aluno, volta à lista para trocar de aluno ou encerra o atendimento atual.
- Salvamento automático opcional, configurável por profissional (2, 4, 6 ou 10 segundos de inatividade), disponível em Configurações e na tela Salvar; o salvamento manual continua disponível.
- Prescrição de treinos, exercícios e variações.
- Periodização por semanas/dias e associação de treinos.
- Volume semanal por grupo muscular.
- Registro de execução diária por série, incluindo carga, repetições, RIR/RPE, descanso, velocidade, cluster, drop-set, rest-pause e falha.
- Importação/exportação de fichas em JSON.

A conta ALUNO pode ser criada, mas a integração do portal de consulta do aluno com a API ainda não faz parte desta versão. O ADMIN gerencia a equipe; o PERSONAL só visualiza e altera alunos com vínculo ativo. Os módulos de ficha são acessados depois de assumir/abrir um aluno.

## Requisitos

- .NET SDK 10.
- Node.js compatível com Vite 8 (Node 20.19+ ou 22.12+).
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

### 4. App mobile (protótipo visual)

Em outro terminal, a partir da raiz:

~~~powershell
Set-Location mobile-app
npm ci
npx expo start
~~~

Abra o QR Code no Expo Go compatível com o SDK 58. O app mobile é um protótipo navegável com dados demonstrativos; ainda não realiza login nem sincroniza execuções com a API. Consulte `mobile-app/README.md` para detalhes das telas e validações.

## Primeiro acesso

1. Inicie PostgreSQL e API.
2. A primeira inicialização cria os grupos musculares padrão e cria o ADMIN indicado em **ADMIN_EMAIL** / **ADMIN_PASSWORD**, caso ainda não exista uma conta com aquele e-mail.
   - Neste ambiente local, o e-mail inicial configurado é **admin@treinosystem.local**. A senha aleatória foi gravada somente em **TreinoAPI/.env**; consulte esse arquivo no seu computador para copiá-la. Você pode trocar as duas variáveis antes do primeiro login.
3. Inicie o frontend e entre com as credenciais ADMIN.
4. Na seção **Equipe**, o ADMIN cria os Personais com e-mail e senha inicial e vincula alunos já cadastrados.
5. Compartilhe as credenciais iniciais com cada profissional por um canal seguro. O Personal entra pela mesma tela de login, mas não terá acesso à seção Equipe nem às funções administrativas.
6. Um Personal pode cadastrar alunos diretamente; nesse caso, o vínculo com ele é criado automaticamente.
7. No painel, o Personal usa **Assumir atendimento** para abrir um aluno. Na barra superior pode voltar à lista para trocar de aluno ou **Encerrar atendimento** para limpar a seleção atual. Alterações não salvas são protegidas por confirmação antes de trocar/encerrar.
8. Abra **Avaliações** para criar quantos registros forem necessários. Use **Comparação** para escolher duas avaliações e **Histórico** para consultar autoria e alterações.
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
- A API aplica autenticação por padrão e restringe recursos ao ADMIN ou aos Personais com vínculo ativo ao aluno. Somente ADMIN cria/gerencia contas de Personal e vínculos; o profissional pode encerrar o atendimento atual sem apagar o vínculo nem o histórico.
- O ADMIN inicial é criado por seed idempotente. Alterar as variáveis de ambiente depois que a conta já existe não troca automaticamente sua senha.
- Excluir um aluno remove seus dados relacionados; a ação é irreversível. Treinos removidos da ficha são arquivados para preservar o histórico de execução.

## Limites desta primeira versão

- O portal do aluno integrado à API ainda não está incluído.
- Existe um protótipo visual do app do aluno em `mobile-app/`, feito com Expo, React Native e NativeWind. Ele usa dados demonstrativos e ainda não autentica nem consulta a API.
- Mensagens, feedback, relatórios administrativos e trilha geral de auditoria do sistema ainda não estão implementados. A trilha de auditoria das avaliações físicas está disponível.
- O envio de convite/recuperação de senha por e-mail não está integrado; as credenciais iniciais devem ser entregues por canal seguro.
- Para produção, configure HTTPS real, CORS com domínios definitivos, secrets no provedor de deploy, backups PostgreSQL e aplique migrations antes de iniciar a API. A aplicação não executa migrations automaticamente fora de Development.
