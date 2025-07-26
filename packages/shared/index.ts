// ===================================
// EXPORTS PRINCIPAIS - SHARED PACKAGE
// ===================================

export * from './types';
export * from './supabase';

// Re-export principais do Supabase
export { createClient } from '@supabase/supabase-js';
export type { 
  AuthResponse as SupabaseAuthResponse,
  User as SupabaseUser,
  Session
} from '@supabase/supabase-js';