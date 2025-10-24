#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const root = path.join(__dirname, '..', 'src');
const BAD = 'onChange((e) = aria-label="Sélectionner une option" title="Sélectionner une option"> ';
const BAD2 = 'onChange((e) = aria-label="Sélectionner une option" title="Sélectionner une option">';
const BAD3 = 'onChange((e) = aria-label="Sélectionner une option" title="Sélectionner une option">\u00A0';
const REPLACEMENT = 'onChange={(e) => ';

let filesFixed = 0;
let replacements = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (entry.isFile() && full.endsWith('.tsx')) {
      let content = fs.readFileSync(full, 'utf8');
      const before = content;
      // Replace all bad patterns variants
      content = content.split(BAD).join(REPLACEMENT);
      content = content.split(BAD2).join(REPLACEMENT);
      content = content.split(BAD3).join(REPLACEMENT);
      if (content !== before) {
        fs.writeFileSync(full, content);
        filesFixed++;
        const count = (before.match(new RegExp(BAD.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length
          + (before.match(new RegExp(BAD2.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length
          + (before.match(new RegExp(BAD3.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
        replacements += count;
        console.log(`✅ Fixed onChange in: ${path.relative(root, full)} (${count} replacement(s))`);
      }
    }
  }
}

walk(root);
console.log(`\n✔ Done. Files fixed: ${filesFixed}, total replacements: ${replacements}`);
