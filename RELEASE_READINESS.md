# Preparação de release — Treino System

**Escopo:** API ASP.NET Core 10 + PostgreSQL, painel web React Router/Vite e aplicativo Expo SDK 58.

Este documento é um checklist operacional para a primeira implantação com cliente. Os builds locais foram validados, mas isso **não equivale a uma homologação em produção**. Nenhum banco, migration, container remoto, publicação de loja ou serviço do cliente foi alterado nesta preparação.

## 1. Bloqueadores antes de liberar o cliente

- [ ] **Senhas legadas:** `PasswordService` ainda aceita credenciais antigas armazenadas fora do formato BCrypt e converte a senha para BCrypt somente depois de um login válido. Antes de importar/usar uma base antiga, confirme que não há contas nesse formato. Se houver, planeje uma migração controlada ou redefinição de senha; não remova o fallback sem essa etapa, pois usuários antigos podem perder acesso.
- [ ] **Identidade do app:** `mobile-app/app.json` ainda precisa dos identificadores definitivos `android.package` e `ios.bundleIdentifier`, registrados sob domínio/organização controlados pelo cliente. Não invente nem troque esses identificadores depois da primeira distribuição.
- [ ] **Projeto Expo:** configure o ID real do projeto em `EXPO_PUBLIC_EAS_PROJECT_ID` e vincule o repositório ao projeto EAS correto. No checkout auditado, o valor não está configurado no app resolvido; os builds de loja não foram executados.
- [ ] **Domínios e HTTPS:** defina os domínios finais da API e do web, certificado TLS, allowlist CORS e host filtering. Prefira web e API no mesmo site (por exemplo, subdomínios do mesmo domínio registrável), pois a sessão web usa cookies HttpOnly e CSRF.
- [ ] **Privacidade e consentimento:** publique política de privacidade e termos/avisos aplicáveis, defina responsável pelo tratamento, finalidade, retenção, atendimento a solicitações LGPD, política de exclusão/backup e informações exigidas pelas lojas. O sistema armazena dados pessoais, medidas corporais, histórico de treino, relatos de dor, conversas e anexos.
- [ ] **Banco e arquivos:** configure backup automático do PostgreSQL e do volume de arquivos, retenção, criptografia do provedor e teste real de restauração. Backup apenas do banco não inclui os anexos guardados no filesystem.

## 2. Variáveis da API

Use `TreinoAPI/.env.example` como referência local; em produção, injete valores pelo secret manager do provedor, sem copiar os placeholders.

| Variável | Produção |
|---|---|
| `ASPNETCORE_ENVIRONMENT` | `Production` |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Credenciais dedicadas e restritas do PostgreSQL; prefira TLS na conexão quando suportado |
| `AUTH_JWT_SECRET` | Segredo aleatório forte, exclusivo, com pelo menos 32 bytes; nunca versionar |
| `Auth__Issuer`, `Auth__Audience` | Valores estáveis e exclusivos deste ambiente |
| `Auth__AccessTokenMinutes` | Entre 1 e 60; padrão recomendado do projeto: 15 |
| `Auth__RefreshTokenDays` | Entre 1 e 90; padrão recomendado do projeto: 7 |
| `FRONTEND_ORIGINS` | Origens HTTPS exatas do web, separadas por ponto e vírgula; sem caminhos |
| `AllowedHosts` | Hostnames públicos da API, separados por ponto e vírgula; wildcard é bloqueado em produção |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Obrigatórios somente para criar o primeiro ADMIN quando ainda não existe; mudar as variáveis depois não redefine a conta |
| `TEAM_FILES_STORAGE_PATH`, `CHAT_FILES_STORAGE_PATH` | Diretórios persistentes, fora de `wwwroot` |
| `CHAT_ANTIVIRUS_COMMAND`, `CHAT_ANTIVIRUS_ARGUMENTS` | Scanner antivírus real, instalado e atualizado no ambiente; anexos falham de forma segura se não houver scanner configurado |
| `EXPO_ACCESS_TOKEN` | Opcional, para push remoto via Expo |
| `Email__Enabled` e `Email__Smtp__*` | Opcional; mantenha desativado até SMTP e remetente serem verificados |

### Proxy reverso

Se TLS terminar em um proxy e a API receber HTTP internamente, configure:

- `FORWARDED_HEADERS_ENABLED=true`
- `FORWARDED_TRUSTED_PROXIES` com os IPs reais e confiáveis do proxy, separados por ponto e vírgula.

A API rejeita a configuração se o recurso estiver ativo sem IPs válidos. Não confie indiscriminadamente em `X-Forwarded-For`/`X-Forwarded-Proto` de clientes. Mantenha a porta interna do container inacessível diretamente à internet.

## 3. Containers

Build da API, a partir da raiz do repositório:

```powershell
docker build -f TreinoAPI/Dockerfile -t treino-system-api:release .
```

Build web, usando a URL HTTPS da API como argumento de build:

```powershell
docker build -f web-system/Dockerfile --build-arg VITE_API_URL=https://api.seu-dominio.com -t treino-system-web:release web-system
```

- A imagem da API escuta em `8080`, executa como usuário não-root e usa `/data` para arquivos. Monte `/data` em volume persistente.
- A imagem web escuta em `3000`. `VITE_API_URL` é incorporada ao bundle durante o build; mudar a variável somente no runtime não altera a URL já compilada.
- Os arquivos `.env` e `.env.*` são excluídos do contexto Docker. Não remova essa proteção.
- O Docker CLI não estava disponível no ambiente desta auditoria; os Dockerfiles foram revisados, mas as imagens não foram construídas aqui.

## 4. Banco de dados e migrations

O projeto contém migrations desde `InitialCreate` até `PersonalExecutionReview`. O estado aplicado no banco do cliente não foi consultado.

Procedimento recomendado, com janela de manutenção:

1. Faça backup verificável do banco e do volume `/data`.
2. Aponte a API para o banco correto e valide conectividade.
3. Revise o SQL de cada migration que ainda não estiver aplicada.
4. No diretório `TreinoAPI`, confira e aplique as migrations manualmente:

```powershell
dotnet ef migrations list
dotnet ef database update
```

5. Inicie a API e valide `/health/live` e `/health/ready`.
6. Execute os smoke tests da seção 7 antes de liberar usuários.

Em produção, a API não aplica migrations automaticamente. Não execute `database update` em produção sem backup, revisão do SQL e confirmação do banco/ambiente.

## 5. Health checks e operação

- `GET /health/live`: processo HTTP ativo.
- `GET /health/ready`: verifica acesso ao PostgreSQL; retorna HTTP 503 quando a dependência não está disponível.
- Colete logs estruturados do container e monitore erros HTTP 5xx, falhas de autenticação, limites 429, latência, uso de CPU/memória, conexões PostgreSQL e espaço do volume.
- Configure alertas de backup falho, banco indisponível, volume próximo do limite e falhas de envio de e-mail/push.
- Defina política de rotação de logs e evite registrar tokens, senhas, conteúdo de mensagens ou dados de avaliação.

## 6. Aplicativo mobile — Expo/EAS

Perfis criados em `mobile-app/eas.json`:

- `preview`: distribuição interna; Android gera APK para teste com o cliente.
- `production`: builds destinados às lojas; Android usa App Bundle por padrão e o versionamento remoto é incrementado.

Configure nos ambientes EAS `preview` e `production`:

- `EXPO_PUBLIC_API_URL`: URL HTTPS pública da API.
- `EXPO_PUBLIC_EAS_PROJECT_ID`: ID público do projeto Expo associado ao app.

Comandos:

```powershell
Set-Location mobile-app
npx eas-cli@latest build --platform android --profile preview
npx eas-cli@latest build --platform all --profile production
```

O primeiro build ainda exige vincular o projeto EAS, definir `android.package` e `ios.bundleIdentifier`, configurar credenciais de assinatura e revisar as permissões/descrições de uso nas lojas. Push remoto também depende das credenciais FCM/APNs e do token Expo configurado na API. Nenhum build EAS foi enviado nesta preparação.

## 7. Smoke tests obrigatórios

Execute com contas de teste separadas (ADMIN, dois PERSONAIS e pelo menos dois ALUNOS). Não use dados reais para homologação.

- [ ] Login, logout, expiração/renovação de sessão e revogação de refresh token.
- [ ] Definir com o cliente os critérios, pesos e nota de corte do formulário; até isso ser especificado, a aprovação permanece manual (aprovar/reprovar + observação).
- [ ] Qualquer Personal ativo consegue abrir e atualizar alunos ativos da equipe, inclusive revisar cadastros pendentes, independentemente de quem enviou o convite; a origem permanece apenas para atribuição/auditoria.
- [ ] Um aluno não consegue consultar dados de outro aluno alterando IDs nas rotas.
- [ ] Aluno pode iniciar chat com qualquer Personal ativo; as mensagens permanecem privadas aos participantes, enquanto todo Personal ativo consegue consultar a ficha do aluno aprovado independentemente da conversa/origem do convite.
- [ ] Mensagens, anexos, SignalR, push e expiração de conversa funcionam; anexos não são liberados sem scanner antivírus aprovado.
- [ ] Personal recebe execução do treino, dor/feedback, pendências, revisa e a revisão fica registrada com autor/data.
- [ ] Reenvio de execução após falha de rede não duplica registros; fila pendente continua associada ao aluno correto.
- [ ] Encerrar sessão, trocar conta e entrar com outro aluno não mostra sessão, histórico ou fila de envio da conta anterior.
- [ ] App reiniciado durante treino restaura a sessão do mesmo aluno; modo avião não perde estado e a sincronização ocorre ao reconectar.
- [ ] Dados opcionais ausentes aparecem como não informados/indisponíveis, não como zero fabricado.
- [ ] HTTP 403, 404, 429, 500, API offline e PostgreSQL offline apresentam comportamento controlado.
- [ ] Web em desktop e celular: navegação, formulários, upload, download, impressão/exportação quando aplicável e atualização de página em rotas internas.
- [ ] Teste de backup e restauração do banco e dos anexos em ambiente separado.

## 8. Riscos e limites identificados nesta auditoria

- O projeto não possui projetos de teste automatizado identificados; as validações realizadas foram build, TypeScript e lint. Os fluxos de negócio, permissões, concorrência e integração com serviços externos ainda precisam de testes integrados.
- `npm audit --omit=dev` aponta uma vulnerabilidade moderada de `minimatch` transitiva por `@expo/fingerprint` no toolchain Expo. O npm só oferece correção automática forçando downgrade do Expo para SDK 52; isso seria incompatível com o SDK 58 atual, então não foi aplicado. Reavalie quando o Expo atualizar a faixa dependente; não use `npm audit fix --force` neste projeto.
- O web foi atualizado para React Router `7.18.7` e Express `4.22.3`; removi a dependência direta não utilizada `react-node`, que trazia React `0.13.3`. O `npm audit` completo do web retorna zero vulnerabilidades. No mobile, Expo foi alinhado para `~58.1.0` e o Expo Doctor passou em 20/20 verificações; o alerta moderado de minimatch permanece restrito ao toolchain de fingerprint/build.
- Validação local final: API `dotnet build --no-restore` com 0 warnings/0 errors; web `npm run typecheck`, `npm run build` e `npm audit --omit=dev` passaram; mobile `npm run typecheck`, `npm run lint` e Expo Doctor 20/20 passaram. O build web ainda exibe avisos de depreciação `envFile` e future flags do React Router, sem falha de compilação.
- A compatibilidade de credenciais legadas em texto puro precisa ser resolvida/confirmada antes de usar uma base anterior.
- Os identificadores Android/iOS e o ID EAS ainda precisam ser definidos pelo responsável pelo app.
- Não foi possível testar containers, deploy, migrations, banco real, proxy, antivírus, APNs/FCM, SMTP, backup/restore nem lojas.
- As sessões/fila local antigas do mobile não possuem ID do aluno no formato anterior; por segurança, a nova versão passa a isolar esses dados por aluno e não importa automaticamente chaves globais antigas. Antes de atualizar aparelhos já em uso, conclua e sincronize qualquer treino em andamento.
- O checkout já contém o commit de preparação das funcionalidades recentes; as atualizações finais de dependências e este relatório ainda aparecem como modificações locais. Revise o diff completo e faça um commit de release revisado antes do deploy.

## 9. Critério de liberação

Só liberar o cliente depois de resolver todos os itens bloqueadores da seção 1, completar os smoke tests, validar backup/restore, aplicar migrations revisadas no banco correto, configurar domínios/segredos/antivírus/armazenamento e gerar builds assinados do mobile. Esta preparação deixa o projeto mais seguro e operacionalmente organizado, mas não substitui homologação no ambiente real.
