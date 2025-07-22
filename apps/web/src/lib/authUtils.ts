import { apiClient } from "./api";

export function isUnauthorizedError(error: Error): boolean {
  return error.message.includes('401') || 
         error.message.includes('Unauthorized') || 
         error.message.includes('unauthorized');
}

export async function handleLogout(): Promise<void> {
  try {
    await apiClient.logout();
  } catch (error) {
    console.error('Logout error:', error);
    // Continue mesmo se o logout falhar no servidor
  } finally {
    // Limpar qualquer estado local de autenticação
    localStorage.clear();
    sessionStorage.clear();
    
    // Redirecionar para landing page
    window.location.href = '/';
  }
}

export function redirectToAuth(): void {
  // Em vez de redirecionar para /api/login, redireciona para landing
  window.location.href = '/';
}