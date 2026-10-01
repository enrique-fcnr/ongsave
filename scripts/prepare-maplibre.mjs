import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const source = dirname(require.resolve("maplibre-gl/dist/maplibre-gl-worker.mjs"));
const destination = new URL("../public/maplibre/", import.meta.url);
mkdirSync(destination, { recursive: true });
for (const file of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"])
  copyFileSync(join(source, file), new URL(file, destination));
