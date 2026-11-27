import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const freeDb = JSON.parse(fs.readFileSync(path.join(root, "free-exercise-db-metadata.json"), "utf8"));
const workout = JSON.parse(fs.readFileSync(path.join(root, "workout-free-videos.json"), "utf8"));
const workoutBase = "https://cdn.jsdelivr.net/gh/namnq/workout-free-videos@v2.0.0/";

const portugueseAliases = {
  "dumbbell-bench-press": ["supino com halteres", "supino reto com halteres"],
  "incline-bench-press": ["supino inclinado com barra"],
  "exercise-ball-dumbbell-bench-press": ["supino com halteres na bola", "supino na bola suíça"],
  "chest-dip": ["mergulho nas paralelas", "paralelas para peito"],
  "military-press": ["desenvolvimento militar", "desenvolvimento com barra"],
  "dumbbell-lateral-raise": ["elevação lateral", "elevação lateral com halteres"],
  "bent-over-low-pulley-rear-delt-fly": ["crucifixo inverso na polia", "voador inverso na polia"],
  "close-grip-bench-press": ["supino fechado"],
  "ez-bar-skullcrusher": ["tríceps testa", "tríceps testa com barra ez"],
  "weighted-tricep-dips": ["mergulho com peso", "paralelas com carga"],
  "standing-barbell-curl": ["rosca direta", "rosca direta com barra"],
  "incline-dumbbell-curl": ["rosca inclinada com halteres"],
  "dumbbell-hammer-preacher-curl": ["rosca martelo no banco scott"],
  "seated-barbell-wrist-curl": ["flexão de punho sentado", "rosca de punho"],
  "reverse-grip-barbell-curl": ["rosca inversa", "rosca inversa com barra ez"],
  "plate-pinch-carry": ["caminhada segurando anilhas", "pinça de anilhas"],
  "barbell-shrug": ["encolhimento de ombros com barra", "encolhimento com barra"],
  "dumbbell-shrug": ["encolhimento de ombros com halteres", "encolhimento com halteres"],
  "barbell-upright-row": ["remada alta com barra", "remada alta"],
  "seated-cable-row": ["remada baixa", "remada baixa na polia"],
  "machine-t-bar-row": ["remada cavalinho", "remada t com apoio no peito"],
  "bent-over-row": ["remada curvada", "remada curvada com barra"],
  "lat-pull-down": ["puxada frontal", "puxada frente", "puxada alta na polia"],
  "wide-grip-pull-up": ["barra fixa pegada aberta", "barra fixa aberta"],
  "straight-arm-lat-pull-down": ["pullover na polia", "puxada com braços estendidos"],
  "superman": ["superman lombar", "extensão lombar superman"],
  "sit-up": ["abdominal supra", "abdominal tradicional"],
  "lying-floor-leg-raise": ["elevação de pernas deitado", "elevação de pernas no solo"],
  "weighted-crunch": ["abdominal com anilha", "abdominal com peso"],
  "tall-kneeling-cable-lift": ["woodchopper ajoelhado", "rotação de tronco ajoelhado na polia"],
  "tall-kneeling-cable-chop": ["corte na polia ajoelhado", "chop ajoelhado na polia"],
  "split-stance-cable-lift": ["rotação de tronco na polia", "woodchopper na polia"],
  "barbell-hip-thrust": ["elevação pélvica com barra", "hip thrust com barra"],
  "hyperextension": ["extensão lombar 45 graus", "hiperextensão"],
  "good-mornings": ["good morning com barra", "bom dia com barra"],
  "barbell-back-squat": ["agachamento livre", "agachamento com barra"],
  "leg-press": ["leg press 45", "leg press 45 graus"],
  "machine-hack-squat": ["agachamento hack", "hack machine"],
  "exercise-ball-wall-squat": ["agachamento na parede com bola", "agachamento com bola suíça"],
  "stiff-leg-deadlift": ["stiff", "levantamento terra stiff"],
  "seated-leg-curl": ["mesa flexora sentada", "flexora sentada"],
  "exercise-ball-leg-curl": ["flexão de joelhos com bola suíça", "mesa flexora com bola"],
  "nordic-hamstring-curl": ["nordic curl", "flexão nórdica de posteriores"],
  "standing-machine-calf-raise": ["panturrilha em pé na máquina", "elevação de panturrilha em pé"],
  "seated-calf-raise": ["panturrilha sentado", "elevação de panturrilha sentado"],
  "45-degree-leg-press-calf-raise": ["panturrilha no leg press", "elevação de panturrilha no leg press"],
  "hip-adduction-machine": ["cadeira adutora", "adução de quadril na máquina"],
  "alternating-lateral-lunge-with-overhead-reach": ["avanço lateral alternado", "afundo lateral"],
  "deep-squat-prying": ["agachamento profundo com mobilidade", "mobilidade de quadril em agachamento"],
  "cable-hip-abduction": ["abdução de quadril na polia", "abdução de quadril no cabo"],
  "cradle-walk": ["mobilidade de quadril cradle walk"],
  "fire-hydrant-circles": ["fire hydrant", "abdução de quadril em quatro apoios"],
  "kneeling-posterior-hip-capsule-mobilization": ["mobilização da cápsula posterior do quadril"],
  "it-band-foam-rolling": ["liberação do trato iliotibial", "rolamento do trato iliotibial"],
  "plantar-fascia-lacrosse-ball": ["liberação da fáscia plantar", "massagem da fáscia plantar"],
  "palmar-fascia-lacrosse-ball": ["liberação da fáscia palmar", "massagem da palma da mão"],
  "neck-tiger-tail": ["liberação cervical com rolo", "massagem cervical com rolo"],
};

const matchOverrides = {
  "hip-adduction-machine": "0598",
};

function normalize(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " e ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function unique(values) {
  const found = new Map();
  for (const value of values ?? []) {
    const clean = String(value ?? "").trim();
    const key = normalize(clean);
    if (clean && key && !found.has(key)) found.set(key, clean);
  }
  return [...found.values()];
}

function tokens(value) {
  return new Set(normalize(value).split(" ").filter((part) => part.length > 1));
}

function similarity(left, right) {
  const a = tokens(left);
  const b = tokens(right);
  if (!a.size || !b.size) return 0;
  const overlap = [...a].filter((token) => b.has(token)).length;
  return overlap / new Set([...a, ...b]).size;
}

const byCanonical = new Map();
for (const item of freeDb) {
  const key = normalize(item.name);
  if (!key) continue;
  const current = byCanonical.get(key);
  if (current) {
    current.aliases = unique([...current.aliases, ...(item.aliases ?? []), item.name]);
    continue;
  }
  byCanonical.set(key, {
    externalId: String(item.id ?? ""),
    name: item.name,
    aliases: unique([...(item.aliases ?? []), item.name]),
    muscleGroup: item.target || item.bodyPart || null,
    secondaryMuscles: item.secondaryMuscles ?? [],
    equipment: item.equipment ? [item.equipment] : [],
    difficulty: item.difficulty ?? null,
    description: item.shortDescription ?? null,
    instructions: item.instructions ?? null,
    steps: item.steps ?? [],
    formCues: item.formCues ?? [],
    commonMistakes: item.commonMistakes ?? [],
    breathing: item.breathing ?? null,
    dataSource: "Free Exercise DB with Videos",
    dataLicense: "MIT",
    videoUrl: null,
    videoTitle: null,
    videoSource: null,
    videoLicense: null,
    videoAttribution: null,
    durationSeconds: null,
    thumbnailUrl: null,
  });
}

const exercises = [...byCanonical.values()];
const aliasIndex = new Map();
for (const item of exercises) {
  for (const alias of [item.name, ...item.aliases]) {
    const key = normalize(alias);
    if (!aliasIndex.has(key)) aliasIndex.set(key, item);
  }
}

const unmatched = [];
const approximate = [];
for (const item of workout) {
  const candidates = unique([item.name, item.slug.replace(/-/g, " ")]);
  let match = null;
  for (const candidate of candidates) {
    match = aliasIndex.get(normalize(candidate)) ?? null;
    if (match) break;
  }
  if (!match && matchOverrides[item.slug]) {
    match = exercises.find((exercise) => exercise.externalId === matchOverrides[item.slug]) ?? null;
  }

  if (!match) {
    const ranked = exercises
      .map((exercise) => ({
        exercise,
        score: Math.max(
          similarity(item.name, exercise.name),
          ...exercise.aliases.map((alias) => similarity(item.name, alias)),
        ),
      }))
      .sort((a, b) => b.score - a.score);
    if (ranked[0]?.score >= 0.86) approximate.push({
      slug: item.slug,
      workoutName: item.name,
      candidate: ranked[0].exercise.name,
      score: Number(ranked[0].score.toFixed(3)),
    });
    unmatched.push(item.slug);
  }

  const target = match ?? {
    externalId: item.id,
    name: item.name,
    aliases: [item.name],
    muscleGroup: item.primaryMuscle,
    secondaryMuscles: item.secondaryMuscles ?? [],
    equipment: item.equipment ?? [],
    difficulty: item.level ?? null,
    description: null,
    instructions: null,
    steps: [],
    formCues: item.cues ?? [],
    commonMistakes: [],
    breathing: null,
    dataSource: "Workout Free Videos",
    dataLicense: "CC0-1.0",
    videoUrl: null,
    videoTitle: null,
    videoSource: null,
    videoLicense: null,
    videoAttribution: null,
    durationSeconds: null,
    thumbnailUrl: null,
  };

  target.aliases = unique([...(target.aliases ?? []), item.name, ...(portugueseAliases[item.slug] ?? [])]);
  target.videoUrl = workoutBase + item.video.path;
  target.videoTitle = item.name;
  target.videoSource = "Workout Free Videos";
  target.videoLicense = "CC0-1.0";
  target.videoAttribution = null;
  target.durationSeconds = item.video.durationSec ?? null;
  target.thumbnailUrl = null;
  if (match) {
    target.dataSource = "Free Exercise DB with Videos + Workout Free Videos";
    target.dataLicense = "MIT";
  } else {
    exercises.push(target);
    aliasIndex.set(normalize(target.name), target);
  }
}

const output = {
  version: 1,
  generatedAt: new Date().toISOString(),
  sources: [
    {
      name: "Free Exercise DB with Videos",
      repository: "https://github.com/harshvishu/free-exercise-db-with-videos",
      license: "MIT",
      importedScope: "exercise metadata only; upstream demo videos and thumbnails are deliberately excluded because their media rights are described separately from the MIT metadata license",
    },
    {
      name: "Workout Free Videos",
      repository: "https://github.com/namnq/workout-free-videos",
      version: "v2.0.0",
      license: "CC0-1.0",
      importedScope: "exercise metadata and video URLs pinned to the v2.0.0 public CDN release",
    },
  ],
  exercises: exercises.map((exercise) => ({
    ...exercise,
    sourceKey: exercise.dataSource.startsWith("Free Exercise DB with Videos")
      ? `free-exercise-db:${exercise.externalId}`
      : `workout-free-videos:${exercise.externalId}`,
  })),
};

fs.writeFileSync(path.join(root, "exercise-catalog-seed.json"), JSON.stringify(output, null, 2) + "\n", "utf8");
console.log(JSON.stringify({
  freeDbSourceRecords: freeDb.length,
  freeDbUniqueExercises: byCanonical.size,
  workoutVideoRecords: workout.length,
  mergedVideos: workout.length - unmatched.length,
  separateCc0Exercises: unmatched.length,
  totalCatalogRecords: exercises.length,
  approximateCandidates: approximate,
}, null, 2));
