import { plugbaseAPI, LoginRequest, RegisterRequest, User } from '@/lib/plugbase-api'

export class AuthService {
  // Login do usuário
  async login(credentials: LoginRequest) {
    try {
      const response = await plugbaseAPI.login(credentials)
      return response
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao fazer login')
    }
  }

  // Registro de novo usuário
  async register(userData: RegisterRequest) {
    try {
      const response = await plugbaseAPI.register(userData)
      return response
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao criar conta')
    }
  }

  // Buscar dados do usuário atual
  async getCurrentUser(): Promise<User> {
    try {
      return await plugbaseAPI.getMe()
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao buscar dados do usuário')
    }
  }

  // Logout do usuário
  async logout() {
    try {
      await plugbaseAPI.logout()
    } catch (error) {
      // Mesmo se houver erro no servidor, limpar dados locais
      console.warn('Erro ao fazer logout no servidor:', error)
    } finally {
      plugbaseAPI.clearAuth()
    }
  }

  // Verificar se usuário está autenticado
  isAuthenticated(): boolean {
    return plugbaseAPI.isAuthenticated()
  }

  // Obter token atual
  getToken(): string | null {
    return plugbaseAPI.getToken()
  }

  // Limpar dados de autenticação
  clearAuth(): void {
    plugbaseAPI.clearAuth()
  }
}

// Instância singleton do serviço de autenticação
export const authService = new AuthService()