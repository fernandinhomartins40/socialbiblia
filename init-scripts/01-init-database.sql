-- Script de inicialização do banco de dados Social Bíblia
-- Este script será executado automaticamente quando o PostgreSQL iniciar pela primeira vez

-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Comentário sobre o banco
COMMENT ON DATABASE socialbiblia_db IS 'Banco de dados da aplicação Social Bíblia - Rede social cristã com IA';

-- Log de inicialização
DO $$
BEGIN
    RAISE NOTICE 'Banco de dados Social Bíblia inicializado com sucesso!';
END $$;