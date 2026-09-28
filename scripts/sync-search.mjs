import {
  copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync,
} from 'node:fs';
import { dirname, join, normalize } from 'node:path';

const source = 'node_modules/@streamx-hub/search/dist';
const target = 'scripts/search';

// Entry points this project imports. Everything else is found by following imports.
const entries = [
  'streamx-search-inline.js', // header: createSearchInput
  'eds/search-results-panel.js', // blocks/search-results-panel
];

// Loaded at runtime via URL, not via import, so it is listed explicitly.
const assets = ['streamx-search.css'];

const importPattern = /(?:from|import)\s*\(?\s*["'](\.{1,2}\/[^"']+)["']/g;

function collect(file, found) {
  if (found.has(file)) return;

  found.add(file);

  const code = readFileSync(join(source, file), 'utf8');

  [...code.matchAll(importPattern)].forEach(([, spec]) => {
    collect(normalize(join(dirname(file), spec)), found);
  });
}

const files = new Set();

entries.forEach((entry) => collect(entry, files));
assets.forEach((asset) => files.add(asset));

// Chunk names are content-hashed, so start clean to avoid leaving old chunks behind.
rmSync(target, { recursive: true, force: true });

[...files].sort().forEach((file) => {
  mkdirSync(dirname(join(target, file)), { recursive: true });
  copyFileSync(join(source, file), join(target, file));

  console.log(`copied ${file}`);
});

// Placeholder files for the Search Config block in the nav. The header reads and removes
// the block, but EDS still requests a script and a stylesheet for it.
// Created only when missing, so edits to them are never overwritten.
const placeholders = {
  'blocks/search-config/search-config.js': `// Search Config is read and removed by blocks/header/header.js.
// This empty decorator only exists so EDS finds a file for the block.
export default function decorate() {}
`,
  'blocks/search-config/search-config.css': `/* Search Config renders nothing. This file only exists so EDS finds a stylesheet for the block. */
`,
};

Object.entries(placeholders).forEach(([file, content]) => {
  if (existsSync(file)) return;

  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);

  console.log(`created ${file}`);
});
