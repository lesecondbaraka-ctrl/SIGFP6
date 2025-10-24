import React from 'react';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Container responsive qui adapte son contenu selon la taille d'écran
 * Utilisé pour wrapper les modules principaux
 */
export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div className={`
      w-full 
      max-w-full 
      px-4 sm:px-6 lg:px-8
      mx-auto
      ${className}
    `}>
      {children}
    </div>
  );
};

/**
 * Wrapper pour les titres de page responsive
 */
export const ResponsivePageHeader: React.FC<{
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}> = ({ title, subtitle, actions }) => {
  return (
    <div className="mb-4 sm:mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm sm:text-base text-gray-600">
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Grid responsive automatique pour KPIs et cards
 */
export const ResponsiveGrid: React.FC<{
  children: React.ReactNode;
  cols?: 2 | 3 | 4 | 6;
  className?: string;
}> = ({ children, cols = 4, className = '' }) => {
  const colsClass = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    6: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6'
  };

  return (
    <div className={`grid ${colsClass[cols]} gap-3 sm:gap-4 ${className}`}>
      {children}
    </div>
  );
};

/**
 * Bouton responsive avec icône
 */
export const ResponsiveButton: React.FC<{
  children: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  className?: string;
  fullWidth?: boolean;
}> = ({ 
  children, 
  icon, 
  onClick, 
  variant = 'primary', 
  className = '',
  fullWidth = false 
}) => {
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white'
  };

  return (
    <button
      onClick={onClick}
      className={`
        ${variantClasses[variant]}
        px-3 sm:px-4 
        py-2 
        rounded-lg 
        font-medium
        text-sm sm:text-base
        flex items-center justify-center gap-2
        transition-colors
        ${fullWidth ? 'w-full' : 'w-full sm:w-auto'}
        ${className}
      `}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span className="truncate">{children}</span>
    </button>
  );
};

/**
 * Table wrapper responsive avec scroll horizontal
 */
export const ResponsiveTable: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <div className="inline-block min-w-full align-middle">
        <div className={`overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg ${className}`}>
          {children}
        </div>
      </div>
    </div>
  );
};

/**
 * Card responsive
 */
export const ResponsiveCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'small' | 'normal' | 'large';
}> = ({ children, className = '', padding = 'normal' }) => {
  const paddingClasses = {
    none: '',
    small: 'p-3 sm:p-4',
    normal: 'p-4 sm:p-6',
    large: 'p-6 sm:p-8'
  };

  return (
    <div className={`
      bg-white 
      rounded-lg sm:rounded-xl 
      shadow-sm 
      border border-gray-200
      ${paddingClasses[padding]}
      ${className}
    `}>
      {children}
    </div>
  );
};

/**
 * Modal responsive (full screen sur mobile)
 */
export const ResponsiveModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
}> = ({ isOpen, onClose, title, children, size = 'medium' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    small: 'sm:max-w-md',
    medium: 'sm:max-w-2xl',
    large: 'sm:max-w-4xl'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-0 sm:p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className={`
          relative 
          w-full 
          h-full sm:h-auto
          ${sizeClasses[size]}
          bg-white 
          sm:rounded-lg 
          shadow-xl
          transform transition-all
          flex flex-col
          max-h-screen sm:max-h-[90vh]
        `}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2"
            >
              <span className="text-2xl">×</span>
            </button>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResponsiveContainer;
