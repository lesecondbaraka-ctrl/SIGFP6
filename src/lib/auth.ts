import { supabase } from './supabase';

export interface User {
  id_utilisateur: string;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  id_entite: string;
  adresse?: string;
  telephone?: string;
  entityName: string;
}

export interface Permission {
  id_permission: string;
  nom_permission: string;
  description?: string;
}

export interface UserRole {
  id_role: string;
  nom_role: string;
  description?: string;
}

export interface AuthState {
  user: User | null;
  permissions: Permission[];
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Fonction pour se connecter
export async function signIn(email: string, password: string) {
  try {
    // Vérifier les identifiants dans la table utilisateurs
    const { data: userData, error: userError } = await supabase
      .from('utilisateurs')
      .select('*')
      .eq('email', email)
      .eq('mot_de_passe', password) // En production, utiliser un hash
      .single();

    if (userError || !userData) {
      throw new Error('Identifiants invalides');
    }

    // Récupérer le nom de l'entité séparément
    let entityName = 'Entité inconnue';
    if (userData.id_entite) {
      const { data: entiteData } = await supabase
        .from('entites')
        .select('nom_entite')
        .eq('id_entite', userData.id_entite)
        .single();
      
      if (entiteData) {
        entityName = entiteData.nom_entite;
      }
    }

    // Récupérer les permissions de l'utilisateur
    const permissions = await getUserPermissions(userData.role);

    // Enregistrer l'action dans les logs
    await logUserAction(userData.id_utilisateur, 'Connexion');

    // Créer l'objet utilisateur
    const authenticatedUser: User = {
      ...userData,
      entityName: entityName
    };

    return {
      user: authenticatedUser,
      permissions,
      success: true
    };
  } catch (error) {
    console.error('Erreur de connexion:', error);
    throw error;
  }
}

// Fonction pour récupérer les permissions d'un rôle
export async function getUserPermissions(roleName: string): Promise<Permission[]> {
  try {
    // Récupérer d'abord l'ID du rôle
    const { data: roleData, error: roleError } = await supabase
      .from('utilisateurs_roles')
      .select('id_role')
      .eq('nom_role', roleName)
      .single();

    if (roleError || !roleData) {
      console.warn(`Rôle ${roleName} non trouvé`);
      return [];
    }

    // Récupérer les permissions du rôle
    const { data, error } = await supabase
      .from('role_permissions')
      .select(`
        permissions!inner(
          id_permission,
          nom_permission,
          description
        )
      `)
      .eq('id_role', roleData.id_role);

    if (error) throw error;

    const permissions: Permission[] = [];
    data?.forEach((item: any) => {
      if (item.permissions) {
        permissions.push(item.permissions);
      }
    });

    return permissions;
  } catch (error) {
    console.error('Erreur récupération permissions:', error);
    return [];
  }
}

// Fonction pour enregistrer les actions utilisateur
export async function logUserAction(userId: string, action: string) {
  try {
    await supabase
      .from('logs')
      .insert([{
        id_utilisateur: userId,
        action: action,
        date_action: new Date().toISOString()
      }]);
  } catch (error) {
    console.error('Erreur enregistrement log:', error);
  }
}

// Fonction pour vérifier si l'utilisateur a une permission
export function hasPermission(permissions: Permission[], permissionName: string): boolean {
  return permissions.some(p => p.nom_permission === permissionName);
}

// Fonction pour se déconnecter
export async function signOut(userId: string) {
  try {
    await logUserAction(userId, 'Déconnexion');
    return { success: true };
  } catch (error) {
    console.error('Erreur déconnexion:', error);
    throw error;
  }
}

// Fonction pour créer une notification
export async function createNotification(userId: string, message: string) {
  try {
    await supabase
      .from('notifications')
      .insert([{
        id_utilisateur: userId,
        message: message,
        date_notification: new Date().toISOString(),
        lu: false
      }]);
  } catch (error) {
    console.error('Erreur création notification:', error);
  }
}

// Fonction pour récupérer les notifications d'un utilisateur
export async function getUserNotifications(userId: string) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('id_utilisateur', userId)
      .order('date_notification', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erreur récupération notifications:', error);
    return [];
  }
}

// Fonction pour marquer une notification comme lue
export async function markNotificationAsRead(notificationId: string) {
  try {
    await supabase
      .from('notifications')
      .update({ lu: true })
      .eq('id_notification', notificationId);
  } catch (error) {
    console.error('Erreur marquage notification:', error);
  }
}