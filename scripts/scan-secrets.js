#!/usr/bin/env node
// Very small secret scanner. It searches for common secret-like patterns and fails if found.
import fs from 'fs';
import path from 'path';

const repoRoot = process.cwd();
const patterns = [
  /VITE_SUPABASE_ANON_KEY/i,
  /VITE_SUPABASE_URL/i,
  /API_KEY/i,
  /SECRET/i,
  /PRIVATE_KEY/i,
  /ACCESS_TOKEN/i
];

function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.name === 'node_modules' || e.name === '.git') continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      scanDir(full);
    } else {
      try {
        const content = fs.readFileSync(full, 'utf8');
        for (const p of patterns) {
          if (p.test(content)) {
            console.error(`Potential secret match in ${full} -> ${p}`);
            process.exitCode = 2;
          }
        }
      } catch (_) {}
    }
  }
}

scanDir(repoRoot);
if (process.exitCode === 2) {
  console.error('Secret scan failed. Please remove secrets before committing/pushing.');
  process.exit(2);
}
console.log('Secret scan OK.');
