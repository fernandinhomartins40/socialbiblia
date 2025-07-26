// ===================================
// CLIENTE SUPABASE COMPARTILHADO
// ===================================

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// URLs serão definidas via environment
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:3001';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

// Cliente Supabase tipado
export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Helpers para auth
export const auth = {
  signUp: (data: { email: string; password: string; username: string; firstName?: string; lastName?: string }) =>
    supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          username: data.username,
          first_name: data.firstName,
          last_name: data.lastName
        }
      }
    }),

  signIn: (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password }),

  signOut: () => supabase.auth.signOut(),

  getUser: () => supabase.auth.getUser(),

  getSession: () => supabase.auth.getSession(),

  onAuthStateChange: (callback: (event: string, session: any) => void) =>
    supabase.auth.onAuthStateChange(callback)
};

// Helpers para posts
export const posts = {
  getAll: () => supabase
    .from('posts')
    .select(`
      *,
      author:users(id, username, first_name, last_name, avatar)
    `)
    .eq('status', 'PUBLISHED')
    .order('created_at', { ascending: false }),

  getById: (id: string) => supabase
    .from('posts')
    .select(`
      *,
      author:users(id, username, first_name, last_name, avatar),
      comments(
        *,
        author:users(id, username, first_name, last_name, avatar)
      )
    `)
    .eq('id', id)
    .single(),

  create: (post: {
    title: string;
    content: string;
    excerpt?: string;
    tags?: string[];
    category?: string;
  }) => supabase.from('posts').insert(post),

  update: (id: string, updates: any) => supabase
    .from('posts')
    .update(updates)
    .eq('id', id),

  delete: (id: string) => supabase
    .from('posts')
    .delete()
    .eq('id', id)
};

// Helpers para comments
export const comments = {
  getByPost: (postId: string) => supabase
    .from('comments')
    .select(`
      *,
      author:users(id, username, first_name, last_name, avatar)
    `)
    .eq('post_id', postId)
    .eq('is_approved', true)
    .order('created_at', { ascending: true }),

  create: (comment: {
    content: string;
    post_id: string;
    parent_id?: string;
  }) => supabase.from('comments').insert(comment),

  update: (id: string, updates: any) => supabase
    .from('comments')
    .update(updates)
    .eq('id', id),

  delete: (id: string) => supabase
    .from('comments')
    .delete()
    .eq('id', id)
};

export default supabase;