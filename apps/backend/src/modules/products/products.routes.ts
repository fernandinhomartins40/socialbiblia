import { Router } from 'express';
import { ProductsController } from './products.controller';
import { validateQuery, validateRequest, authenticateToken, generalLimiter, createContentLimiter } from '../../core/middlewares';
import auth from '../../middlewares/auth/authenticate';
import { validate } from '../../middlewares/validate_schema/validade_schema';
import rateLimit from '../../middlewares/rate_limiter/rate_limiter';
import { z } from 'zod';

const router = Router();

// Schemas de validação específicos do plugin
const createProductSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(200),
  slug: z.string().optional(),
  description: z.string().optional(),
  shortDescription: z.string().max(500).optional(),
  price: z.number().min(0, 'Preço não pode ser negativo'),
  comparePrice: z.number().min(0).optional(),
  costPrice: z.number().min(0).optional(),
  sku: z.string().max(100).optional(),
  stock: z.number().int().min(0).optional(),
  minStock: z.number().int().min(0).optional(),
  weight: z.number().min(0).optional(),
  dimensions: z.object({
    width: z.number().min(0),
    height: z.number().min(0),
    depth: z.number().min(0),
  }).optional(),
  categoryId: z.string().uuid().optional(),
  brand: z.string().max(100).optional(),
  status: z.enum(['draft', 'active', 'archived']).optional(),
  featured: z.boolean().optional(),
  tags: z.array(z.string()).max(20, 'Máximo de 20 tags').optional(),
  metaTitle: z.string().max(200).optional(),
  metaDescription: z.string().max(300).optional(),
  images: z.array(z.object({
    url: z.string().url(),
    alt: z.string().optional(),
    position: z.number().int().min(0),
    isMain: z.boolean(),
  })).optional(),
  attributes: z.record(z.any()).optional(),
  isDigital: z.boolean().optional(),
  requiresShipping: z.boolean().optional(),
});

const updateProductSchema = createProductSchema.partial();

const queryParamsSchema = z.object({
  page: z.string().transform(val => parseInt(val)).pipe(z.number().int().min(1)).optional(),
  limit: z.string().transform(val => parseInt(val)).pipe(z.number().int().min(1).max(100)).optional(),
  search: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  status: z.enum(['draft', 'active', 'archived']).optional(),
  featured: z.string().transform(val => val === 'true').pipe(z.boolean()).optional(),
});

/**
 * @swagger
 * /api/products:
 *   get:
 *     tags: [Products]
 *     summary: Listar produtos
 *     description: Lista produtos com filtros e paginação
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nome ou descrição
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, active, archived]
 *       - in: query
 *         name: featured
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Produtos encontrados
 */
router.get('/', generalLimiter, validateQuery(queryParamsSchema), ProductsController.getProducts);

/**
 * @swagger
 * /api/products/my:
 *   get:
 *     tags: [Products]
 *     summary: Meus produtos
 *     description: Lista produtos do usuário autenticado
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *     responses:
 *       200:
 *         description: Seus produtos
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/my', authenticateToken, validateQuery(queryParamsSchema), ProductsController.getMyProducts);

/**
 * @swagger
 * /api/products/featured:
 *   get:
 *     tags: [Products]
 *     summary: Produtos em destaque
 *     description: Lista produtos marcados como destaque
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *     responses:
 *       200:
 *         description: Produtos em destaque
 */
router.get('/featured', generalLimiter, ProductsController.getFeaturedProducts);

/**
 * @swagger
 * /api/products/stats:
 *   get:
 *     tags: [Products]
 *     summary: Estatísticas de produtos (Admin)
 *     description: Estatísticas gerais dos produtos
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estatísticas
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/stats', authenticateToken, ProductsController.getProductStats);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Buscar produto por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Produto encontrado
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id', generalLimiter, ProductsController.getProductById);

/**
 * @swagger
 * /api/products/slug/{slug}:
 *   get:
 *     tags: [Products]
 *     summary: Buscar produto por slug
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Produto encontrado
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/slug/:slug', generalLimiter, ProductsController.getProductBySlug);

/**
 * @swagger
 * /api/products/{id}/related:
 *   get:
 *     tags: [Products]
 *     summary: Produtos relacionados
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           default: 5
 *     responses:
 *       200:
 *         description: Produtos relacionados
 */
router.get('/:id/related', generalLimiter, ProductsController.getRelatedProducts);

/**
 * @swagger
 * /api/products:
 *   post:
 *     tags: [Products]
 *     summary: Criar produto
 *     description: Cria um novo produto
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, price]
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 200
 *               price:
 *                 type: number
 *                 minimum: 0
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [draft, active, archived]
 *                 default: draft
 *               featured:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Produto criado
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/', 
  authenticateToken, 
  createContentLimiter, 
  validateRequest(createProductSchema), 
  ProductsController.createProduct
);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     tags: [Products]
 *     summary: Atualizar produto
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 200
 *               price:
 *                 type: number
 *                 minimum: 0
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [draft, active, archived]
 *               featured:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Produto atualizado
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put('/:id', 
  authenticateToken, 
  validateRequest(updateProductSchema), 
  ProductsController.updateProduct
);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     tags: [Products]
 *     summary: Deletar produto
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Produto deletado
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/:id', authenticateToken, ProductsController.deleteProduct);

export { router as productsRouter };