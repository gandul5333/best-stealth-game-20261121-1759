// main.ts — the hand-in program for the Moonlight Heist entry (Node 22,
// standard library only). It copies this repository's game/ and
// screenshots/ into the output directory and writes /output/dossier.json
// with the vendored make.fun library, so the sealed scorer can read the
// game exactly as it was built. Outside the grader, MAKEFUN_OUTPUT_DIR
// stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// The entrypoint refuses to write an entry the scorer would refuse: too
// many files in game/, a game/ over the size cap, an index.html over its
// cap, or a screenshots/ folder outside 3..4 images of 256 KiB each.
// The dossier itself is byte-identical across runs: buildDossier is
// deterministic over the same tree.

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const GAME_MAX_FILES = 993;
const GAME_MAX_BYTES = 48 * 1024 * 1024;
const INDEX_HTML_MAX_BYTES = 1024 * 1024;
const SHOT_MAX_COUNT = 4;
const SHOT_MIN_COUNT = 3;
const SHOT_MAX_BYTES = 256 * 1024;

function countTree(dir) {
  let files = 0;
  let bytes = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      const sub = countTree(full);
      files += sub.files;
      bytes += sub.bytes;
    } else if (entry.isFile()) {
      files += 1;
      bytes += statSync(full).size;
    }
  }
  return { files, bytes };
}

function fail(message) {
  throw new Error(`main.ts: ${message}`);
}

// Refuse before writing anything the scorer would refuse.
const gameDir = join(repoRoot, 'game');
const gameTree = countTree(gameDir);
if (gameTree.files > GAME_MAX_FILES) {
  fail(`game/ holds ${gameTree.files} files, over the ${GAME_MAX_FILES} cap`);
}
if (gameTree.bytes > GAME_MAX_BYTES) {
  fail(`game/ is ${gameTree.bytes} bytes, over the ${GAME_MAX_BYTES} cap`);
}
const indexStat = statSync(join(gameDir, 'index.html'));
if (indexStat.size > INDEX_HTML_MAX_BYTES) {
  fail(`game/index.html is ${indexStat.size} bytes, over the ${INDEX_HTML_MAX_BYTES} cap`);
}
const shotsDir = join(repoRoot, 'screenshots');
const shots = existsSync(shotsDir)
  ? readdirSync(shotsDir).filter((name) => !name.startsWith('.'))
  : [];
if (shots.length < SHOT_MIN_COUNT || shots.length > SHOT_MAX_COUNT) {
  fail(`screenshots/ holds ${shots.length} images, need ${SHOT_MIN_COUNT}..${SHOT_MAX_COUNT}`);
}
for (const shot of shots) {
  const size = statSync(join(shotsDir, shot)).size;
  if (size > SHOT_MAX_BYTES) fail(`screenshots/${shot} is ${size} bytes, over the ${SHOT_MAX_BYTES} cap`);
}

mkdirSync(outDir, { recursive: true });
cpSync(gameDir, join(outDir, 'game'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
cpSync(shotsDir, join(outDir, 'screenshots'), { recursive: true });

writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: SHOT_MAX_COUNT, max_bytes: SHOT_MAX_BYTES },
    game_max_files: GAME_MAX_FILES,
    game_max_bytes: GAME_MAX_BYTES,
    game_path_max_bytes: 1000,
  }),
);
