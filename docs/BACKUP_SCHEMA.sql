-- BACKUP DO SCHEMA ATUAL - SOCIALBIBLIA
-- Data: 2025-07-26
-- Fonte: apps/backend/prisma/schema.prisma

-- ===================================
-- TABELA USERS (Principal)
-- ===================================
CREATE TABLE users (
  id VARCHAR(25) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  avatar VARCHAR(255),
  role VARCHAR(50) DEFAULT 'USER',
  is_email_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- Índices para performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_deleted_at ON users(deleted_at);
CREATE INDEX idx_users_email_active ON users(email, is_active);
CREATE INDEX idx_users_role_active ON users(role, is_active);

-- ===================================
-- TABELAS DE AUTENTICAÇÃO
-- ===================================
CREATE TABLE refresh_tokens (
  id VARCHAR(25) PRIMARY KEY,
  token VARCHAR(500) UNIQUE NOT NULL,
  user_id VARCHAR(25) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE password_reset_tokens (
  id VARCHAR(25) PRIMARY KEY,
  token VARCHAR(500) UNIQUE NOT NULL,
  user_id VARCHAR(25) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE email_verification_tokens (
  id VARCHAR(25) PRIMARY KEY,
  token VARCHAR(500) UNIQUE NOT NULL,
  user_id VARCHAR(25) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ===================================
-- TABELA POSTS
-- ===================================
CREATE TABLE posts (
  id VARCHAR(25) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  status VARCHAR(50) DEFAULT 'DRAFT',
  published_at TIMESTAMP,
  author_id VARCHAR(25) NOT NULL,
  tags TEXT, -- JSON string
  category VARCHAR(255),
  featured BOOLEAN DEFAULT false,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Índices para posts
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_featured ON posts(featured);
CREATE INDEX idx_posts_published_at ON posts(published_at);
CREATE INDEX idx_posts_slug ON posts(slug);

-- ===================================
-- TABELA COMMENTS
-- ===================================
CREATE TABLE comments (
  id VARCHAR(25) PRIMARY KEY,
  content TEXT NOT NULL,
  post_id VARCHAR(25) NOT NULL,
  author_id VARCHAR(25) NOT NULL,
  parent_id VARCHAR(25),
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
);

-- ===================================
-- CONFIGURAÇÃO SUPABASE RLS
-- ===================================

-- Habilitar RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para Users
CREATE POLICY "Users can read own profile" ON users
  FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id);

-- Políticas RLS para Posts
CREATE POLICY "Anyone can read published posts" ON posts
  FOR SELECT USING (status = 'PUBLISHED');

CREATE POLICY "Authors can manage own posts" ON posts
  FOR ALL USING (auth.uid()::text = author_id);

-- Políticas RLS para Comments
CREATE POLICY "Anyone can read approved comments" ON comments
  FOR SELECT USING (is_approved = true);

CREATE POLICY "Authors can manage own comments" ON comments
  FOR ALL USING (auth.uid()::text = author_id);

-- ===================================
-- DADOS INICIAIS (SEED)
-- ===================================

-- Admin user (senha será 'admin' com hash)
INSERT INTO users (
  id, 
  email, 
  username, 
  password, 
  first_name, 
  last_name, 
  role, 
  is_email_verified, 
  is_active
) VALUES (
  'admin_user_id',
  'admin@socialbiblia.com',
  'admin',
  '$2b$12$hash_of_admin_password', -- Será gerado pelo Supabase
  'Admin',
  'System',
  'ADMIN',
  true,
  true
);

-- Post de exemplo
INSERT INTO posts (
  id,
  title,
  slug,
  content,
  status,
  author_id,
  published_at
) VALUES (
  'welcome_post',
  'Bem-vindos ao SocialBiblia',
  'bem-vindos-socialbiblia',
  'Este é o primeiro post do SocialBiblia. Aqui você encontrará conteúdo espiritual e uma comunidade acolhedora.',
  'PUBLISHED',
  'admin_user_id',
  NOW()
);