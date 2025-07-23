import { plugbaseAPI, Post, CreatePostRequest, UpdatePostRequest } from '@/lib/plugbase-api'

export class PostService {
  // Buscar lista de posts com paginação
  async getPosts(page = 1, limit = 10) {
    try {
      return await plugbaseAPI.getPosts(page, limit)
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao buscar posts')
    }
  }

  // Buscar um post específico por ID
  async getPost(id: string): Promise<Post> {
    try {
      return await plugbaseAPI.getPost(id)
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao buscar post')
    }
  }

  // Criar novo post
  async createPost(postData: CreatePostRequest): Promise<Post> {
    try {
      return await plugbaseAPI.createPost(postData)
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao criar post')
    }
  }

  // Atualizar post existente
  async updatePost(id: string, postData: UpdatePostRequest): Promise<Post> {
    try {
      return await plugbaseAPI.updatePost(id, postData)
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao atualizar post')
    }
  }

  // Deletar post
  async deletePost(id: string): Promise<void> {
    try {
      await plugbaseAPI.deletePost(id)
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao deletar post')
    }
  }
}

// Instância singleton do serviço de posts
export const postService = new PostService()