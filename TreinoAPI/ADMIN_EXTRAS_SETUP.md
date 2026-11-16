# Módulos administrativos extras

## Funcionalidades

- **Indicadores da equipe:** carteira de alunos vinculados, treinos ativos nas carteiras, avaliações no período, tarefas abertas/concluídas, feedbacks e ações registradas na auditoria. A consulta aceita um período de até 12 meses.
- **Feedback dos alunos:** alunos aprovados podem enviar nota, categoria, comentário e escolher um personal vinculado ou enviar à equipe de forma geral. A equipe acompanha o status e pode responder; o aluno consulta a resposta no portal.
- **Agenda de tarefas:** cada personal possui uma agenda própria. ADMIN pode atribuir tarefas a qualquer personal; PERSONAL cria tarefas apenas na própria agenda. Uma tarefa pode ser geral ou vinculada a um aluno ativo daquele profissional, com descrição, contexto, prioridade, prazo e status.
- **Parâmetros de acompanhamento:** cada personal configura intervalo de reavaliação, intervalo de revisão de treino e antecedência para futuras sugestões. Nesta versão os valores são armazenados e exibidos, sem geração automática de tarefas ou recomendações.
- **Saúde do sistema e manutenção:** ADMIN visualiza conexão PostgreSQL, disponibilidade de escrita do armazenamento privado, configuração SMTP e uptime do processo. ADMIN e PERSONAL podem registrar ocorrências; PERSONAL visualiza as próprias e ADMIN visualiza todas, atribui responsáveis e atualiza status/resolução.

## Permissões

| Recurso | ADMIN | PERSONAL | ALUNO |
|---|---|---|---|
| Indicadores da equipe | Todos | — | — |
| Feedback | Todos | Feedback dos alunos vinculados ou geral | Envia e consulta os próprios |
| Tarefas | Consulta todas e atribui | Consulta e gerencia somente a própria agenda | — |
| Parâmetros de acompanhamento | Consulta/configura por personal | Somente a própria configuração | — |
| Saúde do sistema | Consulta | — | — |
| Manutenção | Consulta, atribui e atualiza | Registra e acompanha as próprias ocorrências | — |

As permissões são verificadas no backend. A filtragem da interface não substitui autorização da API.

## Endpoints

- `GET /api/indicadores-equipe?inicio=YYYY-MM-DD&fim=YYYY-MM-DD`
- `GET /api/admin/saude`
- `GET /api/feedback`, `GET /api/feedback/meus`, `GET /api/feedback/personais`, `POST /api/feedback`, `PATCH /api/feedback/{id}`
- `GET /api/tarefas`, `POST /api/tarefas`, `PUT /api/tarefas/{id}`
- `GET /api/tarefas/configuracao`, `PUT /api/tarefas/configuracao`, `GET /api/tarefas/personais`, `GET /api/tarefas/alunos`
- `GET /api/manutencao`, `POST /api/manutencao`, `GET /api/manutencao/responsaveis`, `PUT /api/manutencao/{id}`

## Banco e publicação

Migration: `20261116185335_AdminExtrasFeedbackTasksMaintenance`.

Para aplicar no ambiente de produção, depois de configurar o acesso ao banco:

```powershell
dotnet ef database update --project TreinoAPI/TreinoAPI.csproj --startup-project TreinoAPI/TreinoAPI.csproj
```

A migration foi aplicada ao banco local `TreinoDB` durante a implementação. O algoritmo inteligente futuro deverá consumir os parâmetros salvos por personal e criar sugestões para revisão humana; ele não está ativo nesta versão.

## Observações operacionais

- Os indicadores de carteira contam vínculos por personal; um aluno associado a mais de um profissional aparece em cada carteira. Não interpretar a soma dos vínculos como quantidade de alunos únicos.
- O estado SMTP indica se as configurações essenciais existem; não executa autenticação ou envio de teste ao provedor.
- A checagem do armazenamento cria e remove um arquivo temporário no diretório privado configurado para os arquivos da equipe.
- As tarefas podem conter contexto sensível sobre o aluno. O conteúdo fica disponível ao ADMIN e ao personal responsável, conforme as regras de acesso da API.
