export function createMigrationTemplate(pluginName: string, className: string): string {
  return `-- Migration para o plugin ${className}
-- Gerado automaticamente pelo Plugbase CLI

-- Criar tabela principal do plugin
CREATE TABLE IF NOT EXISTS ${pluginName} (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- Campos de auditoria
  user_id VARCHAR(36), -- Referência lógica para users.id (sem FK)
  created_by VARCHAR(36), -- Referência lógica para users.id (sem FK)
  updated_by VARCHAR(36), -- Referência lógica para users.id (sem FK)
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE NULL -- Para soft delete
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_${pluginName}_name ON ${pluginName}(name);
CREATE INDEX IF NOT EXISTS idx_${pluginName}_user_id ON ${pluginName}(user_id);
CREATE INDEX IF NOT EXISTS idx_${pluginName}_created_at ON ${pluginName}(created_at);
CREATE INDEX IF NOT EXISTS idx_${pluginName}_deleted_at ON ${pluginName}(deleted_at);

-- Índice composto para busca e paginação
CREATE INDEX IF NOT EXISTS idx_${pluginName}_search ON ${pluginName}(name, description) WHERE deleted_at IS NULL;

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_${pluginName}_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_${pluginName}_updated_at ON ${pluginName};
CREATE TRIGGER trigger_update_${pluginName}_updated_at
  BEFORE UPDATE ON ${pluginName}
  FOR EACH ROW
  EXECUTE FUNCTION update_${pluginName}_updated_at();

-- Comentários para documentação
COMMENT ON TABLE ${pluginName} IS 'Tabela principal do plugin ${className}';
COMMENT ON COLUMN ${pluginName}.id IS 'Identificador único UUID';
COMMENT ON COLUMN ${pluginName}.name IS 'Nome do item (obrigatório)';
COMMENT ON COLUMN ${pluginName}.description IS 'Descrição opcional do item';
COMMENT ON COLUMN ${pluginName}.user_id IS 'ID do usuário proprietário (referência lógica)';
COMMENT ON COLUMN ${pluginName}.created_by IS 'ID do usuário que criou (referência lógica)';
COMMENT ON COLUMN ${pluginName}.updated_by IS 'ID do usuário que atualizou (referência lógica)';
COMMENT ON COLUMN ${pluginName}.deleted_at IS 'Timestamp para soft delete (NULL = ativo)';

-- Dados de exemplo (opcional - remover em produção)
INSERT INTO ${pluginName} (name, description) VALUES 
  ('Exemplo 1', 'Item de exemplo criado durante a migration'),
  ('Exemplo 2', 'Outro item de exemplo para teste')
ON CONFLICT DO NOTHING;

-- Log da migration
INSERT INTO plugin_migrations (plugin_name, migration_name, executed_at) VALUES 
  ('${pluginName}', 'create_${pluginName}', CURRENT_TIMESTAMP)
ON CONFLICT (plugin_name, migration_name) DO NOTHING;
`;
}