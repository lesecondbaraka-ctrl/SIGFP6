import { useState } from "react";

// Options pour le type de budget
const typeBudgetOptions = [
  { value: "compteDeResultat", label: "Compte de résultat" },
  // Ajouter d'autres types si besoin
];

// Options pour la période
const periods = [
  "EX 2025 (Janv. 2025 - Déc. 2025)",
  // Ajouter d'autres périodes si besoin
];

// Format (congrouplement/subdivisé)
const formatOptions = [
  { value: "congroupe", label: "Congroupement" },
  { value: "subdivise", label: "Subdivisé" },
];

// Prérémplir les données (facultatif)
const prefillOptions = [
  { value: "", label: "Sélectionner..." },
  { value: "prevBudget", label: "Budget précédent" },
  { value: "autre", label: "Autre source" },
  // Ajoute d'autres si besoin
];

// Fonction composant principal
export default function ConfigBudgetStart() {
  const [typeBudget, setTypeBudget] = useState(typeBudgetOptions[0].value);
  const [periode, setPeriode] = useState(periods[0]);
  const [formatBudget, setFormatBudget] = useState(formatOptions[0].value);
  const [prefillData, setPrefillData] = useState("");
  const [optionConfig, setOptionConfig] = useState("custom");

  // Navigation
  const onSuivant = () => {
    // à remplacer par navigation réelle ou props plus tard
    alert("Vous passez à l'étape suivante !");
  };
  const onAnnuler = () => {
    // Annulation/sortie, à adapter selon besoin
    alert("Configuration annulée.");
  };

  // Importation du budget (simulation)
  const onImportBudget = () => {
    alert("Fonction d'import à connecter.");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center pt-8 pb-3 px-2">
      {/* Titre */}
      <h2 className="text-2xl font-semibold text-center mb-6">
        Comment souhaitez-vous configurer votre budget ?
      </h2>
      <div className="w-full max-w-3xl bg-white shadow rounded p-7 flex flex-row justify-between">
        {/* Partie gauche : formulaire */}
        <div className="flex-1 pr-6">
          <form className="flex flex-col gap-5">
            {/* Type de budget */}
            <div>
              <div className="text-sm font-medium mb-1">Type de budget</div>
              <div className="flex items-center gap-4">
                {typeBudgetOptions.map(opt => (
                  <label key={opt.value} className="flex items-center">
                    <input
                      type="radio"
                      value={opt.value}
                      checked={typeBudget === opt.value}
                      onChange={() => setTypeBudget(opt.value)}
                      className="accent-green-600 mr-2"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
            {/* Periode */}
            <div>
              <div className="text-sm font-medium mb-1">Période</div>
              <select
                value={periode}
                onChange={e => setPeriode(e.target.value)}
                className="border px-2 py-1 rounded w-full bg-gray-50"
              >
                {periods.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            {/* Format du budget */}
            <div>
              <div className="text-sm font-medium mb-1">Format du budget</div>
              <div className="flex items-center gap-4">
                {formatOptions.map(opt => (
                  <label key={opt.value} className="flex items-center">
                    <input
                      type="radio"
                      value={opt.value}
                      checked={formatBudget === opt.value}
                      onChange={() => setFormatBudget(opt.value)}
                      className="accent-green-600 mr-2"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
            {/* Prérémplir les données */}
            <div>
              <div className="text-sm font-medium mb-1">Prérémplir les données</div>
              <select
                value={prefillData}
                onChange={e => setPrefillData(e.target.value)}
                className="border px-2 py-1 rounded w-full bg-gray-50"
              >
                {prefillOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            {/* Option configuration - budgets personnalisés */}
            <div>
              <div className="text-sm font-medium mb-2">Option de configuration disponible</div>
              <div className="flex flex-row items-center gap-3">
                <label
                  className={`border rounded p-4 cursor-pointer flex flex-col items-center transition
                  ${optionConfig === "custom"
                    ? "border-green-600 bg-green-50"
                    : "border-gray-300 bg-white"}`}
                  onClick={() => setOptionConfig("custom")}
                >
                  {/* Icones géométriques */}
                  <div className="mb-2">
                    <svg width={40} height={28} viewBox="0 0 40 28">
                      <circle cx={10} cy={10} r={7} fill="#47c285" />
                      <rect x={18} y={5} width={14} height={10} rx={3} fill="#c2e7da" />
                      <polygon points="34,23 38,11 26,11" fill="#47c285" />
                    </svg>
                  </div>
                  <div className="text-base font-medium">Budgets personnalisés</div>
                  <div className="text-xs text-gray-600 text-center">
                    Créez un budget à partir de zéro.
                  </div>
                </label>
              </div>
              <div className="mt-2 text-blue-700 underline text-sm cursor-pointer" onClick={onImportBudget}>
                Importer un budget <span title="Fonction à implémenter">•</span>
              </div>
            </div>
          </form>
        </div>
        {/* Partie droite : Illustration */}
        <div className="flex-shrink-0 flex flex-col justify-center items-center">
          {/* Illustration personne + argent */}
          <div className="flex justify-center items-center h-full">
            {/* SVG fidèle à la maquette, simplifié ici */}
            <svg width={170} height={170} viewBox="0 0 170 170">
              {/* Personnage */}
              <circle cx={85} cy={80} r={56} fill="#c2e7da" />
              <ellipse cx={85} cy={120} rx={20} ry={8} fill="#333" opacity={0.09} />
              <rect x={70} y={110} width={30} height={20} rx={10} fill="#47c285" />
              <rect x={78} y={90} width={14} height={30} rx={7} fill="#47c285" />
              <circle cx={85} cy={85} r={10} fill="#7ad097" />
              {/* Billets et enveloppes (stylisation... à personnaliser) */}
              <rect x={15} y={60} width={25} height={10} rx={3} fill="#d8f6ea" />
              <rect x={130} y={70} width={25} height={10} rx={3} fill="#d8f6ea" />
              <rect x={70} y={30} width={30} height={10} rx={3} fill="#d8f6ea" />
              {/* Petits effets (paillettes stylisées) */}
              <circle cx={60} cy={25} r={2} fill="#47c285" />
              <circle cx={110} cy={25} r={2} fill="#47c285" />
              <circle cx={145} cy={100} r={2} fill="#47c285" />
              <circle cx={35} cy={120} r={2} fill="#47c285" />
            </svg>
          </div>
        </div>
      </div>
      {/* Footer avec navigation */}
      <div className="flex flex-row justify-between items-center w-full max-w-3xl mt-6">
        <button
          type="button"
          className="bg-white hover:bg-gray-100 text-gray-800 border px-4 py-2 rounded"
          onClick={onAnnuler}
        >
          Annuler
        </button>
        <button
          type="button"
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold"
          onClick={onSuivant}
        >
          Suivant
        </button>
      </div>
    </div>
  );
}
