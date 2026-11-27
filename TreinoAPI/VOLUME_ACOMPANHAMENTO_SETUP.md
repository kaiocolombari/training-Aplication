# Acompanhamento mensal do volume por treino

## Conceito e semântica

O acompanhamento é separado da prescrição mutável e do histórico de sessões executadas.

- **Referência inicial:** soma das séries planejadas nos exercícios principais do treino no momento em que ADMIN/PERSONAL inicia o ciclo.
- **Snapshot:** nome do treino, nomes dos exercícios e séries planejadas são copiados para JSONB. Alterações posteriores na ficha não reescrevem essa referência.
- **Registro mensal:** o aluno informa quantas séries consegue concluir em uma sessão comparável ao protocolo de referência. É uma autoavaliação informada, não a soma de todas as sessões do mês e não é calculada automaticamente a partir de `ExecucaoSerie`.
- **Variações:** são alternativas de exercício, portanto não entram na soma da referência.
- **Mês 1:** ponto de referência inicial na data de início. O Mês 2 fecha o primeiro período mensal (data de início até um mês depois, exclusive); os meses seguintes seguem em períodos mensais sucessivos. O Mês 12 é o décimo primeiro fechamento após a referência, mantendo 12 pontos no gráfico. O ciclo permanece aberto por até 12 meses para permitir o preenchimento de registros pendentes. Um mês sem registro permanece `null` e não é classificado como manutenção ou queda.
- **Ciclos seguintes:** iniciar um novo ciclo para o mesmo treino encerra o anterior sem remover seus snapshots ou registros.

O número de séries, isoladamente, não mede toda a evolução física nem prova ganho de condicionamento. A comparação deve ser interpretada considerando a manutenção do protocolo de referência. Se a estrutura do treino mudar significativamente, o profissional deve iniciar um novo ciclo.

## Fluxo no painel

- ADMIN/PERSONAL abre **Alunos** e usa **Acompanhar** no aluno desejado. Todo Personal ativo pode selecionar qualquer aluno ativo da equipe; o convite registra a origem, não limita o acesso.
- Dentro de **Controle do aluno**, o seletor **Aluno monitorado** permite trocar diretamente para outro aluno acessível, sem voltar ao diretório. A troca reutiliza o carregamento de ficha existente e respeita a proteção contra alterações não salvas.
- A visão geral do Controle do aluno também tem um atalho **Volume mensal**, além da aba na navegação interna.
- O profissional inicia um ciclo e consulta gráfico/histórico. O formulário de autoavaliação só aparece para o ALUNO no próprio portal.

## Endpoints

| Método | Endpoint | Permissão | Finalidade |
|---|---|---|---|
| `GET` | `/api/alunos/{alunoId}/volume-ciclos` | ADMIN, qualquer PERSONAL ativo ou ALUNO dono | Lista ciclos e os 12 pontos calculados |
| `POST` | `/api/alunos/{alunoId}/volume-ciclos` | ADMIN ou qualquer PERSONAL ativo | Inicia um ciclo e captura a prescrição atual |
| `POST` | `/api/volume-ciclos/{cicloId}/registros` | Somente ALUNO dono do ciclo | Registra o fechamento mensal |

### Iniciar ciclo

```json
{
  "treinoId": "00000000-0000-0000-0000-000000000000",
  "dataInicio": "2026-11-16"
}
```

A API consulta o treino no banco, calcula o total de séries e rejeita treinos sem séries planejadas. A data é opcional; quando omitida, é usada a data atual de São Paulo.

### Registrar mês

```json
{
  "mesCiclo": 2,
  "seriesInformadas": 15,
  "observacao": "Consegui concluir todas as séries do protocolo."
}
```

O mês 1 é criado implicitamente pela referência inicial. Os meses seguintes só podem ser registrados após o fim do respectivo período. Meses anteriores não registrados podem ser preenchidos enquanto o ciclo estiver aberto. Cada ciclo aceita um único registro por mês; os registros são append-only. A observação opcional é preservada e aparece junto ao mês no histórico.

O endpoint de registro exige token com papel `ALUNO` e valida que o ciclo pertence ao próprio aluno autenticado. ADMIN e qualquer PERSONAL ativo podem consultar o histórico e iniciar ciclos, mas não podem enviar autoavaliações em nome do aluno. O autor do registro é obtido do token no backend; o cliente não envia `alunoId` nem `usuarioId` no corpo.

### Integração com o aplicativo mobile

O portal web atual é apenas um cliente da API. O aplicativo mobile poderá usar o mesmo endpoint `POST /api/volume-ciclos/{cicloId}/registros`, enviando o mesmo JSON e o token de autenticação do aluno. A regra de negócio, validação de período, autoria, ownership, persistência e cálculos permanecem no backend; não é necessário migrar registros nem criar uma segunda implementação mobile. O endpoint `GET` também pode alimentar a tela mobile de histórico/gráfico.

O contrato atual representa uma **autoavaliação mensal declarada pelo aluno**. Se no futuro a intenção for calcular automaticamente o volume a partir das sessões efetivamente executadas no mobile, isso deve ser uma origem de dados separada, agregada a partir das execuções reais e comparada com o snapshot da prescrição. Não se deve substituir silenciosamente a autoavaliação nem misturar séries planejadas, séries executadas e capacidade relatada em um único campo.

## Cálculos

- Diferença acumulada: `seriesInformadas - referenciaSeries`.
- Variação acumulada: `(diferença / referenciaSeries) * 100`.
- Diferença mensal: `seriesInformadas - seriesDoMesImediatamenteAnterior`.
- Variação mensal: `(diferença mensal / seriesDoMesImediatamenteAnterior) * 100`.
- Classificação: `EVOLUCAO`, `MANUTENCAO` ou `QUEDA` conforme comparação numérica.
- Se o mês imediatamente anterior não tiver registro, a comparação mensal fica indisponível; não se pula um mês ausente para comparar com um registro mais antigo.

## Migration e validação

Migration: `20261116212012_StudentTrainingVolumeTracking`.

Aplicar no ambiente desejado a partir da pasta `TreinoAPI`:

```powershell
dotnet ef database update
```

Checklist manual:

1. Como ADMIN/PERSONAL, abrir Controle do aluno, iniciar um ciclo e conferir o total de séries e o snapshot dos exercícios.
2. Trocar o aluno pelo seletor do cabeçalho; confirmar que a ficha e os ciclos exibidos pertencem ao novo aluno e que qualquer PERSONAL ativo consegue abrir alunos convidados por outros profissionais.
3. Alterar a prescrição e confirmar que o snapshot e a referência anteriores não mudam.
4. Como ADMIN/PERSONAL, confirmar que o histórico é consultável e que não existe formulário de autoavaliação; tentar `POST` de registro e confirmar `403`.
5. Como ALUNO, consultar o portal e confirmar que o período ainda aberto não pode ser registrado.
6. Após o fechamento do período, enviar um valor pelo portal; confirmar que o gráfico, diferença absoluta, percentual e classificação são atualizados.
7. Deixar um mês sem registro e confirmar que ele aparece como não registrado e interrompe a comparação mês a mês.
8. Tentar registrar o mesmo mês novamente e confirmar conflito.
9. Iniciar novo ciclo para o mesmo treino e confirmar que o anterior fica encerrado, mas continua consultável.
10. Validar isolamento entre alunos: ALUNO não consulta nem registra ciclos de outro aluno; qualquer PERSONAL ativo acessa os alunos da equipe, mas não os dados de outros alunos fora do sistema.
