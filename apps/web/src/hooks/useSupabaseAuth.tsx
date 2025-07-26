import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import type { User, Session, AuthError } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signUp: (data: SignUpData) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
}

interface SignUpData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  username: string;
}

interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  username?: string;
  avatar?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  useEffect(() => {
    // Buscar sessão inicial
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        setSession(session);
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Erro ao buscar sessão:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);

        // Atualizar last_login quando usuário faz login
        if (event === 'SIGNED_IN' && session?.user) {
          try {
            await supabase
              .from('users')
              .update({ last_login: new Date().toISOString() })
              .eq('id', session.user.id);
          } catch (error) {
            console.error('Erro ao atualizar last_login:', error);
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (data: SignUpData) => {
    try {
      setIsLoading(true);

      // Registrar no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            username: data.username,
            first_name: data.firstName,
            last_name: data.lastName,
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Inserir dados adicionais na tabela users
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: data.email,
            username: data.username,
            first_name: data.firstName,
            last_name: data.lastName,
            is_email_verified: authData.user.email_confirmed_at ? true : false,
          });

        if (profileError) {
          console.error('Erro ao criar perfil:', profileError);
          // Não vamos falhar se o perfil já existir
          if (!profileError.message.includes('duplicate key')) {
            throw profileError;
          }
        }

        toast({
          title: 'Conta criada com sucesso!',
          description: `Bem-vindo(a), ${data.firstName || data.username}!`,
        });
      }
    } catch (error: any) {
      console.error('Erro no registro:', error);
      
      let errorMessage = 'Erro ao criar conta';
      if (error.message?.includes('duplicate key')) {
        if (error.message.includes('email')) {
          errorMessage = 'Este email já está em uso';
        } else if (error.message.includes('username')) {
          errorMessage = 'Este username já está em uso';
        }
      } else if (error.message?.includes('Password')) {
        errorMessage = 'A senha deve ter pelo menos 8 caracteres';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: 'Erro ao criar conta',
        description: errorMessage,
        variant: 'destructive',
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        toast({
          title: 'Login realizado com sucesso!',
          description: `Bem-vindo(a) de volta!`,
        });
      }
    } catch (error: any) {
      console.error('Erro no login:', error);
      
      let errorMessage = 'Credenciais inválidas';
      if (error.message?.includes('Invalid login')) {
        errorMessage = 'Email ou senha incorretos';
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Email não confirmado. Verifique sua caixa de entrada';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: 'Erro no login',
        description: errorMessage,
        variant: 'destructive',
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast({
        title: 'Logout realizado com sucesso!',
        description: 'Até logo!',
      });
    } catch (error: any) {
      console.error('Erro no logout:', error);
      toast({
        title: 'Erro no logout',
        description: error.message || 'Erro inesperado',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: UpdateProfileData) => {
    try {
      if (!user) throw new Error('Usuário não autenticado');

      setIsLoading(true);

      const { error } = await supabase
        .from('users')
        .update({
          first_name: data.firstName,
          last_name: data.lastName,
          username: data.username,
          avatar: data.avatar,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Perfil atualizado!',
        description: 'Suas informações foram salvas com sucesso.',
      });
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      toast({
        title: 'Erro ao atualizar perfil',
        description: error.message || 'Erro inesperado',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    isAuthenticated,
    signUp,
    signIn,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useSupabaseAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
}

// Alias para compatibilidade
export const AuthProvider = SupabaseAuthProvider;