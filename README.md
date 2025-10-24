# SIGFP5 — Système Intégré de Gestion des Finances Publiques

Projet public (Vite + React + TypeScript + TailwindCSS) conforme aux référentiels IPSAS / SYSCOHADA pour la gestion budgétaire, trésorerie, comptabilité et contrôle.

## 🔗 Dépôt
- Web: https://github.com/bahatilegrand/SIGFP5
- Clone: `https://github.com/bahatilegrand/SIGFP5.git`

## 🚀 Démarrage rapide
```bash
npm install
npm run dev
```
- Variables d’environnement (créez un fichier `.env`, non commité):
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## 🧩 Principaux Modules
- Gestion Budgétaire (IPSAS 24)
- Gestion de Trésorerie (IPSAS 2)
- Comptabilité Générale (SYSCOHADA)
- Dépenses (4 phases OHADA)
- Recettes (constatation → liquidation → encaissement)
- Audit & Reporting

## 🎨 UI/Design
- TailwindCSS (PostCSS CJS)
- Accessibilité (labels/id, rôles ARIA)
- Composants modernes, gradients, badges, KPI cards

## 🔐 Sécurité
- Aucun secret dans le repo
- Scripts de test lisent les clés via variables d’environnement
- Vérification rapide: `npm run scan-secrets`

## 🤝 Contribution
- Lisez le guide: [CONTRIBUTING.md](./CONTRIBUTING.md)
- Convention de commit: `feat|fix|chore|docs|refactor`
- Ouvrir une branche par feature, PR avec revue

## 🛡️ Protection de branche
- Branche `master` protégée (PR + checks)
- Ajouter les collaborateurs: Settings → Collaborators

## 📄 Licence
Ce dépôt est public. Droits réservés au propriétaire. Contact: @bahatilegrand
