import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type { UserWithStats } from '@socialbiblia/shared';

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<UserWithStats>({
    queryKey: ["auth", "user"],
    queryFn: () => apiClient.getCurrentUser(),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
  };
}
