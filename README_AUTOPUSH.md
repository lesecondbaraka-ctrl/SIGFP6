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
