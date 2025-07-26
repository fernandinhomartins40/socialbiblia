-- ===================================
-- SCHEMA SOCIALBIBLIA PARA SUPABASE
-- ===================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===================================
-- TABELA USERS (Principal)
-- ===================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255),
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  avatar VARCHAR(255),
  role VARCHAR(50) DEFAULT 'USER',
  is_email_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_email_active ON users(email, is_active);

-- ===================================
-- TABELA POSTS
-- ===================================
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  status VARCHAR(50) DEFAULT 'DRAFT',
  published_at TIMESTAMP WITH TIME ZONE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tags JSONB DEFAULT '[]'::jsonb,
  category VARCHAR(255),
  featured BOOLEAN DEFAULT false,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Índices para posts
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_featured ON posts(featured);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON posts(published_at);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);

-- ===================================
-- TABELA COMMENTS
-- ===================================
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Índices para comments
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_is_approved ON comments(is_approved);

-- ===================================
-- TRIGGERS PARA UPDATED_AT
-- ===================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===================================
-- CONFIGURAÇÃO SUPABASE RLS
-- ===================================

-- Habilitar RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para Users
CREATE POLICY "Users can read own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Anyone can read public user data" ON users
  FOR SELECT USING (true);

-- Políticas RLS para Posts
CREATE POLICY "Anyone can read published posts" ON posts
  FOR SELECT USING (status = 'PUBLISHED' OR auth.uid() = author_id);

CREATE POLICY "Authors can insert own posts" ON posts
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update own posts" ON posts
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete own posts" ON posts
  FOR DELETE USING (auth.uid() = author_id);

-- Políticas RLS para Comments
CREATE POLICY "Anyone can read approved comments" ON comments
  FOR SELECT USING (is_approved = true OR auth.uid() = author_id);

CREATE POLICY "Authenticated users can insert comments" ON comments
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update own comments" ON comments
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete own comments" ON comments
  FOR DELETE USING (auth.uid() = author_id);

-- ===================================
-- DADOS INICIAIS (SEED)
-- ===================================

-- Inserir admin user (será associado ao Supabase Auth)
INSERT INTO users (
  id,
  email, 
  username, 
  first_name, 
  last_name, 
  role, 
  is_email_verified, 
  is_active
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@socialbiblia.com',
  'admin',
  'Admin',
  'System',
  'ADMIN',
  true,
  true
) ON CONFLICT (email) DO NOTHING;

-- Post de boas-vindas
INSERT INTO posts (
  id,
  title,
  slug,
  content,
  excerpt,
  status,
  author_id,
  published_at,
  featured
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Bem-vindos ao SocialBiblia',
  'bem-vindos-socialbiblia',
  '# Bem-vindos ao SocialBiblia

Este é o primeiro post do SocialBiblia. Aqui você encontrará:

- **Conteúdo espiritual** inspirador
- **Comunidade acolhedora** de fé
- **Discussões edificantes** sobre a Palavra
- **Orações e testemunhos** compartilhados

Que Deus abençoe sua jornada conosco! 🙏

## Como participar?

1. Crie sua conta
2. Compartilhe seus testemunhos
3. Participe das discussões
4. Ore pela comunidade

*"Onde estiverem dois ou três reunidos em meu nome, aí estou eu no meio deles."* - Mateus 18:20',
  'Primeiro post do SocialBiblia. Venha fazer parte desta comunidade de fé e crescimento espiritual.',
  'PUBLISHED',
  '00000000-0000-0000-0000-000000000001',
  NOW(),
  true
) ON CONFLICT (slug) DO NOTHING;