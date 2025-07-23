import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type { UserWithStats } from "@/lib/shared-types";

export function useAuth() {
  // Check if we have tokens in localStorage
  const hasAccessToken = !!localStorage.getItem('accessToken');
  const hasRefreshToken = !!localStorage.getItem('refreshToken');
  
  const { data: user, isLoading, error } = useQuery<UserWithStats>({
    queryKey: ["auth", "user"],
    queryFn: () => apiClient.getCurrentUser(),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: hasAccessToken, // Only run query if we have a token
  });

  // If we have no tokens, we're definitely not authenticated
  if (!hasAccessToken && !hasRefreshToken) {
    return {
      user: null,
      isLoading: false,
      error: null,
      isAuthenticated: false,
    };
  }

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
  };
}
