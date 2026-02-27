import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { nestjsApi, User, LoginRequest } from '@/integrations/nestjs/client';

export type AppRole = 'admin' | 'collaborateur' | 'compta';

interface AuthContextType {
  user: User | null;
  roles: AppRole[];
  loading: boolean;
  signIn: (credentials: LoginRequest) => Promise<{ error: string | null; requiresPasswordReset?: boolean }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isAuthenticated: boolean;
  refreshProfile: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ error: string | null; message?: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<{ error: string | null; message?: string }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ error: string | null; message?: string }>;
}

const NestJSAuthContext = createContext<AuthContextType | undefined>(undefined);

export function NestJSAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Fonction pour récupérer le profil utilisateur
  const refreshProfile = async () => {
    if (!nestjsApi.isAuthenticated()) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const response = await nestjsApi.getProfile();
      if (response.data) {
        setUser(response.data);
      } else {
        // Token invalide, déconnecter
        await signOut();
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      await signOut();
    } finally {
      setLoading(false);
    }
  };

  // Vérifier l'authentification au démarrage
  useEffect(() => {
    const initAuth = async () => {
      if (nestjsApi.isAuthenticated()) {
        // Valider le token
        const response = await nestjsApi.validateToken();
        if (response.data?.valid) {
          await refreshProfile();
        } else {
          await signOut();
        }
      } else {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const signIn = async (credentials: LoginRequest) => {
    try {
      setLoading(true);
      const response = await nestjsApi.login(credentials);

      if (response.error) {
        return { error: response.error };
      }

      if (response.data) {
        // Convert login response user to full User object
        const userWithDates: User = {
          ...response.data.user,
          createdAt: new Date().toISOString(), // Placeholder, will be updated when profile is fetched
          updatedAt: new Date().toISOString(), // Placeholder, will be updated when profile is fetched
        };
        setUser(userWithDates);
        return {
          error: null,
          requiresPasswordReset: response.data.requiresPasswordReset
        };
      }

      return { error: 'Réponse inattendue du serveur' };
    } catch (error) {
      console.error('Login error:', error);
      return { error: 'Erreur de connexion' };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await nestjsApi.logout();
    setUser(null);
  };

  const requestPasswordReset = async (email: string) => {
    try {
      const response = await nestjsApi.requestPasswordReset(email);
      if (response.error) {
        return { error: response.error };
      }
      return { error: null, message: response.data?.message };
    } catch (error) {
      console.error('Password reset request error:', error);
      return { error: 'Erreur lors de la demande de réinitialisation' };
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    try {
      const response = await nestjsApi.resetPassword(token, newPassword);
      if (response.error) {
        return { error: response.error };
      }
      return { error: null, message: response.data?.message };
    } catch (error) {
      console.error('Password reset error:', error);
      return { error: 'Erreur lors de la réinitialisation du mot de passe' };
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      const response = await nestjsApi.changePassword(currentPassword, newPassword);
      if (response.error) {
        return { error: response.error };
      }
      return { error: null, message: response.data?.message };
    } catch (error) {
      console.error('Change password error:', error);
      return { error: 'Erreur lors du changement de mot de passe' };
    }
  };

  const roles: AppRole[] = user?.roles?.filter((role): role is AppRole =>
    ['admin', 'collaborateur', 'compta'].includes(role)
  ) || [];

  const value = {
    user,
    roles,
    loading,
    signIn,
    signOut,
    isAdmin: roles.includes('admin'),
    isAuthenticated: !!user,
    refreshProfile,
    requestPasswordReset,
    resetPassword,
    changePassword,
  };

  return (
    <NestJSAuthContext.Provider value={value}>
      {children}
    </NestJSAuthContext.Provider>
  );
}

export function useNestJSAuth() {
  const context = useContext(NestJSAuthContext);
  if (context === undefined) {
    throw new Error('useNestJSAuth must be used within a NestJSAuthProvider');
  }
  return context;
}

export const useAuth = useNestJSAuth;