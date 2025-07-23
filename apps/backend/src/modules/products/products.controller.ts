import { Request, Response } from 'express';
import { ProductsService } from './products.service';
import { ResponseUtil } from '../../utils/responses';
import { Logger } from '../../utils/logger';
import { ProductFilters, CreateProductDto, UpdateProductDto, ProductStatus } from './types';

export class ProductsController {
  /**
   * Listar produtos com filtros e paginação
   * GET /api/products
   */
  static async getProducts(req: Request, res: Response): Promise<void> {
    try {
      const filters: ProductFilters = {
        search: req.query.search as string,
        categoryId: req.query.categoryId as string,
        userId: req.query.userId as string,
        status: req.query.status as any,
        featured: req.query.featured === 'true',
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
      };

      const result = await ProductsService.getProducts(filters);

      res.json(ResponseUtil.paginated(
        result.products,
        result.page,
        result.limit,
        result.total
      ));
    } catch (error) {
      Logger.error('Erro no controller getProducts', error as Error);
      res.status(500).json(ResponseUtil.error('Erro interno do servidor'));
    }
  }

  /**
   * Buscar produto por ID
   * GET /api/products/:id
   */
  static async getProductById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json(ResponseUtil.error('ID é obrigatório'));
        return;
      }
      const product = await ProductsService.getProductById(id);

      res.json(ResponseUtil.success(product, 'Produto encontrado'));
    } catch (error) {
      Logger.error('Erro no controller getProductById', error as Error);
      
      if ((error as any).name === 'NotFoundError') {
        res.status(404).json(ResponseUtil.error('Produto não encontrado'));
      } else {
        res.status(500).json(ResponseUtil.error('Erro interno do servidor'));
      }
    }
  }

  /**
   * Buscar produto por slug
   * GET /api/products/slug/:slug
   */
  static async getProductBySlug(req: Request, res: Response): Promise<void> {
    try {
      const { slug } = req.params;
      if (!slug) {
        res.status(400).json(ResponseUtil.error('Slug é obrigatório'));
        return;
      }
      const product = await ProductsService.getProductBySlug(slug);

      res.json(ResponseUtil.success(product, 'Produto encontrado'));
    } catch (error) {
      Logger.error('Erro no controller getProductBySlug', error as Error);
      
      if ((error as any).name === 'NotFoundError') {
        res.status(404).json(ResponseUtil.error('Produto não encontrado'));
      } else {
        res.status(500).json(ResponseUtil.error('Erro interno do servidor'));
      }
    }
  }

  /**
   * Criar novo produto
   * POST /api/products
   */
  static async createProduct(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json(ResponseUtil.error('Usuário não autenticado'));
        return;
      }

      const productData: CreateProductDto = req.body;
      const product = await ProductsService.createProduct(productData, userId);

      res.status(201).json(ResponseUtil.success(product, 'Produto criado com sucesso'));
    } catch (error) {
      Logger.error('Erro no controller createProduct', error as Error);
      
      if ((error as any).name === 'ValidationError') {
        res.status(400).json(ResponseUtil.error((error as Error).message));
      } else {
        res.status(500).json(ResponseUtil.error('Erro interno do servidor'));
      }
    }
  }

  /**
   * Atualizar produto
   * PUT /api/products/:id
   */
  static async updateProduct(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json(ResponseUtil.error('ID é obrigatório'));
        return;
      }
      const userId = (req as any).user?.userId;
      const userRole = (req as any).user?.role || 'USER';

      if (!userId) {
        res.status(401).json(ResponseUtil.error('Usuário não autenticado'));
        return;
      }

      const updateData: UpdateProductDto = req.body;
      const product = await ProductsService.updateProduct(id, updateData, userId, userRole);

      res.json(ResponseUtil.success(product, 'Produto atualizado com sucesso'));
    } catch (error) {
      Logger.error('Erro no controller updateProduct', error as Error);
      
      if ((error as any).name === 'NotFoundError') {
        res.status(404).json(ResponseUtil.error('Produto não encontrado'));
      } else if ((error as any).name === 'ForbiddenError') {
        res.status(403).json(ResponseUtil.error((error as Error).message));
      } else if ((error as any).name === 'ValidationError') {
        res.status(400).json(ResponseUtil.error((error as Error).message));
      } else {
        res.status(500).json(ResponseUtil.error('Erro interno do servidor'));
      }
    }
  }

  /**
   * Deletar produto
   * DELETE /api/products/:id
   */
  static async deleteProduct(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json(ResponseUtil.error('ID é obrigatório'));
        return;
      }
      const userId = (req as any).user?.userId;
      const userRole = (req as any).user?.role || 'USER';

      if (!userId) {
        res.status(401).json(ResponseUtil.error('Usuário não autenticado'));
        return;
      }

      await ProductsService.deleteProduct(id, userId, userRole);

      res.json(ResponseUtil.success(null, 'Produto deletado com sucesso'));
    } catch (error) {
      Logger.error('Erro no controller deleteProduct', error as Error);
      
      if ((error as any).name === 'NotFoundError') {
        res.status(404).json(ResponseUtil.error('Produto não encontrado'));
      } else if ((error as any).name === 'ForbiddenError') {
        res.status(403).json(ResponseUtil.error((error as Error).message));
      } else {
        res.status(500).json(ResponseUtil.error('Erro interno do servidor'));
      }
    }
  }

  /**
   * Buscar produtos do usuário autenticado
   * GET /api/products/my
   */
  static async getMyProducts(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json(ResponseUtil.error('Usuário não autenticado'));
        return;
      }

      const filters: Omit<ProductFilters, 'userId'> = {
        search: req.query.search as string,
        categoryId: req.query.categoryId as string,
        status: req.query.status as any,
        featured: req.query.featured === 'true',
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
      };

      const result = await ProductsService.getUserProducts(userId, filters);

      res.json(ResponseUtil.paginated(
        result.products,
        result.page,
        result.limit,
        result.total
      ));
    } catch (error) {
      Logger.error('Erro no controller getMyProducts', error as Error);
      res.status(500).json(ResponseUtil.error('Erro interno do servidor'));
    }
  }

  /**
   * Buscar produtos em destaque
   * GET /api/products/featured
   */
  static async getFeaturedProducts(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const products = await ProductsService.getFeaturedProducts(limit);

      res.json(ResponseUtil.success(products, 'Produtos em destaque'));
    } catch (error) {
      Logger.error('Erro no controller getFeaturedProducts', error as Error);
      res.status(500).json(ResponseUtil.error('Erro interno do servidor'));
    }
  }

  /**
   * Buscar produtos relacionados
   * GET /api/products/:id/related
   */
  static async getRelatedProducts(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json(ResponseUtil.error('ID é obrigatório'));
        return;
      }
      const limit = parseInt(req.query.limit as string) || 5;
      
      const products = await ProductsService.getRelatedProducts(id, limit);

      res.json(ResponseUtil.success(products, 'Produtos relacionados'));
    } catch (error) {
      Logger.error('Erro no controller getRelatedProducts', error as Error);
      res.status(500).json(ResponseUtil.error('Erro interno do servidor'));
    }
  }

  /**
   * Estatísticas do plugin (para admins)
   * GET /api/products/stats
   */
  static async getProductStats(req: Request, res: Response): Promise<void> {
    try {
      const userRole = (req as any).user?.role;
      if (userRole !== 'ADMIN') {
        res.status(403).json(ResponseUtil.error('Acesso negado'));
        return;
      }

      // Buscar estatísticas básicas
      const totalProducts = await ProductsService.getProducts({ limit: 1 });
      const activeProducts = await ProductsService.getProducts({ status: ProductStatus.ACTIVE, limit: 1 });
      const featuredProducts = await ProductsService.getProducts({ featured: true, limit: 1 });

      const stats = {
        total: totalProducts.total,
        active: activeProducts.total,
        featured: featuredProducts.total,
        draft: totalProducts.total - activeProducts.total,
      };

      res.json(ResponseUtil.success(stats, 'Estatísticas de produtos'));
    } catch (error) {
      Logger.error('Erro no controller getProductStats', error as Error);
      res.status(500).json(ResponseUtil.error('Erro interno do servidor'));
    }
  }
}