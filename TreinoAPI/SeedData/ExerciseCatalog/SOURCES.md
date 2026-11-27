# Exercise catalog data sources

This folder contains the sanitized source snapshots and generated seed used by the exercise catalog. The Free Exercise DB metadata snapshot has its video and thumbnail URL fields removed; no media assets from that repository are bundled or referenced.

## Workout Free Videos

- Repository: https://github.com/namnq/workout-free-videos
- Pinned release: `v2.0.0`
- License: CC0 1.0 Universal (see `workout-free-videos-LICENSE`)
- Imported: 57 exercise records and their MP4 demonstrations.
- Video delivery: version-pinned jsDelivr URLs in `exercise-catalog-seed.json`; the MP4 files are not duplicated in this repository.
- The seed marks these videos as `CC0` / `CC0-1.0`.

The upstream project explicitly dedicates its videos and data to the public domain under CC0 1.0 and documents commercial use.

## Free Exercise DB with Videos

- Repository: https://github.com/harshvishu/free-exercise-db-with-videos
- License: MIT (see `free-exercise-db-LICENSE`)
- Imported: exercise metadata only (names, aliases, target muscle, equipment, difficulty, descriptions and instructions), stored in `free-exercise-db-metadata.json`.
- Not imported: its hosted MP4 and thumbnail assets.

The repository README distinguishes the MIT-licensed code and exercise metadata from the demo-video provenance, which is described separately in its credits. The video files are therefore not treated as MIT-licensed assets and are not copied or referenced by this application until a separate commercial redistribution license for those media is confirmed. The one-time `sanitize-free-db.mjs` script removes media URL fields from a freshly downloaded upstream JSON snapshot before the catalog is generated.

## Regenerating the seed

The sanitized source snapshots are stored beside this file. To refresh the Free Exercise DB snapshot from upstream, download it to the folder, strip media URL fields, and remove the temporary raw file:


```powershell
$source = "TreinoAPI/SeedData/ExerciseCatalog"
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/harshvishu/free-exercise-db-with-videos/main/data/exercises.json" -OutFile "$source/free-exercise-db-with-videos.json"
node "$source/sanitize-free-db.mjs"
Remove-Item "$source/free-exercise-db-with-videos.json"
```

Then regenerate the catalog:

```powershell
node TreinoAPI/SeedData/ExerciseCatalog/prepare-catalog.mjs
```

This creates `exercise-catalog-seed.json`. The preparation script removes the Free Exercise DB video URLs from the generated records, merges only exact name/alias matches (plus the documented manual hip-adduction mapping), and leaves uncertain exercise variants separate rather than assigning a potentially incorrect demonstration.

## Runtime behavior

The API imports the seed idempotently on startup after the database schema exists. Uploaded videos are stored privately outside `wwwroot` under `EXERCISE_VIDEO_STORAGE_PATH` (default: `App_Data/exercicios-videos`). The PostgreSQL database stores metadata and file keys, not binary video contents.
