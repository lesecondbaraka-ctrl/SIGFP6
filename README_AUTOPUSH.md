README: Git hooks & auto-push notes

This repository includes a local pre-commit hook that runs a simple secret scanner to help prevent accidental commits of sensitive values (API keys, private keys, etc.).

To enable the hook for your local checkout, run:

  npm run setup-hooks

This will set git's core.hooksPath to the bundled `.githooks` directory. To undo it, run:

  git config --unset core.hooksPath

Notes:
- The hook only detects simple patterns and is not a replacement for good secret management (use environment variables, secret managers, GitHub Secrets, etc.).
- The repo provides `scripts/scan-secrets.js` which CI also runs. You can run it locally with `npm run scan-secrets`.
- The `autopush` script is an optional local tool that can auto-commit and push changes; by default it prompts before pushing. Use with caution.
 # Auto-push local watcher

This project includes an optional local watcher that will automatically commit and push local changes to the configured remote.

## How it works

- The script `scripts/auto-push.js` watches the repository for file changes.
- When a change is detected it runs `git add -A`, `git commit -m "auto: update <timestamp>"`, then `git push`.

## How to run

1. Install Node.js (version 18+ recommended).
2. From the project root run:

```powershell
npm run autopush
```

## Security warnings (read carefully)

- This will commit and push automatically. Do NOT run this on repositories that contain secrets or in a production branch where code review is required.
- Ensure `.env` and other secret files are listed in `.gitignore`.
- The script will abort if `.env` is tracked to avoid leaking secrets.

### Confirmation mode

By default the watcher will ask for confirmation before pushing. To disable the prompt and push automatically, set the environment variable `AUTO_PUSH_CONFIRM=false` or `AUTO_PUSH_CONFIRM=0` before running the script.

```powershell
# push automatically without prompt (use with caution)
$env:AUTO_PUSH_CONFIRM="false"
npm run autopush
```

## Recommendation

- Use this only for quick prototyping or experimental branches. For team collaboration prefer feature branches + pull requests.
