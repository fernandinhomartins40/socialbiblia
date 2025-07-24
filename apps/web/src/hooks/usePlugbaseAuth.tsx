import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authService } from '@/services/auth.service'
import { User, LoginRequest, RegisterRequest } from '@/lib/plugbase-api'
import { toast } from '@/hooks/use-toast'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: LoginRequest) => Promise<void>
  register: (userData: RegisterRequest) => Promise<void>
  logout: () => Promise<void>
  refetch: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated())
  const queryClient = useQueryClient()

  // Query para buscar dados do usuário atual
  const {
    data: user,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['currentUser'],
    queryFn: authService.getCurrentUser,
    enabled: isAuthenticated,
    retry: (failureCount, error: any) => {
      // Não retry se erro 401 (não autorizado)
      if (error?.response?.status === 401) {
        return false
      }
      return failureCount < 3
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  })

  // Mutation para login
  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      setIsAuthenticated(true)
      queryClient.invalidateQueries({ queryKey: ['currentUser'] })
      toast({
        title: 'Login realizado com sucesso!',
        description: `Bem-vindo(a), ${data.user.name}!`,
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro no login',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  // Mutation para registro
  const registerMutation = useMutation({
    mutationFn: authService.register,
    onSuccess: (data) => {
      setIsAuthenticated(true)
      queryClient.invalidateQueries({ queryKey: ['currentUser'] })
      toast({
        title: 'Conta criada com sucesso!',
        description: `Bem-vindo(a), ${data.user.name}!`,
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar conta',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  // Mutation para logout
  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      setIsAuthenticated(false)
      queryClient.clear()
      toast({
        title: 'Logout realizado com sucesso!',
        description: 'Até logo!',
      })
    },
    onError: (error: Error) => {
      // Mesmo com erro, fazer logout local
      setIsAuthenticated(false)
      queryClient.clear()
      toast({
        title: 'Logout realizado',
        description: 'Sessão encerrada.',
      })
    },
  })

  // Funções de interface
  const login = async (credentials: LoginRequest) => {
    await loginMutation.mutateAsync(credentials)
  }

  const register = async (userData: RegisterRequest) => {
    await registerMutation.mutateAsync(userData)
  }

  const logout = async () => {
    await logoutMutation.mutateAsync()
  }

  // Verificar token no localStorage na inicialização
  useEffect(() => {
    const token = authService.getToken()
    setIsAuthenticated(!!token)
  }, [])

  const value: AuthContextType = {
    user: user || null,
    isLoading: isLoading || loginMutation.isPending || registerMutation.isPending,
    isAuthenticated,
    login,
    register,
    logout,
    refetch,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function usePlugbaseAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('usePlugbaseAuth must be used within an AuthProvider')
  }
  return context
}