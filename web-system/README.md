# Frontend — Treino System

O guia completo de instalação, configuração do PostgreSQL, criação do ADMIN e inicialização da API está no [README da raiz](../README.md).

## Desenvolvimento local

~~~powershell
Copy-Item .env.example .env
npm ci
npm run dev
~~~

Frontend: http://localhost:5173/training-Aplication/

Configure **VITE_API_URL** no arquivo **.env** para apontar para a API ASP.NET Core (localmente, https://localhost:7285).

O **Controle de Aluno → Evolução** possui um calendário expansível com avaliações realizadas e agendadas. Nessa área, o personal visualiza solicitações enviadas pelo aluno (incluindo urgência e data/hora do envio), pode agendar a data desejada ou outra data, adicionar uma descrição opcional ou recusar o pedido. O aluno recebe uma notificação no aplicativo quando a solicitação é analisada.

## Validação

~~~powershell
npm run typecheck
npm run build
~~~
