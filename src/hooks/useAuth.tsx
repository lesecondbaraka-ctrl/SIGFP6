/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, AuthState, signIn, signOut, getUserPermissions, getUserNotifications } from '../lib/auth';

// Contexte d'authentification
const AuthContext = createContext<{
  authState: AuthState;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  notifications: any[];
  refreshNotifications: () => void;
} | null>(null);

// Provider d'authentification
export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    permissions: [],
    isAuthenticated: false,
    isLoading: true
  });
  const [notifications, setNotifications] = useState<any[]>([]);

  // Vérifier l'authentification au chargement
  useEffect(() => {
    console.debug('AuthProvider: initializing, checking saved user');
    let savedUser: string | null = null;
    try {
      savedUser = localStorage.getItem('sigfp_user');
    } catch (err) {
      console.warn('AuthProvider: localStorage not available', err);
    }
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        loadUserData(user);
      } catch (error) {
        console.error('Erreur chargement utilisateur sauvegardé:', error);
        localStorage.removeItem('sigfp_user');
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Charger les données utilisateur
  const loadUserData = async (user: User) => {
    try {
      const permissions = await getUserPermissions(user.role);
      
      // Récupérer les notifications si la fonction existe
      let userNotifications: any[] = [];
      try {
        userNotifications = await getUserNotifications(user.id_utilisateur);
      } catch (error) {
        console.warn('Impossible de charger les notifications:', error);
      }
      
      setAuthState({
        user,
        permissions,
        isAuthenticated: true,
        isLoading: false
      });
      setNotifications(userNotifications);
    } catch (error) {
      console.error('Erreur chargement données utilisateur:', error);
      localStorage.removeItem('sigfp_user');
      setAuthState({
        user: null,
        permissions: [],
        isAuthenticated: false,
        isLoading: false
      });
    }
  };

  // Fonction de connexion
  const login = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      const result = await signIn(email, password);
      
      if (result.success) {
        localStorage.setItem('sigfp_user', JSON.stringify(result.user));
        await loadUserData(result.user);
      }
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  // Fonction de déconnexion
  const logout = async () => {
    try {
      if (authState.user) {
        try {
          await signOut(authState.user.id_utilisateur);
        } catch (error) {
          console.warn('Erreur lors de la déconnexion:', error);
        }
      }
      localStorage.removeItem('sigfp_user');
      setAuthState({
        user: null,
        permissions: [],
        isAuthenticated: false,
        isLoading: false
      });
      setNotifications([]);
    } catch (error) {
      console.error('Erreur déconnexion:', error);
    }
  };

  // Vérifier les permissions
  const hasPermission = (permission: string): boolean => {
    // L'administrateur a toutes les permissions
    if (authState.user?.role === 'Administrateur') {
      return true;
    }
    return authState.permissions.some(p => p.nom_permission === permission);
  };

  // Rafraîchir les notifications
  const refreshNotifications = async () => {
    if (authState.user) {
      try {
        const userNotifications = await getUserNotifications(authState.user.id_utilisateur);
        setNotifications(userNotifications);
      } catch (error) {
        console.warn('Impossible de rafraîchir les notifications:', error);
      }
    }
  };

  const contextValue = {
    authState,
    login,
    logout,
    hasPermission,
    notifications,
    refreshNotifications
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook pour utiliser l'authentification
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
}