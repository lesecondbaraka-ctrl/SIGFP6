import { useState } from 'react';
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
  Eye,
  AlertTriangle,
  Globe,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  activeModule: string;
  onModuleChange: (module: string) => void;
  userRole: string;
}

const modules = [
  { id: 'dashboard', name: 'Tableau de Bord', icon: BarChart3, color: 'text-blue-600' },
  { id: 'budget', name: 'Gestion Budgétaire', icon: PieChart, color: 'text-green-600' },
  { id: 'depenses', name: 'Gestion des Dépenses', icon: CreditCard, color: 'text-red-600' },
  { id: 'recettes', name: 'Gestion des Recettes', icon: TrendingUp, color: 'text-yellow-600' },
  { id: 'tresorerie', name: 'Gestion de Trésorerie', icon: Vault, color: 'text-purple-600' },
  { id: 'controle', name: 'Contrôle Interne', icon: Shield, color: 'text-indigo-600' },
  { id: 'audit', name: 'Audit et Reporting', icon: FileText, color: 'text-orange-600' },
  { id: 'rh-enhanced', name: 'Ressources Humaines', icon: Users, color: 'text-pink-600' },
  { id: 'etats', name: 'États Financiers', icon: BarChart3, color: 'text-violet-600' },
  { id: 'archivage', name: 'Archivage et GED', icon: Archive, color: 'text-gray-600' },
  { id: 'validation', name: 'Validation Numérique', icon: CheckCircle, color: 'text-teal-600' },
  { id: 'conformite', name: 'Filtre de Conformité', icon: Filter, color: 'text-cyan-600' },
  { id: 'comptabilite', name: 'Comptabilité Générale', icon: BookOpen, color: 'text-emerald-700' },
];

// Modules spéciaux pour lutte contre la fraude
const igfModule = { id: 'igf', name: 'Accès IGF', icon: Eye, color: 'text-red-700' };
const fraudeModule = { id: 'fraude', name: 'Détection Fraude', icon: AlertTriangle, color: 'text-red-600' };
const transparenceModule = { id: 'transparence', name: 'Transparence Publique', icon: Globe, color: 'text-blue-500' };

export default function Sidebar({ activeModule, onModuleChange, userRole }: SidebarProps) {
  const { hasPermission } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Ajouter les modules anti-fraude pour tous les utilisateurs autorisés
  let allModules = [...modules];
  if (userRole === 'IGF' || userRole === 'Administrateur') {
    allModules = [...allModules, igfModule];
  }
  if (userRole === 'Administrateur' || userRole === 'Contrôleur' || userRole === 'IGF' || userRole === 'Auditeur') {
    allModules = [...allModules, fraudeModule];
  }
  // Module transparence accessible à tous
  allModules = [...allModules, transparenceModule];

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
      case 'rh-enhanced':
        return hasPermission('GESTION_RH') || userRole === 'Administrateur' || userRole === 'Responsable';
      case 'igf':
        return userRole === 'IGF' || userRole === 'Administrateur';
      default:
        return true; // Modules de base accessibles à tous
    }
  });

  return (
    <div className={`bg-gray-900 text-white min-h-screen transition-all duration-300 relative ${
      isCollapsed ? 'w-20' : 'w-64'
    }`}>
      {/* Bouton Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-1.5 shadow-lg transition-all z-10"
        title={isCollapsed ? 'Ouvrir le menu' : 'Fermer le menu'}
      >
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      <div className="p-6">
        <div className={`flex items-center mb-8 ${
          isCollapsed ? 'justify-center space-x-0' : 'space-x-2'
        }`}>
          <div className="w-3 h-6 bg-blue-500 rounded"></div>
          {!isCollapsed && (
            <>
              <div className="w-3 h-6 bg-yellow-400 rounded"></div>
              <div className="w-3 h-6 bg-red-500 rounded"></div>
              <span className="ml-2 font-semibold">RDC</span>
            </>
          )}
        </div>
        
        <nav className="space-y-2">
          {visibleModules.map((module) => {
            const Icon = module.icon;
            const isActive = activeModule === module.id;
            
            return (
              <button
                key={module.id}
                onClick={() => onModuleChange(module.id)}
                className={`w-full flex items-center px-3 py-3 rounded-lg transition-all duration-200 ${
                  isCollapsed ? 'justify-center' : 'space-x-3'
                } ${
                  isActive
                    ? 'bg-blue-700 text-white shadow-lg'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
                title={isCollapsed ? module.name : ''}
              >
                <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-white' : module.color}`} />
                {!isCollapsed && (
                  <span className="text-sm font-medium">{module.name}</span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}