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

## Validação

~~~powershell
npm run typecheck
npm run build
~~~
