import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Logger } from '../../utils/logger';

export class ProductsDatabase {
  private static instance: PrismaClient;
  private static migrationVersion = '001';

  static getInstance(): PrismaClient {
    if (!ProductsDatabase.instance) {
      ProductsDatabase.instance = new PrismaClient();
    }
    return ProductsDatabase.instance;
  }

  static async connect(): Promise<void> {
    try {
      const client = this.getInstance();
      await client.$connect();
      Logger.info('🛍️ Plugin Products: Conexão com banco estabelecida');
    } catch (error) {
      Logger.error('🛍️ Plugin Products: Erro ao conectar com banco', error as Error);
      throw error;
    }
  }

  static async disconnect(): Promise<void> {
    try {
      if (ProductsDatabase.instance) {
        await ProductsDatabase.instance.$disconnect();
        Logger.info('🛍️ Plugin Products: Conexão com banco encerrada');
      }
    } catch (error) {
      Logger.error('🛍️ Plugin Products: Erro ao desconectar banco', error as Error);
    }
  }

  static async runMigrations(): Promise<void> {
    try {
      const client = this.getInstance();
      
      // Verificar se tabela de migrations do plugin existe
      await this.createMigrationsTable();
      
      // Verificar se migration já foi executada
      const applied = await this.isMigrationApplied('products_schema_001');
      
      if (!applied) {
        Logger.info('🛍️ Plugin Products: Executando migrations...');
        
        // Ler e executar schema SQL
        const schemaPath = join(__dirname, 'schema.sql');
        const schemaSql = readFileSync(schemaPath, 'utf-8');
        
        // Executar migration
        await client.$executeRawUnsafe(schemaSql);
        
        // Marcar migration como aplicada
        await this.recordMigration('products_schema_001', 'Initial products schema');
        
        Logger.info('🛍️ Plugin Products: Migrations executadas com sucesso');
      } else {
        Logger.info('🛍️ Plugin Products: Migrations já aplicadas');
      }
    } catch (error) {
      Logger.error('🛍️ Plugin Products: Erro ao executar migrations', error as Error);
      throw error;
    }
  }

  private static async createMigrationsTable(): Promise<void> {
    const client = this.getInstance();
    
    await client.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS plugin_migrations (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        plugin_name VARCHAR(100) NOT NULL,
        migration_name VARCHAR(200) NOT NULL,
        description TEXT,
        applied_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(plugin_name, migration_name)
      );
    `);
  }

  private static async isMigrationApplied(migrationName: string): Promise<boolean> {
    const client = this.getInstance();
    
    const result = await client.$queryRawUnsafe(`
      SELECT COUNT(*) as count 
      FROM plugin_migrations 
      WHERE plugin_name = 'products' AND migration_name = $1
    `, migrationName);
    
    return (result as any)[0].count > 0;
  }

  private static async recordMigration(migrationName: string, description: string): Promise<void> {
    const client = this.getInstance();
    
    await client.$executeRawUnsafe(`
      INSERT INTO plugin_migrations (plugin_name, migration_name, description)
      VALUES ('products', $1, $2)
    `, migrationName, description);
  }

  // Métodos helper para queries específicas do plugin
  static async query(sql: string, params: any[] = []): Promise<any> {
    const client = this.getInstance();
    return client.$queryRawUnsafe(sql, ...params);
  }

  static async execute(sql: string, params: any[] = []): Promise<any> {
    const client = this.getInstance();
    return client.$executeRawUnsafe(sql, ...params);
  }

  // Métodos específicos para o domínio de produtos
  static async findProducts(filters: {
    search?: string;
    categoryId?: string;
    userId?: string;
    status?: string;
    featured?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ products: any[]; total: number }> {
    const { 
      search, 
      categoryId, 
      userId, 
      status = 'active', 
      featured, 
      page = 1, 
      limit = 10 
    } = filters;

    const offset = (page - 1) * limit;
    const conditions = ['deleted_at IS NULL'];
    const params: any[] = [];
    let paramIndex = 1;

    if (search) {
      conditions.push(`(name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (categoryId) {
      conditions.push(`category_id = $${paramIndex}`);
      params.push(categoryId);
      paramIndex++;
    }

    if (userId) {
      conditions.push(`user_id = $${paramIndex}`);
      params.push(userId);
      paramIndex++;
    }

    if (status) {
      conditions.push(`status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (featured !== undefined) {
      conditions.push(`featured = $${paramIndex}`);
      params.push(featured);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Query para contar total
    const countQuery = `SELECT COUNT(*) as count FROM products ${whereClause}`;
    const countResult = await this.query(countQuery, params);
    const total = parseInt(countResult[0].count);

    // Query para buscar produtos
    const productsQuery = `
      SELECT 
        p.*,
        c.name as category_name,
        c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    params.push(limit, offset);
    const products = await this.query(productsQuery, params);

    return { products, total };
  }

  static async findProductById(id: string): Promise<any> {
    const query = `
      SELECT 
        p.*,
        c.name as category_name,
        c.slug as category_slug,
        COALESCE(
          json_agg(
            json_build_object(
              'id', pv.id,
              'name', pv.name,
              'sku', pv.sku,
              'price', pv.price,
              'stock', pv.stock,
              'attributes', pv.attributes,
              'image_url', pv.image_url,
              'is_active', pv.is_active
            )
          ) FILTER (WHERE pv.id IS NOT NULL), 
          '[]'
        ) as variants
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_variants pv ON p.id = pv.product_id AND pv.is_active = true
      WHERE p.id = $1 AND p.deleted_at IS NULL
      GROUP BY p.id, c.name, c.slug
    `;

    const result = await this.query(query, [id]);
    return result[0] || null;
  }

  static async createProduct(data: any): Promise<any> {
    const {
      name,
      slug,
      description,
      shortDescription,
      price,
      comparePrice,
      costPrice,
      sku,
      stock,
      categoryId,
      userId,
      brand,
      status = 'draft',
      featured = false,
      tags = [],
      images = [],
      attributes = {},
      isDigital = false,
      requiresShipping = true
    } = data;

    const query = `
      INSERT INTO products (
        name, slug, description, short_description, price, compare_price, cost_price,
        sku, stock, category_id, user_id, brand, status, featured, tags,
        images, attributes, is_digital, requires_shipping
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
      ) RETURNING *
    `;

    const result = await this.query(query, [
      name, slug, description, shortDescription, price, comparePrice, costPrice,
      sku, stock, categoryId, userId, brand, status, featured, tags,
      JSON.stringify(images), JSON.stringify(attributes), isDigital, requiresShipping
    ]);

    return result[0];
  }

  static async updateProduct(id: string, data: any): Promise<any> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    const allowedFields = [
      'name', 'slug', 'description', 'short_description', 'price', 'compare_price',
      'cost_price', 'sku', 'stock', 'category_id', 'brand', 'status', 'featured',
      'tags', 'images', 'attributes', 'is_digital', 'requires_shipping'
    ];

    for (const [key, value] of Object.entries(data)) {
      const dbField = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      if (allowedFields.includes(dbField)) {
        updates.push(`${dbField} = $${paramIndex}`);
        params.push(typeof value === 'object' ? JSON.stringify(value) : value);
        paramIndex++;
      }
    }

    if (updates.length === 0) {
      throw new Error('Nenhum campo válido para atualização');
    }

    params.push(id);
    const query = `
      UPDATE products 
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex} AND deleted_at IS NULL
      RETURNING *
    `;

    const result = await this.query(query, params);
    return result[0];
  }

  static async deleteProduct(id: string): Promise<void> {
    await this.execute(
      'UPDATE products SET deleted_at = NOW() WHERE id = $1',
      [id]
    );
  }
}