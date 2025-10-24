# Guide de Contribution

Merci de contribuer à SIGFP5 ! Ce projet est public. Merci de respecter ces règles pour garantir qualité, sécurité et cohérence.

## 1. Pré-requis
- Node 18+
- npm 9+
- Vite/React/TypeScript
- Supabase (variables d’environnement locales)

## 2. Démarrage local
```bash
npm install
npm run dev
```
- Créez un fichier `.env` (non commité) avec vos valeurs locales:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## 3. Branches et flux Git
- Base: `master` (protégée)
- Créez une branche par feature/fix: `feature/xxx` ou `fix/xxx`
- Commits clairs (conventional):
  - feat: nouvelle fonctionnalité
  - fix: correction de bug
  - chore: maintenance, build, deps
  - docs: documentation
  - refactor: refactoring sans changement de comportement

## 4. Qualité & Lint
- TypeScript strict
- ESLint/React Hooks
- Tailwind/PostCSS (CJS)
- Avant PR:
```bash
npm run lint
npm run build
npm test
```

## 5. Sécurité (critique)
- Ne JAMAIS commiter de secrets (clés Supabase, tokens, service_role)
- Utilisez `.env` local et variables d’environnement
- Vérifiez: `npm run scan-secrets`
- En cas d’exposition passée, régénérez la clé côté fournisseur et ouvrez un ticket

## 6. UI/UX
- Utiliser Tailwind (classes utilitaires)
- Respecter le design system existant (gradients, badges, cartes KPI)
- Accessibilité: labels/id, roles ARIA, contrastes

## 7. PR (Pull Request)
- Description claire: contexte, solution, captures si UI
- Checklist:
  - [ ] Lint OK, Build OK, Tests OK
  - [ ] Aucune donnée sensible
  - [ ] Respect conventions et types
- Demander au moins 1 review

## 8. Releases
- Tag sémantique (ex: v0.1.1)
- Changelog succinct

## 9. Contact
- Propriétaire: @bahatilegrand
- Ouvrez une Issue pour les discussions/bugs/améliorations
