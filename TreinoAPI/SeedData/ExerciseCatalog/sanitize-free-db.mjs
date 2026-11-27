import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const sourcePath = path.join(root, "free-exercise-db-with-videos.json");
const outputPath = path.join(root, "free-exercise-db-metadata.json");
const source = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const metadata = source.map(({ videos, thumbnails, ...exercise }) => exercise);
fs.writeFileSync(outputPath, JSON.stringify(metadata, null, 2) + "\n", "utf8");
console.log(`Wrote ${metadata.length} metadata records; removed video and thumbnail URL fields.`);
