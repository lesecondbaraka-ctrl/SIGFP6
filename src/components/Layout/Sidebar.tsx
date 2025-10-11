import React from 'react';
import { 
  useAuth
} from '../../hooks/useAuth';
import { 
  PieChart, 
  CreditCard, 
  TrendingUp, 
  Vault, 
  Shield, 
  FileText, 
  Users, 
  Archive, 
  CheckCircle, 
  Filter,
  BookOpen,
  BarChart3,
  Eye
} from 'lucide-react';

interface SidebarProps {
  activeModule: string;
  onModuleChange: (module: string) => void;
  userRole: string;
}

const modules = [
  { id: 'dashboard', name: 'Tableau de Bord', icon: BarChart3, color: 'text-blue-600' },
  { id: 'budget', name: 'Budget', icon: PieChart, color: 'text-green-600' },
  { id: 'depenses', name: 'Dépenses', icon: CreditCard, color: 'text-red-600' },
  { id: 'recettes', name: 'Recettes', icon: TrendingUp, color: 'text-yellow-600' },
  { id: 'tresorerie', name: 'Trésorerie', icon: Vault, color: 'text-purple-600' },
  { id: 'controle', name: 'Contrôle Interne', icon: Shield, color: 'text-indigo-600' },
  { id: 'audit', name: 'Audit & Reporting', icon: FileText, color: 'text-orange-600' },
  { id: 'rh', name: 'Ressources Humaines', icon: Users, color: 'text-pink-600' },
  { id: 'archivage', name: 'Archivage Électronique', icon: Archive, color: 'text-gray-600' },
  { id: 'validation', name: 'Validation Dématérialisée', icon: CheckCircle, color: 'text-teal-600' },
  { id: 'conformite', name: 'Filtre de Conformité', icon: Filter, color: 'text-cyan-600' },
  { id: 'journal', name: 'Journal de Compte', icon: BookOpen, color: 'text-emerald-600' },
  { id: 'etats', name: 'États Financiers', icon: BarChart3, color: 'text-violet-600' },
];

// Module IGF uniquement visible pour le role IGF
const igfModule = { id: 'igf', name: 'Accès IGF', icon: Eye, color: 'text-red-700' };

export default function Sidebar({ activeModule, onModuleChange, userRole }: SidebarProps) {
  const { hasPermission } = useAuth();

  const allModules = userRole === 'IGF' ? [...modules, igfModule] : modules;

  // Filtrer les modules selon les permissions
  const visibleModules = allModules.filter(module => {
    switch (module.id) {
      case 'budget':
        return hasPermission('GESTION_BUDGET') || userRole === 'Administrateur' || userRole === 'Responsable' || userRole === 'Contrôleur';
      case 'depenses':
        return hasPermission('GESTION_DEPENSES') || userRole === 'Administrateur' || userRole === 'Responsable' || userRole === 'Comptable' || userRole === 'Contrôleur';
      case 'recettes':
        return hasPermission('GESTION_RECETTES') || userRole === 'Administrateur' || userRole === 'Responsable' || userRole === 'Comptable';
      case 'tresorerie':
        return hasPermission('GESTION_TRESORERIE') || userRole === 'Administrateur' || userRole === 'Responsable' || userRole === 'Comptable';
      case 'controle':
        return hasPermission('CONTROLE_INTERNE') || userRole === 'Contrôleur' || userRole === 'Administrateur';
      case 'audit':
        return hasPermission('AUDIT_REPORTING') || userRole === 'Auditeur' || userRole === 'Administrateur';
      case 'rh':
        return hasPermission('GESTION_RH') || userRole === 'Administrateur' || userRole === 'Responsable';
      case 'igf':
        return userRole === 'IGF' || userRole === 'Administrateur';
      default:
        return true; // Modules de base accessibles à tous
    }
  });

  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen">
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-8">
          <div className="w-3 h-6 bg-blue-500 rounded"></div>
          <div className="w-3 h-6 bg-yellow-400 rounded"></div>
          <div className="w-3 h-6 bg-red-500 rounded"></div>
          <span className="ml-2 font-semibold">RDC</span>
        </div>
        
        <nav className="space-y-2">
          {visibleModules.map((module) => {
            const Icon = module.icon;
            const isActive = activeModule === module.id;
            
            return (
              <button
                key={module.id}
                onClick={() => onModuleChange(module.id)}
                className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-700 text-white shadow-lg'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-white' : module.color}`} />
                <span className="text-sm font-medium">{module.name}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}