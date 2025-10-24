import { useMemo, useState } from 'react';
import { Download, Filter, Calendar, Eye, Plus, FileText, TrendingUp } from 'lucide-react';
import { exportToExcel, generateFilename } from '../../utils/exportUtils';

interface ReportRow {
  id: string;
  category: 'Budget' | 'Dépenses' | 'Recettes' | 'Trésorerie' | 'RH' | 'Conformité';
  title: string;
  period: string;
  owner: string;
  status: 'Brouillon' | 'Publié' | 'Archivé';
}

export default function AuditReportingModule() {
  const [filterCategory, setFilterCategory] = useState<'Tous' | ReportRow['category']>('Tous');
  const [filterStatus, setFilterStatus] = useState<'Tous' | ReportRow['status']>('Tous');
  const [search, setSearch] = useState('');
  const [showNewReportModal, setShowNewReportModal] = useState(false);
  const [newReport, setNewReport] = useState({
    category: 'Budget' as ReportRow['category'],
    title: '',
    period: '',
    owner: ''
  });

  const reports: ReportRow[] = useMemo(() => ([
    { id: 'RPT-001', category: 'Budget', title: 'Exécution Budgétaire T1 2024', period: '2024-Q1', owner: 'Direction Budget', status: 'Publié' },
    { id: 'RPT-002', category: 'Dépenses', title: 'Top 50 Dépenses par Ministère', period: '2024-01..03', owner: 'IGF', status: 'Publié' },
    { id: 'RPT-003', category: 'Recettes', title: 'Recouvrement Fiscal T1 2024', period: '2024-Q1', owner: 'DGI', status: 'Brouillon' },
    { id: 'RPT-004', category: 'Trésorerie', title: 'Flux de Trésorerie Mensuel', period: '2024-03', owner: 'Trésor', status: 'Publié' },
    { id: 'RPT-005', category: 'RH', title: 'Masse Salariale Consolidée', period: '2024-02', owner: 'DRH', status: 'Publié' },
    { id: 'RPT-006', category: 'Conformité', title: 'Filtre de Conformité – Exceptions', period: '2024-03', owner: 'Inspection', status: 'Archivé' },
  ]), []);

  const visible = reports.filter(r => (
    (filterCategory === 'Tous' || r.category === filterCategory) &&
    (filterStatus === 'Tous' || r.status === filterStatus) &&
    (search.trim() === '' || `${r.title} ${r.period} ${r.owner}`.toLowerCase().includes(search.toLowerCase()))
  ));

  const handleExport = () => {
    const rows = visible.map(r => ({
      ID: r.id,
      Catégorie: r.category,
      Titre: r.title,
      Période: r.period,
      Propriétaire: r.owner,
      Statut: r.status,
    }));
    exportToExcel(rows, generateFilename('audit_reporting'));
  };

  const getStatusBadge = (status: ReportRow['status']) => {
    const cls: Record<ReportRow['status'], string> = {
      'Brouillon': 'bg-gray-100 text-gray-800',
      'Publié': 'bg-green-100 text-green-800',
      'Archivé': 'bg-yellow-100 text-yellow-800',
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${cls[status]}`}>{status}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Audit & Reporting</h2>
          <p className="text-gray-600">Rapports consolidés, audit trail et exports</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setShowNewReportModal(true)}
            className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-md flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Nouveau Rapport</span>
          </button>
          <button onClick={handleExport} className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors flex items-center space-x-2" title="Exporter les rapports visibles" aria-label="Exporter les rapports visibles">
            <Download className="h-4 w-4" />
            <span>Exporter</span>
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative">
            <input
              type="text"
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Rechercher un rapport..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Rechercher dans les rapports"
            />
            <Filter className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
          <div>
            <label htmlFor="audit-cat" className="block text-xs font-medium text-gray-600 mb-1">Catégorie</label>
            <select
              id="audit-cat"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as 'Tous' | ReportRow['category'])}
              aria-label="Sélectionner une option"
              title="Sélectionner une option"
            >
              <option value="Tous">Tous</option>
              <option>Budget</option>
              <option>Dépenses</option>
              <option>Recettes</option>
              <option>Trésorerie</option>
              <option>RH</option>
              <option>Conformité</option>
            </select>
          </div>
          <div>
            <label htmlFor="audit-status" className="block text-xs font-medium text-gray-600 mb-1">Statut</label>
            <select
              id="audit-status"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'Tous' | ReportRow['status'])}
              aria-label="Sélectionner une option"
              title="Sélectionner une option"
            >
              <option value="Tous">Tous</option>
              <option>Brouillon</option>
              <option>Publié</option>
              <option>Archivé</option>
            </select>
          </div>
          <div>
            <label htmlFor="audit-period" className="block text-xs font-medium text-gray-600 mb-1">Période (YYYY-MM)</label>
            <input
              id="audit-period"
              type="text"
              inputMode="numeric"
              placeholder="2024-03"
              pattern="^[0-9]{4}-(0[1-9]|1[0-2])$"
              title="Format attendu: YYYY-MM (ex: 2024-03)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              aria-describedby="audit-period-hint"
              defaultValue="2024-03"
            />
            <p id="audit-period-hint" className="mt-1 text-xs text-gray-500">Ex: 2024-03</p>
          </div>
        </div>
      </div>

      {/* Table des rapports */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Rapports consolidés</h3>
        </div>
        <div className="p-4 overflow-x-auto">
          <table className="w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Titre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Période</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Propriétaire</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {visible.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{r.id}</td>
                  <td className="px-4 py-3">{r.category}</td>
                  <td className="px-4 py-3">{r.title}</td>
                  <td className="px-4 py-3">{r.period}</td>
                  <td className="px-4 py-3">{r.owner}</td>
                  <td className="px-4 py-3">{getStatusBadge(r.status)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <button className="text-blue-600 hover:text-blue-800" title="Voir le rapport" aria-label="Voir le rapport">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-800" title="Exporter ce rapport" aria-label="Exporter ce rapport" onClick={() => exportToExcel([{ ID: r.id, Titre: r.title }], generateFilename(`report_${r.id}`))}>
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bandeau secondaire: audit trail (placeholder simple) */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
        <div className="flex items-center space-x-2 text-gray-700">
          <Calendar className="h-4 w-4" />
          <p className="text-sm">Audit trail: 12 événements récents (connexion, export, création de rapport...).</p>
        </div>
      </div>

      {/* Modal Nouveau Rapport */}
      {showNewReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 max-w-3xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Plus className="h-6 w-6 mr-2 text-green-600" />
              Générer un Nouveau Rapport
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Catégorie *
                  </label>
                  <select
                    value={newReport.category}
                    onChange={(e) => setNewReport({...newReport, category: e.target.value as ReportRow['category']})}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    aria-label="Catégorie du rapport"
                  >
                    <option value="Budget">Budget</option>
                    <option value="Dépenses">Dépenses</option>
                    <option value="Recettes">Recettes</option>
                    <option value="Trésorerie">Trésorerie</option>
                    <option value="RH">RH</option>
                    <option value="Conformité">Conformité</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Période *
                  </label>
                  <input
                    type="text"
                    value={newReport.period}
                    onChange={(e) => setNewReport({...newReport, period: e.target.value})}
                    placeholder="Ex: 2024-Q1 ou 2024-01"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre du rapport *
                </label>
                <input
                  type="text"
                  value={newReport.title}
                  onChange={(e) => setNewReport({...newReport, title: e.target.value})}
                  placeholder="Ex: Exécution Budgétaire T1 2024"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Propriétaire *
                </label>
                <input
                  type="text"
                  value={newReport.owner}
                  onChange={(e) => setNewReport({...newReport, owner: e.target.value})}
                  placeholder="Ex: Direction Budget, IGF..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="text-sm font-bold text-blue-900 mb-3 flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Templates de Rapports Disponibles
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {[
                    { name: 'Exécution Budgétaire', cat: 'Budget' },
                    { name: 'Top 50 Dépenses', cat: 'Dépenses' },
                    { name: 'Recouvrement Fiscal', cat: 'Recettes' },
                    { name: 'Flux de Trésorerie', cat: 'Trésorerie' },
                    { name: 'Masse Salariale', cat: 'RH' },
                    { name: 'Rapport de Conformité', cat: 'Conformité' }
                  ].map((template, idx) => (
                    <button
                      key={idx}
                      onClick={() => setNewReport({...newReport, title: template.name, category: template.cat as ReportRow['category']})}
                      className="text-left px-3 py-2 bg-white rounded border border-blue-200 hover:bg-blue-50 text-xs text-blue-800 transition-colors"
                    >
                      <TrendingUp className="h-3 w-3 inline mr-1" />
                      {template.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-xs text-green-800">
                  <strong>Note:</strong> Le rapport sera généré automatiquement avec les données de la période sélectionnée.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowNewReportModal(false);
                  setNewReport({ category: 'Budget', title: '', period: '', owner: '' });
                }}
                className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-all"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  console.log('Nouveau rapport:', newReport);
                  setShowNewReportModal(false);
                  setNewReport({ category: 'Budget', title: '', period: '', owner: '' });
                }}
                disabled={!newReport.title || !newReport.period || !newReport.owner}
                className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all shadow-md"
              >
                Générer le Rapport
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
