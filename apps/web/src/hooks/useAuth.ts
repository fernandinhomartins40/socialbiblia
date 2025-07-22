import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
// Temporary: Using local type definition
// import type { UserWithStats } from '@socialbiblia/shared';

interface UserWithStats {
  id: string;
  email: string;
  name: string;
  phone?: string;
}

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
