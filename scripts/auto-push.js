#!/usr/bin/env node
/*
 Simple auto-push watcher:
 - Watches for file changes in the repository (ignores node_modules and .git)
 - Stages changed files, commits with timestamp message, and pushes to the current branch's upstream

 WARNING: This will commit and push automatically. Use with caution. Do NOT run this on repositories with secrets or where manual review is required.
*/

import fs from 'fs';
import { exec } from 'child_process';
import path from 'path';
import readline from 'readline';

const repoRoot = process.cwd();
const ignored = ['node_modules', '.git'];
let debounce = null;

function run(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, { cwd: repoRoot }, (err, stdout, stderr) => {
      if (err) return reject({ err, stdout, stderr });
      resolve({ stdout, stderr });
    });
  });
}

async function commitAndPush() {
  try {
    // Check for .env tracked
    try {
      await run('git ls-files --error-unmatch .env');
      console.error('\nERROR: .env is tracked in git. Aborting autopush to avoid leaking secrets.');
      process.exit(1);
    } catch (_) {
      // .env not tracked
    }

    await run('git add -A');
    const msg = `auto: update ${new Date().toISOString()}`;
    const { stdout: commitOut } = await run(`git commit -m "${msg}" || echo "NO_CHANGES"`);
    if (commitOut && commitOut.includes('NO_CHANGES')) {
      console.log('[auto-push] no changes to commit');
      return;
    }

    // Ask user for confirmation before pushing unless environment variable disables it
    const autoPushDisable = process.env.AUTO_PUSH_CONFIRM === 'false' || process.env.AUTO_PUSH_CONFIRM === '0';
    let shouldPush = true;
    if (!autoPushDisable) {
      shouldPush = await promptYesNo('Push changes to remote now? (y/N) ');
    }

    if (shouldPush) {
      await run('git push');
      console.log(`[auto-push] pushed at ${new Date().toLocaleString()}`);
    } else {
      console.log('[auto-push] push skipped by user');
    }
  } catch (e) {
    console.error('[auto-push] error:', e.stderr || e.err || e);
  }
}

function promptYesNo(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      const a = (answer || '').trim().toLowerCase();
      resolve(a === 'y' || a === 'yes');
    });
  });
}

function startWatch() {
  console.log('Starting auto-push watcher in', repoRoot);
  fs.watch(repoRoot, { recursive: true }, (eventType, filename) => {
    if (!filename) return;
    // ignore folders
    if (ignored.some(i => filename.includes(i))) return;
    if (debounce) clearTimeout(debounce);
    debounce = setTimeout(() => {
      commitAndPush();
    }, 1500);
  });
}

startWatch();
