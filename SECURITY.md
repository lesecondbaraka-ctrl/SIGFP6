# Security and secrets handling

This document explains how to handle secrets (API keys, database URLs, tokens) for this repository and how to remediate if secrets were committed.

## Do not commit secrets

- Keep all secrets out of the repository. Use environment variables and store secrets in secure stores (GitHub Secrets for Actions, Azure Key Vault, AWS Secrets Manager, etc.).

- Add secret files to `.gitignore` (for example `.env`, `.env.local`).

## If secrets were accidentally committed

1. Rotate the exposed credentials immediately (invalidate keys/tokens where possible).

2. Remove secrets from the git history using one of these tools:

### Option A — BFG Repo-Cleaner (easier)

1. Backup your repository.

2. Install BFG: [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)

3. Remove a file or pattern (example to remove `.env` content stored in history):

```bash
# local clone
git clone --mirror git@github.com:OWNER/REPO.git
cd REPO.git
# remove files matching .env
java -jar bfg.jar --delete-files ".env"
# cleanup
git reflog expire --expire=now --all
git gc --prune=now --aggressive
# push cleaned repo (force push)
git push --force
```

### Option B — git-filter-repo (recommended)

1. Install git-filter-repo: [git-filter-repo](https://github.com/newren/git-filter-repo)

2. Example to remove a file from history:

```bash
git clone --mirror git@github.com:OWNER/REPO.git
cd REPO.git
git filter-repo --invert-paths --paths ".env"
# push cleaned repo
git push --force
```

> Note: force-pushing rewritten history will require all collaborators to reclone the repository.

## Prevent future leaks

- Add `.env` and other secret files to `.gitignore`.

- Use placeholders in samples: keep `.env.example` with placeholder values, not real secrets.

- Configure branch protections and require PR reviews.

- Enable GitHub secret scanning (if on GitHub Advanced Security) and enable Dependabot alerts.

- Store secrets in GitHub Secrets (Actions) or a secret manager and reference them via CI.

## Quick checklist

- [ ] Rotate any keys found.

- [ ] Remove secrets from repo history (BFG or git-filter-repo).

- [ ] Add secrets to `.gitignore`.

- [ ] Replace in-file secrets with env var placeholders.

- [ ] Configure GitHub Secrets and repository protections.

If you want, I can:

- Open/change the `.gitignore` to include standard secret files.

- Search and list likely exposed secrets in this repo (paths + snippets) for review.

- Prepare an automated script (BFG/git-filter-repo commands) to remove detected files from history.


Tell me which action you want me to run next.

