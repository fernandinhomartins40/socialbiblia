import { QueryClient } from '@tanstack/react-query';

// Configuração otimizada do React Query
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 10 * 60 * 1000, // 10 minutos
      retry: 3,
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Funções utilitárias para cache
export const cacheUtils = {
  // Invalidar cache de posts
  invalidatePosts: () => {
    queryClient.invalidateQueries({ queryKey: ['posts'] });
  },

  // Invalidar cache de usuário
  invalidateUser: (userId?: string) => {
    if (userId) {
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
    }
    queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
  },

  // Limpar todo o cache
  clearAll: () => {
    queryClient.clear();
  },
};
