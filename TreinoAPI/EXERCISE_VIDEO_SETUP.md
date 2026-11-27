# Catálogo e vídeos de exercícios

## O que entra no catálogo

- 314 exercícios únicos provenientes dos metadados do **Free Exercise DB with Videos** (MIT).
- 57 demonstrações em MP4 do **Workout Free Videos** (CC0 1.0), servidas por URLs jsDelivr fixadas na versão `v2.0.0`.
- Sinônimos em inglês da base MIT e sinônimos pt-BR adicionados à biblioteca CC0.
- Os vídeos do repositório MIT não são usados: o README diferencia a licença MIT dos metadados e a origem/licença dos arquivos de mídia.

A importação é idempotente e acontece no início da API, depois de o schema estar atualizado. A origem de cada registro fica gravada no catálogo; cada vídeo também armazena sua licença e fonte.

## Banco de dados

A migration gerada é:

```powershell
dotnet ef database update --project TreinoAPI/TreinoAPI.csproj --startup-project TreinoAPI/TreinoAPI.csproj
```

**Não execute em produção sem backup e janela de manutenção.** Primeiro publique/aplique a migration no ambiente de homologação, valide o catálogo e depois repita em produção. A API aplica migrations automaticamente somente em Development; em outros ambientes, o processo de deploy deve aplicar a migration antes de iniciar a versão nova.

O campo `TreinoExercicio.ExercicioCatalogoId` é opcional para manter os treinos antigos compatíveis. A API tenta reconhecer automaticamente o nome digitado por nome normalizado, sinônimos e similaridade textual. Correspondência aproximada só é vinculada quando a pontuação é alta e há distância suficiente do segundo candidato; correspondências ambíguas ficam sem vínculo para não mostrar uma demonstração errada. A associação pode ser melhorada adicionando sinônimos no painel.

## Upload próprio

O painel aceita MP4 até 100 MB. O envio exige confirmação de que a equipe possui os direitos de uso; quando o vídeo é licenciado, também exige a fonte/autorização. A API valida extensão, assinatura MP4, tamanho e aplica limite de 10 uploads por usuário a cada 5 minutos.

Configure:

```dotenv
EXERCISE_VIDEO_STORAGE_PATH=App_Data/exercicios-videos
```

O diretório precisa ficar **fora de `wwwroot`** e em armazenamento persistente. Em Docker/servidor com filesystem efêmero, monte um volume persistente e configure um caminho absoluto fora da pasta pública. O PostgreSQL guarda somente metadados e a chave do arquivo; o conteúdo binário não vai para o banco.

O endpoint de streaming suporta HTTP Range para permitir que o player avance/carregue trechos do MP4. O mobile envia o bearer token ao reproduzir uploads privados. Os vídeos CC0 são entregues diretamente pelo CDN público.

## Mobile

Foi adicionado `expo-video` compatível com Expo SDK 58. Depois de instalar a dependência e o plugin no `app.config.ts`, gere um novo build nativo/APK para que o módulo esteja disponível no aparelho. O player de execução reproduz o vídeo principal em loop, sem áudio, com controles e cache nativo.

## Fontes e licenças

Consulte [SeedData/ExerciseCatalog/SOURCES.md](SeedData/ExerciseCatalog/SOURCES.md) e os arquivos de licença ao lado dos snapshots.
