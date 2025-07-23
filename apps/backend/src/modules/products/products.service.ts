import { ProductsDatabase } from './database';
import { 
  Product, 
  ProductWithRelations, 
  CreateProductDto, 
  UpdateProductDto, 
  ProductFilters, 
  PaginatedProducts,
  ProductStatus 
} from './types';
import { NotFoundError, ValidationError, ForbiddenError } from '../../utils/errors';
import { Logger } from '../../utils/logger';

export class ProductsService {
  /**
   * Buscar produtos com filtros e paginação
   */
  static async getProducts(filters: ProductFilters): Promise<PaginatedProducts> {
    try {
      const page = filters.page || 1;
      const limit = Math.min(filters.limit || 10, 100); // Máximo 100 por página

      const { products, total } = await ProductsDatabase.findProducts({
        search: filters.search,
        categoryId: filters.categoryId,
        userId: filters.userId,
        status: filters.status,
        featured: filters.featured,
        page,
        limit,
      });

      const totalPages = Math.ceil(total / limit);

      return {
        products,
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      };
    } catch (error) {
      Logger.error('Erro ao buscar produtos', error as Error);
      throw error;
    }
  }

  /**
   * Buscar produto por ID com relacionamentos
   */
  static async getProductById(id: string): Promise<ProductWithRelations> {
    try {
      const product = await ProductsDatabase.findProductById(id);
      
      if (!product) {
        throw new NotFoundError('Produto');
      }

      return product;
    } catch (error) {
      Logger.error(`Erro ao buscar produto ${id}`, error as Error);
      throw error;
    }
  }

  /**
   * Buscar produto por slug
   */
  static async getProductBySlug(slug: string): Promise<ProductWithRelations> {
    try {
      const query = `
        SELECT 
          p.*,
          c.name as category_name,
          c.slug as category_slug
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.slug = $1 AND p.deleted_at IS NULL AND p.status = 'active'
      `;

      const result = await ProductsDatabase.query(query, [slug]);
      
      if (!result || result.length === 0) {
        throw new NotFoundError('Produto');
      }

      return result[0];
    } catch (error) {
      Logger.error(`Erro ao buscar produto por slug ${slug}`, error as Error);
      throw error;
    }
  }

  /**
   * Criar novo produto
   */
  static async createProduct(data: CreateProductDto, userId: string): Promise<Product> {
    try {
      // Validações
      await this.validateProductData(data);

      // Gerar slug se não fornecido
      const slug = data.slug || this.generateSlug(data.name);
      
      // Verificar se slug já existe
      await this.validateUniqueSlug(slug);

      // Verificar SKU único se fornecido
      if (data.sku) {
        await this.validateUniqueSku(data.sku);
      }

      const productData = {
        ...data,
        slug,
        userId,
        stock: data.stock || 0,
        status: data.status || ProductStatus.DRAFT,
        featured: data.featured || false,
        tags: data.tags || [],
        images: data.images || [],
        attributes: data.attributes || {},
        isDigital: data.isDigital || false,
        requiresShipping: data.requiresShipping !== false, // Default true
      };

      const product = await ProductsDatabase.createProduct(productData);

      Logger.info(`Produto criado: ${product.id}`, {
        productId: product.id,
        name: product.name,
        userId,
      });

      // Emitir evento (futuro)
      // EventBus.emit('product.created', { product, userId });

      return product;
    } catch (error) {
      Logger.error('Erro ao criar produto', error as Error);
      throw error;
    }
  }

  /**
   * Atualizar produto
   */
  static async updateProduct(
    id: string, 
    data: UpdateProductDto, 
    userId: string,
    userRole: string = 'USER'
  ): Promise<Product> {
    try {
      // Buscar produto atual
      const currentProduct = await this.getProductById(id);

      // Verificar permissões
      if (currentProduct.userId !== userId && userRole !== 'ADMIN') {
        throw new ForbiddenError('Você só pode editar seus próprios produtos');
      }

      // Validar dados se fornecidos
      if (Object.keys(data).length > 0) {
        await this.validateProductData(data, id);
      }

      // Verificar slug único se alterado
      if (data.slug && data.slug !== currentProduct.slug) {
        await this.validateUniqueSlug(data.slug, id);
      }

      // Verificar SKU único se alterado
      if (data.sku && data.sku !== currentProduct.sku) {
        await this.validateUniqueSku(data.sku, id);
      }

      const updatedProduct = await ProductsDatabase.updateProduct(id, data);

      Logger.info(`Produto atualizado: ${id}`, {
        productId: id,
        userId,
        changes: Object.keys(data),
      });

      // Emitir evento (futuro)
      // EventBus.emit('product.updated', { product: updatedProduct, userId });

      return updatedProduct;
    } catch (error) {
      Logger.error(`Erro ao atualizar produto ${id}`, error as Error);
      throw error;
    }
  }

  /**
   * Deletar produto (soft delete)
   */
  static async deleteProduct(
    id: string, 
    userId: string, 
    userRole: string = 'USER'
  ): Promise<void> {
    try {
      // Buscar produto atual
      const product = await this.getProductById(id);

      // Verificar permissões
      if (product.userId !== userId && userRole !== 'ADMIN') {
        throw new ForbiddenError('Você só pode deletar seus próprios produtos');
      }

      await ProductsDatabase.deleteProduct(id);

      Logger.info(`Produto deletado: ${id}`, {
        productId: id,
        userId,
        productName: product.name,
      });

      // Emitir evento (futuro)
      // EventBus.emit('product.deleted', { productId: id, userId });
    } catch (error) {
      Logger.error(`Erro ao deletar produto ${id}`, error as Error);
      throw error;
    }
  }

  /**
   * Buscar produtos de um usuário específico
   */
  static async getUserProducts(
    userId: string, 
    filters: Omit<ProductFilters, 'userId'>
  ): Promise<PaginatedProducts> {
    return this.getProducts({ ...filters, userId });
  }

  /**
   * Buscar produtos em destaque
   */
  static async getFeaturedProducts(limit: number = 10): Promise<ProductWithRelations[]> {
    const { products } = await ProductsDatabase.findProducts({
      featured: true,
      status: 'active',
      limit,
      page: 1,
    });

    return products;
  }

  /**
   * Buscar produtos relacionados (mesma categoria)
   */
  static async getRelatedProducts(
    productId: string, 
    limit: number = 5
  ): Promise<ProductWithRelations[]> {
    try {
      const product = await this.getProductById(productId);
      
      if (!product.categoryId) {
        return [];
      }

      const { products } = await ProductsDatabase.findProducts({
        categoryId: product.categoryId,
        status: 'active',
        limit,
        page: 1,
      });

      // Excluir o produto atual dos relacionados
      return products.filter(p => p.id !== productId);
    } catch (error) {
      Logger.error(`Erro ao buscar produtos relacionados para ${productId}`, error as Error);
      return [];
    }
  }

  // Métodos auxiliares privados
  private static async validateProductData(
    data: CreateProductDto | UpdateProductDto, 
    excludeId?: string
  ): Promise<void> {
    const errors: string[] = [];

    if ('name' in data && data.name) {
      if (data.name.length < 2) {
        errors.push('Nome deve ter pelo menos 2 caracteres');
      }
      if (data.name.length > 200) {
        errors.push('Nome deve ter no máximo 200 caracteres');
      }
    }

    if ('price' in data && data.price !== undefined) {
      if (data.price < 0) {
        errors.push('Preço não pode ser negativo');
      }
    }

    if ('stock' in data && data.stock !== undefined) {
      if (data.stock < 0) {
        errors.push('Estoque não pode ser negativo');
      }
    }

    if ('tags' in data && data.tags) {
      if (data.tags.length > 20) {
        errors.push('Máximo de 20 tags por produto');
      }
    }

    if (errors.length > 0) {
      throw new ValidationError(errors.join(', ') as any);
    }
  }

  private static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^\w\s-]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, '-') // Substitui espaços por hífens
      .replace(/-+/g, '-') // Remove hífens duplicados
      .trim()
      + '-' + Date.now(); // Adiciona timestamp para garantir unicidade
  }

  private static async validateUniqueSlug(slug: string, excludeId?: string): Promise<void> {
    const query = excludeId 
      ? 'SELECT id FROM products WHERE slug = $1 AND id != $2 AND deleted_at IS NULL'
      : 'SELECT id FROM products WHERE slug = $1 AND deleted_at IS NULL';
    
    const params = excludeId ? [slug, excludeId] : [slug];
    const result = await ProductsDatabase.query(query, params);

    if (result.length > 0) {
      throw new ValidationError('Slug já está em uso' as any);
    }
  }

  private static async validateUniqueSku(sku: string, excludeId?: string): Promise<void> {
    const query = excludeId
      ? 'SELECT id FROM products WHERE sku = $1 AND id != $2 AND deleted_at IS NULL'
      : 'SELECT id FROM products WHERE sku = $1 AND deleted_at IS NULL';
    
    const params = excludeId ? [sku, excludeId] : [sku];
    const result = await ProductsDatabase.query(query, params);

    if (result.length > 0) {
      throw new ValidationError('SKU já está em uso' as any);
    }
  }
}