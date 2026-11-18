# Treino System Mobile

Protótipo do aplicativo do aluno, separado do painel web e da API.

## Stack

- Expo SDK 58 + React Native + TypeScript.
- Expo Router para navegação por rotas.
- NativeWind 4.2.7 + Tailwind CSS 3.4.
- AsyncStorage para preservar localmente uma sessão de treino em andamento.
- Lucide para ícones.

## Executar

Na raiz do repositório:

```powershell
Set-Location mobile-app
npm ci
npx expo start
```

Abra o QR Code com o Expo Go compatível com o SDK do projeto ou inicie um emulador Android com `npx expo start --android`.

Validação local:

```powershell
npm run typecheck
npm run lint
npx expo-doctor
```

## Telas do protótipo

- **Hoje:** treino do dia, semana, consistência e retomada de uma sessão salva.
- **Treinos:** agenda semanal, ficha atual e periodização.
- **Detalhe do treino:** exercícios, séries, repetições, carga e descanso prescritos.
- **Execução:** fluxo sequencial por exercício e série, edição de carga/repetições/RIR, registro de dor/desconforto e observações, salvar e continuar depois ou finalizar.
- **Evolução:** indicadores e gráficos ilustrativos de medidas e força.
- **Perfil:** dados do aluno, profissional responsável, avaliações, lembretes e suporte.

## Estado atual

Este é um protótipo navegável com dados fictícios. Não há login, sincronização, envio de execução, feedback ou consulta à API ainda. A sessão em andamento fica salva apenas no dispositivo para demonstrar o fluxo de pausa e retomada. Os números da tela Evolução também são ilustrativos e não devem ser tratados como dados reais.

Próxima etapa de integração: autenticar como `ALUNO`, consultar os treinos/periodização autorizados e enviar ao backend as séries executadas e os relatos de desconforto/dor, preservando o vínculo com o aluno.
