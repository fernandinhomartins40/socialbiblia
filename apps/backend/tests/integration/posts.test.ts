import request from 'supertest';
import { app } from '../../src/server/app';
import { prisma } from '../../src/database';

describe('Posts Integration Tests', () => {
  let token: string;
  let userId: string;

  beforeEach(async () => {
    await prisma.user.deleteMany();
    await prisma.post.deleteMany();

    // Create test user and get token
    const userResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'Test123!@#',
        name: 'Test User',
      });

    token = userResponse.body.token;
    userId = userResponse.body.user.id;
  });

  describe('POST /api/posts', () => {
    it('should create a new post', async () => {
      const postData = {
        title: 'Test Post',
        content: 'This is a test post content',
        tags: ['test', 'integration'],
      };

      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${token}`)
        .send(postData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(postData.title);
      expect(response.body.authorId).toBe(userId);
    });

    it('should not create post without authentication', async () => {
      const response = await request(app)
        .post('/api/posts')
        .send({ title: 'Test', content: 'Content' })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/posts', () => {
    beforeEach(async () => {
      // Create test posts
      await prisma.post.createMany({
        data: [
          {
            title: 'Post 1',
            content: 'Content 1',
            authorId: userId,
            published: true,
          },
          {
            title: 'Post 2',
            content: 'Content 2',
            authorId: userId,
            published: true,
          },
        ],
      });
    });

    it('should get all posts with pagination', async () => {
      const response = await request(app)
        .get('/api/posts?page=1&limit=10')
        .expect(200);

      expect(response.body).toHaveProperty('posts');
      expect(response.body).toHaveProperty('total');
      expect(response.body.posts).toHaveLength(2);
    });

    it('should search posts by title', async () => {
      const response = await request(app)
        .get('/api/posts?search=Post 1')
        .expect(200);

      expect(response.body.posts).toHaveLength(1);
      expect(response.body.posts[0].title).toBe('Post 1');
    });
  });

  describe('GET /api/posts/:id', () => {
    let postId: string;

    beforeEach(async () => {
      const post = await prisma.post.create({
        data: {
          title: 'Test Post',
          content: 'Test Content',
          authorId: userId,
          published: true,
        },
      });
      postId = post.id;
    });

    it('should get post by id', async () => {
      const response = await request(app)
        .get(`/api/posts/${postId}`)
        .expect(200);

      expect(response.body.id).toBe(postId);
      expect(response.body.title).toBe('Test Post');
    });

    it('should return 404 for non-existent post', async () => {
      await request(app)
        .get('/api/posts/non-existent-id')
        .expect(404);
    });
  });

  describe('PUT /api/posts/:id', () => {
    let postId: string;

    beforeEach(async () => {
      const post = await prisma.post.create({
        data: {
          title: 'Original Title',
          content: 'Original Content',
          authorId: userId,
          published: true,
        },
      });
      postId = post.id;
    });

    it('should update own post', async () => {
      const response = await request(app)
        .put(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Updated Title' })
        .expect(200);

      expect(response.body.title).toBe('Updated Title');
    });

    it('should not update others post', async () => {
      // Create another user
      const otherUser = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'other@example.com',
          password: 'Test123!@#',
          name: 'Other User',
        });

      const otherToken = otherUser.body.token;

      await request(app)
        .put(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ title: 'Hacked Title' })
        .expect(403);
    });
  });

  describe('DELETE /api/posts/:id', () => {
    let postId: string;

    beforeEach(async () => {
      const post = await prisma.post.create({
        data: {
          title: 'To Delete',
          content: 'Content to delete',
          authorId: userId,
          published: true,
        },
      });
      postId = post.id;
    });

    it('should delete own post', async () => {
      await request(app)
        .delete(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204);

      const deletedPost = await prisma.post.findUnique({
        where: { id: postId },
      });
      expect(deletedPost).toBeNull();
    });
  });
});
