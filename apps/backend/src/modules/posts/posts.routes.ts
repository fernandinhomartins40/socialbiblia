import { Router } from 'express';
import { PostsController } from './posts.controller';
import { validateQuery, validateRequest } from '../../middleware/validation';
import { createPostSchema, updatePostSchema, queryParamsSchema } from '../../utils/validation';
import { authenticateToken } from '../../middleware/auth';

const router = Router();

/**
 * @swagger
 * /api/posts:
 *   get:
 *     tags: [Posts]
 *     summary: Get all posts
 *     description: Retrieves a paginated list of posts with filtering options
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of posts per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for filtering posts by title or content
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, PUBLISHED, ARCHIVED]
 *         description: Filter posts by status
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter posts by category
 *       - in: query
 *         name: featured
 *         schema:
 *           type: boolean
 *         description: Filter featured posts
 *       - in: query
 *         name: authorId
 *         schema:
 *           type: string
 *         description: Filter posts by author ID
 *     responses:
 *       200:
 *         description: Posts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *             example:
 *               success: true
 *               data:
 *                 - id: "post-id-123"
 *                   title: "Sample Post"
 *                   slug: "sample-post"
 *                   content: "This is a sample post content..."
 *                   excerpt: "Sample excerpt"
 *                   status: "PUBLISHED"
 *                   tags: ["tech", "tutorial"]
 *                   category: "Technology"
 *                   featured: false
 *                   authorId: "user-id-123"
 *                   createdAt: "2024-01-01T00:00:00.000Z"
 *                   updatedAt: "2024-01-01T00:00:00.000Z"
 *                   author:
 *                     id: "user-id-123"
 *                     username: "johndoe"
 *                     firstName: "John"
 *                     lastName: "Doe"
 *               meta:
 *                 page: 1
 *                 limit: 10
 *                 total: 25
 *                 totalPages: 3
 *                 hasNext: true
 *                 hasPrev: false
 *               message: "Posts encontrados"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/', validateQuery(queryParamsSchema), PostsController.getAllPosts);

/**
 * @swagger
 * /api/posts/{id}:
 *   get:
 *     tags: [Posts]
 *     summary: Get post by ID
 *     description: Retrieves a specific post by its ID or slug
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID or slug
 *         example: "post-id-123"
 *     responses:
 *       200:
 *         description: Post retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Post'
 *             example:
 *               success: true
 *               data:
 *                 id: "post-id-123"
 *                 title: "Sample Post"
 *                 slug: "sample-post"
 *                 content: "This is a detailed post content with markdown support..."
 *                 excerpt: "Sample excerpt for the post"
 *                 status: "PUBLISHED"
 *                 tags: ["tech", "tutorial", "programming"]
 *                 category: "Technology"
 *                 featured: true
 *                 authorId: "user-id-123"
 *                 createdAt: "2024-01-01T00:00:00.000Z"
 *                 updatedAt: "2024-01-01T01:00:00.000Z"
 *                 author:
 *                   id: "user-id-123"
 *                   username: "johndoe"
 *                   firstName: "John"
 *                   lastName: "Doe"
 *                   avatar: null
 *               message: "Post encontrado"
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:id', PostsController.getPostById);

/**
 * @swagger
 * /api/posts:
 *   post:
 *     tags: [Posts]
 *     summary: Create new post
 *     description: Creates a new post (requires authentication)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePostDto'
 *           example:
 *             title: "My New Blog Post"
 *             content: "This is the content of my new blog post with **markdown** support."
 *             excerpt: "A brief description of the post"
 *             status: "DRAFT"
 *             tags: ["blog", "tutorial"]
 *             category: "Technology"
 *             featured: false
 *     responses:
 *       201:
 *         description: Post created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Post'
 *             example:
 *               success: true
 *               data:
 *                 id: "post-id-456"
 *                 title: "My New Blog Post"
 *                 slug: "my-new-blog-post"
 *                 content: "This is the content of my new blog post with **markdown** support."
 *                 excerpt: "A brief description of the post"
 *                 status: "DRAFT"
 *                 tags: ["blog", "tutorial"]
 *                 category: "Technology"
 *                 featured: false
 *                 authorId: "user-id-123"
 *                 createdAt: "2024-01-01T02:00:00.000Z"
 *                 updatedAt: "2024-01-01T02:00:00.000Z"
 *                 author:
 *                   id: "user-id-123"
 *                   username: "johndoe"
 *                   firstName: "John"
 *                   lastName: "Doe"
 *               message: "Post criado com sucesso"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/', authenticateToken, validateRequest(createPostSchema), PostsController.createPost);

/**
 * @swagger
 * /api/posts/{id}:
 *   put:
 *     tags: [Posts]
 *     summary: Update post
 *     description: Updates an existing post (author or admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *         example: "post-id-123"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePostDto'
 *           example:
 *             title: "Updated Blog Post Title"
 *             content: "Updated content with new information..."
 *             excerpt: "Updated excerpt"
 *             status: "PUBLISHED"
 *             tags: ["blog", "tutorial", "updated"]
 *             category: "Technology"
 *             featured: true
 *     responses:
 *       200:
 *         description: Post updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Post'
 *             example:
 *               success: true
 *               data:
 *                 id: "post-id-123"
 *                 title: "Updated Blog Post Title"
 *                 slug: "sample-post"
 *                 content: "Updated content with new information..."
 *                 excerpt: "Updated excerpt"
 *                 status: "PUBLISHED"
 *                 tags: ["blog", "tutorial", "updated"]
 *                 category: "Technology"
 *                 featured: true
 *                 authorId: "user-id-123"
 *                 createdAt: "2024-01-01T00:00:00.000Z"
 *                 updatedAt: "2024-01-01T03:00:00.000Z"
 *               message: "Post atualizado com sucesso"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/:id', authenticateToken, validateRequest(updatePostSchema), PostsController.updatePost);

/**
 * @swagger
 * /api/posts/{id}:
 *   delete:
 *     tags: [Posts]
 *     summary: Delete post
 *     description: Soft deletes a post (author or admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID to delete
 *         example: "post-id-123"
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *             example:
 *               success: true
 *               message: "Post deletado com sucesso"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete('/:id', authenticateToken, PostsController.deletePost);

export { router as postsRouter };
