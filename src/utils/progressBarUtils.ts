/**
 * Utilitaires pour les barres de progression
 * Génère des classes CSS au lieu de styles inline
 */

/**
 * Convertit un pourcentage en classe CSS de largeur
 * @param percentage - Pourcentage (0-100)
 * @returns Classe CSS correspondante
 */
export function getProgressWidthClass(percentage: number): string {
  const rounded = Math.round(Math.min(Math.max(percentage, 0), 100));
  
  // Classes par pas de 5% pour les valeurs principales
  if (rounded % 5 === 0) {
    return `progress-bar-dynamic`;
  }
  
  // Classes spécifiques pour les autres valeurs
  return `w-${rounded}p`;
}

/**
 * Génère les attributs data pour une barre de progression
 * @param percentage - Pourcentage (0-100)
 * @returns Objet avec data-width arrondi au multiple de 5 le plus proche
 */
export function getProgressDataAttrs(percentage: number): { 'data-width': string } {
  const rounded = Math.round(Math.min(Math.max(percentage, 0), 100));
  const nearestFive = Math.round(rounded / 5) * 5;
  return { 'data-width': nearestFive.toString() };
}

/**
 * Génère une classe CSS complète pour une barre de progression
 * @param percentage - Pourcentage (0-100)
 * @param baseClasses - Classes CSS de base
 * @returns Classe CSS complète
 */
export function getProgressBarClasses(percentage: number, baseClasses: string = ''): string {
  const widthClass = getProgressWidthClass(percentage);
  return `${baseClasses} ${widthClass}`.trim();
}
