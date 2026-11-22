// Ember Duel — the hand-in program (Node 22, standard library only).
//
// The game lives in this directory's game/ folder: plain static files a
// desktop browser loads offline (game/index.html plus its ES modules and
// stylesheet, no library, no network request). This program copies game/
// and screenshots/ from beside this file to /output and writes
// /output/dossier.json, the summary the judge reads, with the vendored
// make.fun library. It refuses to hand in anything the sealed scorer
// would refuse on size: more than 4 screenshots or one over 256 KiB,
// more than 993 files in game/ or 48 MiB of game files in all, or a
// path under game/ over 1000 bytes.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for
// /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const MAX_SHOTS = 4;
const MAX_SHOT_BYTES = 262144;
const MAX_GAME_FILES = 993;
const MAX_GAME_BYTES = 50331648;
const MAX_PATH_BYTES = 1000;

function countGameFiles(dir, base) {
  let files = 0;
  let bytes = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    const rel = path.slice(base.length + 1);
    if (Buffer.byteLength(rel, 'utf8') > MAX_PATH_BYTES) {
      throw new Error(`game path over ${MAX_PATH_BYTES} bytes: ${rel}`);
    }
    if (entry.isDirectory()) {
      const sub = countGameFiles(path, base);
      files += sub.files;
      bytes += sub.bytes;
    } else if (entry.isFile()) {
      files += 1;
      bytes += statSync(path).size;
    }
  }
  return { files, bytes };
}

const gameDir = join(here, 'game');
const gameTotals = countGameFiles(gameDir, gameDir);
if (gameTotals.files > MAX_GAME_FILES) throw new Error(`game/ has ${gameTotals.files} files, over ${MAX_GAME_FILES}`);
if (gameTotals.bytes > MAX_GAME_BYTES) throw new Error(`game/ is ${gameTotals.bytes} bytes, over ${MAX_GAME_BYTES}`);

const shotsDir = join(here, 'screenshots');
const shots = existsSync(shotsDir)
  ? readdirSync(shotsDir).filter((name) => !name.startsWith('.')).sort()
  : [];
if (shots.length < 3 || shots.length > MAX_SHOTS) {
  throw new Error(`screenshots/ has ${shots.length} images, need 3 or 4`);
}
for (const name of shots) {
  const size = statSync(join(shotsDir, name)).size;
  if (size > MAX_SHOT_BYTES) throw new Error(`screenshot ${name} is ${size} bytes, over ${MAX_SHOT_BYTES}`);
}

mkdirSync(out, { recursive: true });
cpSync(gameDir, join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
cpSync(shotsDir, join(out, 'screenshots'), { recursive: true });

writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: MAX_SHOTS, max_bytes: MAX_SHOT_BYTES },
    game_max_files: MAX_GAME_FILES,
    game_max_bytes: MAX_GAME_BYTES,
    game_path_max_bytes: MAX_PATH_BYTES,
  }),
);

console.log(`Ember Duel handed in: ${gameTotals.files} game files, ${shots.length} screenshots, dossier written.`);
