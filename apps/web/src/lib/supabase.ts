// ===================================
// CLIENTE SUPABASE - SOCIALBIBLIA
// ===================================

import { createClient } from '@supabase/supabase-js';

// URLs da instância Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:3001';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogImFub24iLAogICJpc3MiOiAic3VwYWJhc2UiLAogICJpYXQiOiAxNzI3MjMzMjAwLAogICJleHAiOiAxODg0OTk5NjAwCn0.O0qBbl300xfJrhmW3YktijUJQ5ZW6OXVyZjnSwSCzCg';

// Cliente Supabase configurado
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Tipos para o banco de dados
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          username: string;
          first_name?: string;
          last_name?: string;
          avatar?: string;
          role: string;
          is_email_verified: boolean;
          is_active: boolean;
          last_login?: string;
          created_at: string;
          updated_at: string;
          deleted_at?: string;
        };
        Insert: {
          email: string;
          username: string;
          first_name?: string;
          last_name?: string;
          avatar?: string;
          role?: string;
          is_email_verified?: boolean;
          is_active?: boolean;
        };
        Update: {
          email?: string;
          username?: string;
          first_name?: string;
          last_name?: string;
          avatar?: string;
          role?: string;
          is_email_verified?: boolean;
          is_active?: boolean;
          last_login?: string;
        };
      };
      posts: {
        Row: {
          id: string;
          title: string;
          slug: string;
          content: string;
          excerpt?: string;
          status: string;
          published_at?: string;
          author_id: string;
          tags?: any;
          category?: string;
          featured: boolean;
          views: number;
          created_at: string;
          updated_at: string;
          deleted_at?: string;
        };
        Insert: {
          title: string;
          slug: string;
          content: string;
          excerpt?: string;
          status?: string;
          published_at?: string;
          author_id: string;
          tags?: any;
          category?: string;
          featured?: boolean;
          views?: number;
        };
        Update: {
          title?: string;
          slug?: string;
          content?: string;
          excerpt?: string;
          status?: string;
          published_at?: string;
          tags?: any;
          category?: string;
          featured?: boolean;
          views?: number;
        };
      };
      comments: {
        Row: {
          id: string;
          content: string;
          post_id: string;
          author_id: string;
          parent_id?: string;
          is_approved: boolean;
          created_at: string;
          updated_at: string;
          deleted_at?: string;
        };
        Insert: {
          content: string;
          post_id: string;
          author_id: string;
          parent_id?: string;
          is_approved?: boolean;
        };
        Update: {
          content?: string;
          is_approved?: boolean;
        };
      };
    };
  };
}

export default supabase;