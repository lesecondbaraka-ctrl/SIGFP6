import { useState } from "react";

// Types pour la structure des rubriques
interface RubriqueBase {
  id: string;
  label: string;
  isSubtotal?: boolean;
}

type RubriqueLeaf = RubriqueBase & { children?: never };
type RubriqueGroup = RubriqueBase & { children: (RubriqueLeaf | RubriqueGroup)[] };
type Rubrique = RubriqueLeaf | RubriqueGroup;

const rubriquesGrouped = [
  {
    id: "1", label: "1. Personnel",
    children: [
      {
        id: "1a", label: "1.a) personnel rattaché à l'administration", children: [
          { id: "president_CA", label: " - président Conseil d'administration" },
          { id: "membre_CA", label: " - Membre Conseil d'Administration" },
          { id: "DG", label: " - DG" },
          { id: "DGA", label: " - DGA" },
          { id: "DAF", label: " - DAF" },
          { id: "DRH", label: " - DRH" },
          { id: "marketing", label: " - Charges de marketing" },
          { id: "direct_ser", label: " - Directeurs chefs des services" },
          { id: "chefs_div", label: " - Chefs des Divisions" },
          { id: "chefs_bur", label: " - Chefs des Bureaux" },
          { id: "chefs_serv", label: " - Chefs des Services" },
          { id: "gestion_bd", label: " - Gestionnaire de la base des donnees" },
          { id: "comptable", label: " - Comptable" },
          { id: "ingenieur", label: " - Ingenieurs" },
          { id: "agent_terrain", label: " - Agent de terrain" },
          { id: "secretaire", label: " - Secretaire" },
          { id: "tresorier", label: " - Tresorier" },
          { id: "magasinier", label: " - Magasinier" },
          { id: "fiscaliste", label: " - Fiscalistes" },
          { id: "coordonnateur", label: " - Coordonnateurs" },
          { id: "tresorier2", label: " - Tresorier" },
          { id: "ATB1", label: " - ATB1" },
          { id: "ATB2", label: " - ATB2" },
          { id: "huissier", label: " - Huissiers" },
          { id: "chauffeur", label: " - Chauffeurs" },
          { id: "pers_surface", label: " - Personnel de surface" },
          { id: "manoeuvre", label: " - Menoeuvres" },
          { id: "agent_securite", label: " - Agent de securite" },
          { id: "sousTotalAdm", label: "Sous Total personnel Adm", isSubtotal: true }
        ]
      },
      {
        id: "1b", label: "1.b) personnel rattaché à la technique", children: [
          { id: "respTech", label: " - Responsable Technique" },
          { id: "chargeProd", label: " - Chargé de production" },
          { id: "chargeVente", label: " - Chargé de vente" },
          { id: "machiniste", label: " - Machiniste" },
          { id: "sousTotalTech", label: "Sous Total personnel Techn.", isSubtotal: true }
        ]
      },
      { id: "TOTAL_PERSONNEL", label: "TOTAL PERSONNEL 1", isSubtotal: true }
    ]
  },
  {
    id: "2", label: "2. Avantages sociaux", children: [
      { id: "avantagesSociaux", label: " - Avantages sociaux" },
      { id: "sousTotalAvantagesSociaux", label: "Sous Total Avantages sociaux", isSubtotal: true },
      { id: "TOTAL_REMUNERATION", label: "TOTAL REMUNERATION DU PERSONNEL", isSubtotal: true }
    ]
  },
  {
    id: "3", label: "3. Consultance", children: [
      { id: "coutConsultance", label: " - coût de la Consultance" },
      { id: "sousTotalConsultance", label: "Sout Total Consultance", isSubtotal: true }
    ]
  },
  {
    id: "4", label: "4. Voyage et Transport", children: [
      { id: "voyageEtranger", label: " - Voyage/ mission a l'étranger" },
      { id: "voyageInterieur", label: " - Voyage/ mission a l'intérieur du pays (vulgarisation)" },
      { id: "descenteTerrain", label: " - Frais de descente de terrain/supervision" },
      { id: "sousTotalVoyageTransport", label: "Sous Total Voyage et Transport", isSubtotal: true }
    ]
  },
  {
    id: "5", label: "5. Equipement Administratifs", children: [
      { id: "materielsTransport", label: " - Materiels de transport" },
      { id: "ecranPlasma", label: " - Ecran plasma 75p" },
      { id: "LCD", label: " - LCD(retroprojecteur)" },
      { id: "laptop", label: " - Laptop" },
      { id: "desktop", label: " - Desktop" },
      { id: "imprimente", label: " - Imprimentes lazer" },
      { id: "groupeElectro", label: " - Achat groupe electrogene" },
      { id: "scanners", label: " - Scanners" },
      { id: "climatiseurs", label: " - Climatiseurs" },
      { id: "autresMateriels", label: " - Autres materiels" },
      { id: "sousTotalEquipements", label: "Sous Total equipements", isSubtotal: true }
    ]
  },
  {
    id: "6", label: "6. Mobiliers de bureau", children: [
      { id: "tableBureau", label: " - Table de bureau" },
      { id: "chaiseBureau", label: " - Chaises de bureau" },
      { id: "chaiseVisiteur", label: " - Chaises visiteurs" },
      { id: "chaiseSalleReu", label: " - Chaises salle de reunion" },
      { id: "tableSalleReu", label: " - Table salle de reunion" },
      { id: "armoiresMeta", label: " - Armoires metalique" },
      { id: "salonCadre", label: " - Salon: PCA, DG, DGA, Coordonateur et Coordonateur Adjoint" },
      { id: "sousTotalMeublesBureau", label: "Sous Total meubles de bureau", isSubtotal: true }
    ]
  },
  {
    id: "7", label: "7. Formation", children: [
      { id: "coutFormation", label: " - Cout des Formations" },
      { id: "sousTotalFormations", label: "Sous Total Formations", isSubtotal: true }
    ]
  },
  {
    id: "8", label: "8. Cout d'activité", children: [
      { id: "activite1", label: " - Activite 1" },
      { id: "activite2", label: " - Activite 2" },
      { id: "activite3", label: " - Activite 3" },
      { id: "activite4", label: " - Activite 4" },
      { id: "activite5", label: " - Activite 5" },
      { id: "activite6", label: " - Activite 6" },
      { id: "activite7", label: " - Activite 7" },
      { id: "sousTotalActivites", label: "Sous Total Activites", isSubtotal: true }
    ]
  },
  {
    id: "9", label: "9. Ateliers", children: [
      { id: "coutAtelier", label: " - Cout/Atelier" },
      { id: "sousTotalReunionService", label: "Sous Total Reunion de service", isSubtotal: true }
    ]
  },
  {
    id: "10", label: "10. Frais de fonctionnement", children: [
      { id: "carteCommCadreHC", label: " - Carte de communication pour les cadres hors categorie" },
      { id: "carteCommCadreCat", label: " - Cartes de Communication pour les cadres de categorie" },
      { id: "internet", label: " - Connexion Internet" },
      { id: "garantLocative", label: " - Garantie locative" },
      { id: "loyerMensuel", label: " - Loyer mensuel" },
      { id: "fraisBancaires", label: " - Frais bancaires" },
      { id: "cartoucheImprim", label: " - Cartouche imprimente" },
      { id: "cartonPapier", label: " - Cartons papiers duplicateur" },
      { id: "fourniture", label: " - Fournitures de bureau" },
      { id: "nettoyage", label: " - Produits et materiels de nettoyage et d'entretien" },
      { id: "carburant", label: " - Achat cartourburant vehicule et groupe electrogene" },
      { id: "publicite", label: " - Sensibilisation et Publicite du projet" },
      { id: "auditAnnuel", label: " - Audit annuel" },
      { id: "amortEquip", label: " - Amortissement equipement" },
      { id: "creationWeb", label: " - Creation SITE WEB" },
      { id: "hebergementWeb", label: " - Ebergement SITE WEB" },
      { id: "sousTotalCoutOperationel", label: "Sous Total Cout operationel", isSubtotal: true }
    ]
  },
  {
    id: "11", label: "11. Total :", children: [
      { id: "fraisGestionProjet", label: " - Frais de gestion du projet" },
      { id: "fraisAdmin", label: " - Frais Administratifs" },
      { id: "totalGeneral", label: "TOTAL GENERAL", isSubtotal: true }
    ]
  },
  {
    id: "recettes", label: "Recettes", children: [
      {
        id: "recettesProduitsVendus", label: "Produits vendus", children: [
          { id: "ventesMarchandise", label: " - Ventes de marchandises" },
          { id: "produitsServices", label: " - Produits et services" },
          { id: "autresRecettes", label: " - Autres recettes" },
          { id: "sousTotalRecettesProduitsVendus", label: "Sous total Produits vendus", isSubtotal: true }
        ]
      },
      {
        id: "recettesFinancieres", label: "Recettes financières", children: [
          { id: "interets", label: " - Intérêts bancaires" },
          { id: "dividendes", label: " - Dividendes" },
          { id: "autresProduitsFinanciers", label: " - Autres produits financiers" },
          { id: "sousTotalRecettesFinancieres", label: "Sous total Recettes financières", isSubtotal: true }
        ]
      },
      {
        id: "autresRecettes", label: "Autres recettes", children: [
          { id: "subventions", label: " - Subventions" },
          { id: "participations", label: " - Participations" },
          { id: "autresProduits", label: " - Autres produits" },
          { id: "sousTotalAutresRecettes", label: "Sous total Autres recettes", isSubtotal: true }
        ]
      },
      { id: "totalRecettesGenerales", label: "Total recettes générales", isSubtotal: true }
    ]
  }
];

const months = [
  "Janv. 2025", "Fev. 2025", "Mars 2025", "Avr. 2025", "Mai 2025",
  "Juin 2025", "Juil. 2025", "Aout 2025", "Sept. 2025",
  "Oct. 2025", "Nov. 2025", "Dec. 2025"
];

const trimestres = [
  { label: "T1", months: ["Janv. 2025", "Fev. 2025", "Mars 2025"] },
  { label: "T2", months: ["Avr. 2025", "Mai 2025", "Juin 2025"] },
  { label: "T3", months: ["Juil. 2025", "Aout 2025", "Sept. 2025"] },
  { label: "T4", months: ["Oct. 2025", "Nov. 2025", "Dec. 2025"] }
];

type BudgetData = {
  reference: number;
  totalBudget: number;
  months: Record<string, number>;
};

function calcTrimestreTotal(monthsData: Record<string, number>, trimestreMonths: string[]) {
  return trimestreMonths.reduce((sum, m) => sum + (monthsData[m] || 0), 0);
}

function calcAnnuelTotal(monthsData: Record<string, number>) {
  return Object.values(monthsData).reduce((sum, val) => sum + val, 0);
}

function RenderRubriqueGroup({
  rubrique,
  budgetData,
  handleMonthChange,
  filtrePeriode,
  months,
  sublevel = 0,
}: {
  rubrique: Rubrique;
  budgetData: Record<string, BudgetData>;
  handleMonthChange: (id: string, month: string, value: number) => void;
  filtrePeriode: "Annuelle" | "Trimestrielle" | "Mensuelle";
  months: string[];
  sublevel?: number;
}) {
  const [expanded, setExpanded] = useState(true);
  const isLeaf = !('children' in rubrique) || !rubrique.children;

  if (isLeaf) {
    return (
      <tr className={rubrique.isSubtotal ? "font-bold bg-gray-50" : undefined}>
        <td
          className="border p-1 sticky left-0 bg-white"
          style={{ paddingLeft: `${sublevel * 18 + 6}px`, minWidth: 240 }}
        >
          {rubrique.label}
        </td>
        <td className="border p-1 text-right">{budgetData[rubrique.id]?.reference.toFixed(2)}</td>
        <td className="border p-1 text-right">{budgetData[rubrique.id]?.totalBudget.toFixed(2)}</td>
        {filtrePeriode === "Mensuelle" &&
          months.map((m) => (
            <td className="border p-1 text-right" key={m}>
              <input
                type="number"
                value={budgetData[rubrique.id]?.months[m]}
                min={0}
                step={0.01}
                onChange={(e) => handleMonthChange(rubrique.id, m, parseFloat(e.target.value) || 0)}
                className="w-full bg-transparent text-right outline-none"
              />
            </td>
          ))}
        {filtrePeriode === "Trimestrielle" &&
          trimestres.map(({ label, months: triMonths }) => {
            const val = calcTrimestreTotal(budgetData[rubrique.id]?.months || {}, triMonths);
            return (
              <td className="border p-1 text-right" key={label}>
                {val.toFixed(2)}
              </td>
            );
          })}
        {filtrePeriode === "Annuelle" && (
          <td className="border p-1 text-right">
            {calcAnnuelTotal(budgetData[rubrique.id]?.months || {}).toFixed(2)}
          </td>
        )}
      </tr>
    );
  }
  return (
    <>
      <tr
        className="font-bold cursor-pointer bg-gray-200"
        onClick={() => setExpanded(v => !v)}
      >
        <td
          className="border p-1 sticky left-0 bg-white"
          style={{ paddingLeft: `${sublevel * 18 + 6}px`, minWidth: 240 }}
          colSpan={
            filtrePeriode === "Mensuelle"
              ? months.length + 3
              : filtrePeriode === "Trimestrielle"
              ? trimestres.length + 3
              : 1 + 3
          }
        >
          {expanded ? "▼ " : "▶ "} {rubrique.label}
        </td>
      </tr>
      {expanded && rubrique.children!.map(child => (
        <RenderRubriqueGroup
          key={child.id}
          rubrique={child as Rubrique}
          budgetData={budgetData}
          handleMonthChange={handleMonthChange}
          filtrePeriode={filtrePeriode}
          months={months}
          sublevel={sublevel + 1}
        />
      ))}
    </>
  );
}

export default function PageBudgetDepensePeriode() {
  const [budgetData, setBudgetData] = useState<Record<string, BudgetData>>(() => {
    const initial: Record<string, BudgetData> = {};
    rubriquesGrouped.forEach(r => {
      const addRecursively = (rub: any) => {
        initial[rub.id] = {
          reference: 0,
          totalBudget: 0,
          months: months.reduce((acc, m) => ({ ...acc, [m]: 0 }), {}),
        };
        if (rub.children) {
          rub.children.forEach(addRecursively);
        }
      };
      addRecursively(r);
    });
    return initial;
  });

  const [filtrePeriode, setFiltrePeriode] = useState<"Annuelle" | "Trimestrielle" | "Mensuelle">("Mensuelle");
  const [periodValue, setPeriodValue] = useState("EX 2025 (Janv. 2025 - Déc. 2025)");
  const [referenceSource, setReferenceSource] = useState("et réels 2025 (CDA)");
  const [compareChecked, setCompareChecked] = useState(true);

  const handleMonthChange = (id: string, month: string, value: number) => {
    setBudgetData(prev => {
      const newMonths = { ...prev[id].months, [month]: value };
      const totalBudget = Object.values(newMonths).reduce((a, b) => a + b, 0);
      return {
        ...prev,
        [id]: { ...prev[id], months: newMonths, totalBudget },
      };
    });
  };

  return (
    <div className="max-w-full rounded shadow p-4 text-sm text-gray-800 bg-white">
      <h2 className="text-lg font-semibold mb-4">Budget des Dépenses par Période</h2>
      {/* Barre outils */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
        <div>
          <div className="font-semibold text-lg mb-2">Filtre Période & Référence</div>
          <div className="flex items-center gap-3">
            <div>
              <label className="font-medium text-sm mr-2">Période :</label>
              <select
                value={periodValue}
                onChange={(e) => setPeriodValue(e.target.value)}
                className="border px-2 py-1 rounded focus:ring"
                style={{ minWidth: 250 }}
              >
                <option value="EX 2025 (Janv. 2025 - Déc. 2025)">
                  EX 2025 (Janv. 2025 - Déc. 2025)
                </option>
              </select>
            </div>
            <div>
              <label className="font-medium text-sm mr-2">Données de référence :</label>
              <select
                value={referenceSource}
                onChange={(e) => setReferenceSource(e.target.value)}
                className="border px-2 py-1 rounded focus:ring"
              >
                <option>et réels 2025 (CDA)</option>
                <option>et Budget 2025 (prévisionnel)</option>
              </select>
            </div>
            <label className="flex items-center gap-2 ml-3">
              <input
                type="checkbox"
                checked={compareChecked}
                onChange={() => setCompareChecked(v => !v)}
                className="accent-green-600"
              />
              Comparer les données de référence
            </label>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={`px-4 py-2 rounded border font-medium text-sm ${
              filtrePeriode === "Annuelle"
                ? "bg-green-600 text-white"
                : "bg-white text-gray-700"
            }`}
            onClick={() => setFiltrePeriode("Annuelle")}
          >
            Annuelle
          </button>
          <button
            type="button"
            className={`px-4 py-2 rounded border font-medium text-sm ${
              filtrePeriode === "Trimestrielle"
                ? "bg-green-600 text-white"
                : "bg-white text-gray-700"
            }`}
            onClick={() => setFiltrePeriode("Trimestrielle")}
          >
            Trimestrielle
          </button>
          <button
            type="button"
            className={`px-4 py-2 rounded border font-medium text-sm ${
              filtrePeriode === "Mensuelle"
                ? "bg-green-600 text-white"
                : "bg-white text-gray-700"
            }`}
            onClick={() => setFiltrePeriode("Mensuelle")}
          >
            Tous les mois
          </button>
        </div>
      </div>

      <div className="mb-4">
        <label className="font-medium text-sm mr-2">Référence préremplie :</label>
        <input
          type="text"
          value={referenceSource}
          className="border px-2 py-1 rounded min-w-[200px] bg-gray-100"
          readOnly
        />
      </div>

      <div className="overflow-x-auto overflow-y-auto max-h-[550px] relative border rounded">
        <table className="min-w-[1100px] w-full border-collapse border border-gray-300">
          <thead className="bg-gray-100 sticky top-0 z-10">
            <tr>
              <th
                className="border p-1 text-left min-w-[240px] sticky left-0 bg-gray-100 z-20"
              >
                Comptes / Rubriques
              </th>
              <th className="border p-1 text-right min-w-[80px]">Données de référence</th>
              <th className="border p-1 text-right min-w-[80px]">Totaux du budget</th>
              {filtrePeriode === "Mensuelle" &&
                months.map((m) => (
                  <th key={m} className="border p-1 text-right min-w-[70px]">{m}</th>
                ))}
              {filtrePeriode === "Trimestrielle" &&
                trimestres.map(({ label }) => (
                  <th key={label} className="border p-1 text-right min-w-[70px]">{label}</th>
                ))}
              {filtrePeriode === "Annuelle" && (
                <th className="border p-1 text-right min-w-[70px]">Année</th>
              )}
            </tr>
          </thead>
          <tbody>
            {rubriquesGrouped.map((r) => (
              <RenderRubriqueGroup
                key={r.id}
                rubrique={r}
                budgetData={budgetData}
                handleMonthChange={handleMonthChange}
                filtrePeriode={filtrePeriode}
                months={months}
              />
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end mt-4">
        <button
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          type="button"
          onClick={() => alert("Enregistrement effectué !")}
        >
          Enregistrer
        </button>
      </div>
    </div>
  );
}
