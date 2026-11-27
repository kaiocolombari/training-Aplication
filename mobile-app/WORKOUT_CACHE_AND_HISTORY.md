# Cache de treinos, catálogo e histórico mobile

## Cache diário

- O dashboard do aluno é persistido em `AsyncStorage` por aluno e data local (`@treino-system/dashboard:v1:<alunoId>:AAAA-MM-DD`).
- O cache inclui a ficha, a agenda semanal e os metadados/URLs dos vídeos dos exercícios. Avaliações, execuções, notificações e feedbacks são compactados para limitar o tamanho (últimas 12 avaliações, execuções dos últimos 30 dias até 100 registros, 6 ciclos de volume e 30 notificações/feedbacks).
- Ao abrir o app, os dados do dia são exibidos primeiro a partir do cache. A consulta completa só acontece quando não existe cache para o dia ou quando o aluno solicita atualização.
- Chaves de dias anteriores do mesmo aluno são removidas durante a hidratação do cache.
- A tela inicial e a lista de treinos oferecem atualização manual e gesto de puxar para baixo.

## Atualização da biblioteca de vídeos

- `GET /api/exercicios/catalogo/version` retorna uma versão leve calculada a partir da quantidade de exercícios ativos e do maior `AtualizadoEmUtc`.
- Inclusão/edição de sinônimos e inclusão/remoção/seleção de vídeo principal atualizam o timestamp do exercício.
- O mobile consulta essa versão ao abrir o cache e, enquanto o app está em primeiro plano, a cada 90 segundos.
- Quando a versão muda, o dashboard e as URLs dos vídeos são atualizados. A sessão ativa recebe apenas os novos campos `videoUrl` e `videoTitle` por ID de exercício; séries, cargas, descansos, cronômetros e progresso não são substituídos.
- Os bytes dos vídeos não são baixados em lote durante o carregamento da ficha. O player nativo usa o cache de mídia do `expo-video` ao reproduzir cada demonstração, evitando consumir armazenamento e dados móveis com vídeos que talvez não sejam assistidos.

## Relatórios de vídeo ausente

- O mobile envia um feedback `VIDEO_NAO_ENCONTRADO` com nome do exercício, nome/ID do treino, ID do exercício, plataforma e horário.
- A equipe encontra esses registros em **Feedback dos alunos**. O botão **Verificar novamente** executa a busca atual do catálogo e apresenta candidatos/quantidade de vídeos, sem associar exercícios automaticamente.
- Se o exercício existir, edite seus sinônimos na Biblioteca. Se não existir, cadastre o exercício e adicione o vídeo autorizado.

## Histórico compacto

- Ao concluir, a sessão ativa é removida de `@treino-system/active-session` e é gravado um resumo separado: treino, datas, duração, séries concluídas, exercícios, repetições e melhor carga por exercício.
- O histórico antigo em formato de sessão completa é convertido para o novo resumo na próxima hidratação.
- Entradas com mais de 30 dias são removidas durante a hidratação/conclusão; a tela exibe apenas as sessões do mês corrente.
- A fila de sincronização offline continua guardando o payload detalhado até que a API confirme o recebimento. Esse dado é separado do histórico visual compacto.

## Evolução / ML

A área de projeção está marcada como **Em breve**. Nenhum valor preditivo é apresentado até que o modelo de Machine Learning seja implementado, validado e aprovado.
