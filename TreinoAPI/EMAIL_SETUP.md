# Configuração do envio de e-mails

A Central de E-mails usa SMTP no backend. O endereço remetente e a identidade visual ficam em appsettings.json; credenciais SMTP ficam somente no .env, que é ignorado pelo Git.

## 1. Configurar o remetente

Edite a seção Email em appsettings.json:

- Enabled: altere para true quando estiver pronto para habilitar o envio.
- BrandName: nome exibido no cabeçalho e rodapé do e-mail.
- SenderName: nome que aparece no campo "De".
- SenderEmail: endereço da empresa que será usado como remetente. Está vazio intencionalmente para você preencher.
- ReplyToEmail: endereço opcional para receber respostas.
- LogoUrl: URL HTTPS pública do logotipo (opcional).
- PrimaryColor: cor principal do template em hexadecimal.

## 2. Configurar o servidor SMTP

Abra o arquivo .env que já existe dentro de TreinoAPI e acrescente as variáveis abaixo, usando .env.example apenas como referência. **Não sobrescreva o .env atual**, pois ele também contém as configurações de banco e autenticação.

- Email__Smtp__Host: servidor SMTP do provedor.
- Email__Smtp__Port: normalmente 587 para STARTTLS.
- Email__Smtp__Username: usuário SMTP.
- Email__Smtp__Password: senha SMTP ou senha de aplicativo.
- Email__Smtp__EnableSsl: mantenha true quando o provedor exigir TLS.

Nunca coloque senha SMTP no frontend, no Git ou em appsettings.json. O .env real já está no .gitignore.

Para melhorar a entrega e evitar que mensagens caiam em spam, configure também SPF, DKIM e DMARC no DNS do domínio remetente, conforme as instruções do provedor de e-mail.

## 3. Como funciona

- ADMIN pode selecionar alunos aprovados, personais ou destinatários individuais.
- PERSONAL só recebe a lista dos próprios alunos vinculados e não pode enviar para outros personais.
- O backend valida novamente todos os IDs; a seleção feita no navegador não concede permissões.
- Cada destinatário recebe uma mensagem individual, sem expor os endereços dos demais.
- O conteúdo é enviado em HTML responsivo e também em texto simples.
- Os tokens {{nome}} e {{primeiro_nome}} são substituídos individualmente.
- Um envio aceita até 100 destinatários e a rota possui limite de 4 requisições por minuto por usuário.
- Enquanto SMTP estiver desabilitado ou incompleto, a tela permite preparar e salvar um rascunho local, mas não simula o envio.

O histórico técnico da requisição de envio entra na trilha de auditoria existente. O conteúdo e as credenciais não são gravados na auditoria.
