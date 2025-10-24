# 📋 Formulaires SIGFP - Architecture Modulaire

## 🎯 Objectif

Centraliser tous les formulaires dans un dossier dédié pour améliorer la maintenabilité, la réutilisabilité et la cohérence du code.

## 📁 Structure

```
Forms/
├── Budget/
│   ├── NouvelleLigneBudgetaireForm.tsx ✅
│   ├── VirementBudgetaireForm.tsx (à créer)
│   ├── RevisionBudgetaireForm.tsx (à créer)
│   └── EngagementBudgetaireForm.tsx (à créer)
├── Recettes/
│   ├── ConstatationRecetteForm.tsx ✅
│   ├── LiquidationRecetteForm.tsx (à créer)
│   ├── EncaissementForm.tsx (à créer)
│   └── TitreRecetteForm.tsx (à créer)
├── Depenses/
│   ├── EngagementDepenseForm.tsx ✅
│   ├── LiquidationDepenseForm.tsx (à créer)
│   ├── OrdonnancementForm.tsx (à créer)
│   ├── PaiementForm.tsx (à créer)
│   └── BonCommandeForm.tsx (à créer)
├── Tresorerie/
│   ├── FluxTresorerieForm.tsx (à créer)
│   ├── PrevisionMensuelleForm.tsx (à créer)
│   └── RapprochementBancaireForm.tsx (à créer)
├── Control/
│   └── NouveauControleForm.tsx (à créer)
├── Validation/
│   ├── ValidationForm.tsx (à créer)
│   ├── RejetForm.tsx (à créer)
│   └── RevisionForm.tsx (à créer)
├── Conformite/
│   └── NouvelleRegleForm.tsx (à créer)
├── Audit/
│   └── NouveauRapportForm.tsx (à créer)
├── index.ts ✅
└── README.md ✅
```

## ✅ Formulaires Créés (3/26)

1. **NouvelleLigneBudgetaireForm** - Budget
2. **ConstatationRecetteForm** - Recettes (Phase 1 OHADA)
3. **EngagementDepenseForm** - Dépenses (Phase 1 OHADA)

## 🔧 Pattern de Formulaire

Chaque formulaire suit ce pattern standardisé :

```typescript
import React from 'react';
import { Icon, X } from 'lucide-react';

interface FormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => void;
  initialData?: Partial<FormData>;
}

export interface FormData {
  // Définir les champs du formulaire
}

export default function MyForm({
  isOpen,
  onClose,
  onSubmit,
  initialData = {}
}: FormProps) {
  const [formData, setFormData] = React.useState<FormData>({
    // Valeurs par défaut
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({ /* reset */ });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-8 max-w-2xl w-full shadow-2xl">
        {/* Header avec icône et bouton fermer */}
        {/* Formulaire */}
        {/* Boutons Annuler/Soumettre */}
      </div>
    </div>
  );
}
```

## 📝 Caractéristiques Communes

### ✅ Accessibilité
- `aria-label` sur tous les selects
- `title` sur le bouton fermer
- Labels visibles pour tous les champs
- Validation HTML5 (`required`, `min`, `max`)

### ✅ UX
- Modal responsive (max-w-2xl)
- Scroll automatique si contenu long
- Fermeture sur Annuler ou X
- Reset du formulaire après soumission
- Transitions fluides

### ✅ Design
- Gradients modernes
- Bordures colorées selon le contexte
- Icônes Lucide React
- Messages d'aide (normes IPSAS/OHADA/SYSCOHADA)

## 🔄 Migration depuis les Modules

### Avant (dans le module)
```typescript
// État dans le module
const [showModal, setShowModal] = useState(false);
const [formData, setFormData] = useState({...});

// Modal inline dans le JSX (100+ lignes)
{showModal && (
  <div className="fixed...">
    {/* Tout le code du formulaire */}
  </div>
)}
```

### Après (avec composant Form)
```typescript
// Import du formulaire
import { NouvelleLigneBudgetaireForm } from '../Forms';

// État simplifié
const [showModal, setShowModal] = useState(false);

// Handler
const handleSubmit = (data: LigneBudgetaireData) => {
  console.log('Données:', data);
  // Appel API ici
};

// Utilisation propre
<NouvelleLigneBudgetaireForm
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  onSubmit={handleSubmit}
/>
```

## 📊 Avantages

1. **Maintenabilité** ⬆️
   - Code centralisé
   - Modifications faciles
   - Tests unitaires simplifiés

2. **Réutilisabilité** ⬆️
   - Même formulaire dans plusieurs modules
   - Props configurables
   - Logique isolée

3. **Lisibilité** ⬆️
   - Modules plus courts
   - Séparation des responsabilités
   - Code plus propre

4. **Performance** ⬆️
   - Lazy loading possible
   - Bundle splitting
   - Optimisation ciblée

## 🚀 Prochaines Étapes

### Phase 1 - Recettes (Priorité Haute)
- [ ] LiquidationRecetteForm (Phase 2 OHADA)
- [ ] EncaissementForm (Phase 3 OHADA)
- [ ] TitreRecetteForm

### Phase 2 - Dépenses (Priorité Haute)
- [ ] LiquidationDepenseForm (Phase 2 OHADA)
- [ ] OrdonnancementForm (Phase 3 OHADA)
- [ ] PaiementForm (Phase 4 OHADA)
- [ ] BonCommandeForm

### Phase 3 - Budget
- [ ] VirementBudgetaireForm
- [ ] RevisionBudgetaireForm
- [ ] EngagementBudgetaireForm

### Phase 4 - Trésorerie
- [ ] FluxTresorerieForm (IPSAS 2)
- [ ] PrevisionMensuelleForm (IPSAS 24)
- [ ] RapprochementBancaireForm (SYSCOHADA)

### Phase 5 - Autres Modules
- [ ] Control, Validation, Conformité, Audit

## 📖 Exemple Complet

Voir `NouvelleLigneBudgetaireForm.tsx` pour un exemple complet avec :
- TypeScript strict
- Validation des champs
- Gestion d'état local
- Accessibilité WCAG
- Design moderne

## 🔗 Intégration

1. Créer le formulaire dans le bon dossier
2. Exporter depuis `index.ts`
3. Importer dans le module
4. Remplacer le code inline par le composant
5. Tester la fonctionnalité

## ⚠️ Notes

- Les warnings lint sur les boutons submit sont normaux (ils ont du texte visible)
- Garder la cohérence des couleurs par module (Budget=vert, Recettes=bleu, Dépenses=multi, Trésorerie=bleu)
- Respecter les normes (IPSAS, OHADA, SYSCOHADA) dans les messages d'aide
