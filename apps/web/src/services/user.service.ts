import { plugbaseAPI, User, UpdateUserRequest, RegisterRequest } from '@/lib/plugbase-api'

export class UserService {
  // Buscar lista de usuários com paginação
  async getUsers(page = 1, limit = 10) {
    try {
      return await plugbaseAPI.getUsers(page, limit)
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao buscar usuários')
    }
  }

  // Criar novo usuário
  async createUser(userData: RegisterRequest): Promise<User> {
    try {
      return await plugbaseAPI.createUser(userData)
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao criar usuário')
    }
  }

  // Atualizar dados do usuário
  async updateUser(id: string, userData: UpdateUserRequest): Promise<User> {
    try {
      return await plugbaseAPI.updateUser(id, userData)
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao atualizar usuário')
    }
  }

  // Deletar usuário
  async deleteUser(id: string): Promise<void> {
    try {
      await plugbaseAPI.deleteUser(id)
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao deletar usuário')
    }
  }

  // Buscar dados do usuário atual (alias para getCurrentUser do AuthService)
  async getCurrentUser(): Promise<User> {
    try {
      return await plugbaseAPI.getMe()
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao buscar dados do usuário')
    }
  }
}

// Instância singleton do serviço de usuários
export const userService = new UserService()