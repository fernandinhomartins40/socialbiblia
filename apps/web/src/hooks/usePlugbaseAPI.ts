import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query'
import { postService } from '@/services/post.service'
import { userService } from '@/services/user.service'
import { plugbaseAPI } from '@/lib/plugbase-api'
import { 
  Post, 
  User, 
  CreatePostRequest, 
  UpdatePostRequest, 
  UpdateUserRequest,
  StorageFile 
} from '@/lib/plugbase-api'
import { toast } from '@/hooks/use-toast'

// ========== POSTS HOOKS ==========

export function usePosts(page = 1, limit = 10) {
  return useQuery({
    queryKey: ['posts', page, limit],
    queryFn: () => postService.getPosts(page, limit),
    staleTime: 2 * 60 * 1000, // 2 minutos
  })
}

export function usePost(id: string, options?: UseQueryOptions<Post>) {
  return useQuery({
    queryKey: ['post', id],
    queryFn: () => postService.getPost(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutos
    ...options,
  })
}

export function useCreatePost() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CreatePostRequest) => postService.createPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      toast({
        title: 'Post criado com sucesso!',
        description: 'Seu post foi publicado.',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar post',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

export function useUpdatePost() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePostRequest }) => 
      postService.updatePost(id, data),
    onSuccess: (updatedPost) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.setQueryData(['post', updatedPost.id], updatedPost)
      toast({
        title: 'Post atualizado com sucesso!',
        description: 'As alterações foram salvas.',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar post',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

export function useDeletePost() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => postService.deletePost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      toast({
        title: 'Post deletado com sucesso!',
        description: 'O post foi removido.',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao deletar post',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

// ========== USERS HOOKS ==========

export function useUsers(page = 1, limit = 10) {
  return useQuery({
    queryKey: ['users', page, limit],
    queryFn: () => userService.getUsers(page, limit),
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserRequest }) => 
      userService.updateUser(id, data),
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['currentUser'] })
      toast({
        title: 'Usuário atualizado com sucesso!',
        description: 'As alterações foram salvas.',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar usuário',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => userService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast({
        title: 'Usuário deletado com sucesso!',
        description: 'O usuário foi removido.',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao deletar usuário',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

// ========== STORAGE HOOKS ==========

export function useUploadFile() {
  return useMutation({
    mutationFn: (file: File) => plugbaseAPI.uploadFile(file),
    onSuccess: () => {
      toast({
        title: 'Arquivo enviado com sucesso!',
        description: 'O arquivo foi salvo.',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao enviar arquivo',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

export function useFiles(page = 1, limit = 10) {
  return useQuery({
    queryKey: ['files', page, limit],
    queryFn: () => plugbaseAPI.getFiles(page, limit),
    staleTime: 2 * 60 * 1000, // 2 minutos
  })
}

export function useDeleteFile() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => plugbaseAPI.deleteFile(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] })
      toast({
        title: 'Arquivo deletado com sucesso!',
        description: 'O arquivo foi removido.',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao deletar arquivo',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

// ========== UTILITY HOOKS ==========

// Hook genérico para operações de API customizadas
export function usePlugbaseQuery<T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options?: UseQueryOptions<T>
) {
  return useQuery({
    queryKey,
    queryFn,
    ...options,
  })
}

export function usePlugbaseMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: UseMutationOptions<TData, Error, TVariables>
) {
  return useMutation({
    mutationFn,
    ...options,
  })
}