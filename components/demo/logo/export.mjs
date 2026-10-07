// Écrit les SVG de /demo/logo dans public/demo/logos/cadran-*.svg, avec les mêmes fonctions de dessin
// que la page (marques.js). À relancer après toute retouche d'un symbole :
//   node components/demo/logo/export.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { MARK_IDS, exportFiles } from './marques.js';

const out = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'public', 'demo', 'logos');
mkdirSync(out, { recursive: true });
let n = 0;
for (const id of MARK_IDS) {
  for (const file of exportFiles(id)) {
    writeFileSync(join(out, file.name), file.make());
    n += 1;
  }
}
console.log(`${n} fichiers écrits dans ${out}`);
