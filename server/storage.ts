import {
  users,
  posts,
  comments,
  likes,
  follows,
  communities,
  communityMemberships,
  aiInteractions,
  biblicalVerses,
  type User,
  type UpsertUser,
  type InsertPost,
  type Post,
  type PostWithUser,
  type InsertComment,
  type Comment,
  type Community,
  type InsertCommunity,
  type AIInteraction,
  type InsertAIInteraction,
  type BiblicalVerse,
  type UserWithStats,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, ilike, sql, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserWithStats(id: string): Promise<UserWithStats | undefined>;
  updateUserProfile(id: string, data: Partial<User>): Promise<User>;
  
  // Post operations
  createPost(post: InsertPost): Promise<Post>;
  getPosts(userId?: string, limit?: number, offset?: number): Promise<PostWithUser[]>;
  getPost(id: string): Promise<PostWithUser | undefined>;
  deletePost(id: string, userId: string): Promise<boolean>;
  
  // Comment operations
  createComment(comment: InsertComment): Promise<Comment>;
  getComments(postId: string): Promise<(Comment & { user: User })[]>;
  
  // Like operations
  toggleLike(postId: string, userId: string): Promise<boolean>;
  
  // Follow operations
  toggleFollow(followerId: string, followingId: string): Promise<boolean>;
  getFollowers(userId: string): Promise<User[]>;
  getFollowing(userId: string): Promise<User[]>;
  
  // Community operations
  getCommunities(): Promise<Community[]>;
  createCommunity(community: InsertCommunity): Promise<Community>;
  joinCommunity(communityId: string, userId: string): Promise<boolean>;
  
  // AI operations
  createAIInteraction(interaction: InsertAIInteraction): Promise<AIInteraction>;
  getAIInteractions(userId: string, limit?: number): Promise<AIInteraction[]>;
  updateAIFeedback(id: string, feedback: string): Promise<void>;
  
  // Biblical verse operations
  searchVerses(emotion: string, keywords?: string[]): Promise<BiblicalVerse[]>;
  getRandomVerse(): Promise<BiblicalVerse | undefined>;
  initializeBiblicalDatabase(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUserWithStats(id: string): Promise<UserWithStats | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    if (!user) return undefined;

    const [followersCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(follows)
      .where(eq(follows.followingId, id));

    const [followingCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(follows)
      .where(eq(follows.followerId, id));

    const [postsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(posts)
      .where(eq(posts.userId, id));

    return {
      ...user,
      _count: {
        followers: followersCount.count,
        following: followingCount.count,
        posts: postsCount.count,
      },
    };
  }

  async updateUserProfile(id: string, data: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async createPost(post: InsertPost): Promise<Post> {
    const [newPost] = await db.insert(posts).values(post).returning();
    return newPost;
  }

  async getPosts(userId?: string, limit = 20, offset = 0): Promise<PostWithUser[]> {
    const postsQuery = db
      .select({
        id: posts.id,
        userId: posts.userId,
        content: posts.content,
        imageUrl: posts.imageUrl,
        verseReference: posts.verseReference,
        verseText: posts.verseText,
        type: posts.type,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          denomination: users.denomination,
          favoriteVerse: users.favoriteVerse,
          bio: users.bio,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
      })
      .from(posts)
      .leftJoin(users, eq(posts.userId, users.id))
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);

    if (userId) {
      postsQuery.where(eq(posts.userId, userId));
    }

    const postsResult = await postsQuery;

    // Get comments and likes for each post
    const postsWithExtras = await Promise.all(
      postsResult.map(async (post) => {
        const commentsResult = await db
          .select({
            id: comments.id,
            postId: comments.postId,
            userId: comments.userId,
            content: comments.content,
            createdAt: comments.createdAt,
            user: {
              id: users.id,
              email: users.email,
              firstName: users.firstName,
              lastName: users.lastName,
              profileImageUrl: users.profileImageUrl,
              denomination: users.denomination,
              favoriteVerse: users.favoriteVerse,
              bio: users.bio,
              createdAt: users.createdAt,
              updatedAt: users.updatedAt,
            },
          })
          .from(comments)
          .leftJoin(users, eq(comments.userId, users.id))
          .where(eq(comments.postId, post.id))
          .orderBy(desc(comments.createdAt));

        const likesResult = await db
          .select({ userId: likes.userId })
          .from(likes)
          .where(eq(likes.postId, post.id));

        const [likesCount] = await db
          .select({ count: sql<number>`count(*)` })
          .from(likes)
          .where(eq(likes.postId, post.id));

        const [commentsCount] = await db
          .select({ count: sql<number>`count(*)` })
          .from(comments)
          .where(eq(comments.postId, post.id));

        return {
          ...post,
          comments: commentsResult,
          likes: likesResult,
          _count: {
            likes: likesCount.count,
            comments: commentsCount.count,
          },
        };
      })
    );

    return postsWithExtras;
  }

  async getPost(id: string): Promise<PostWithUser | undefined> {
    const [post] = await this.getPosts(undefined, 1, 0);
    return post;
  }

  async deletePost(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(posts)
      .where(and(eq(posts.id, id), eq(posts.userId, userId)));
    return result.rowCount > 0;
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const [newComment] = await db.insert(comments).values(comment).returning();
    return newComment;
  }

  async getComments(postId: string): Promise<(Comment & { user: User })[]> {
    const result = await db
      .select({
        id: comments.id,
        postId: comments.postId,
        userId: comments.userId,
        content: comments.content,
        createdAt: comments.createdAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          denomination: users.denomination,
          favoriteVerse: users.favoriteVerse,
          bio: users.bio,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.postId, postId))
      .orderBy(desc(comments.createdAt));

    return result;
  }

  async toggleLike(postId: string, userId: string): Promise<boolean> {
    const existingLike = await db
      .select()
      .from(likes)
      .where(and(eq(likes.postId, postId), eq(likes.userId, userId)));

    if (existingLike.length > 0) {
      await db
        .delete(likes)
        .where(and(eq(likes.postId, postId), eq(likes.userId, userId)));
      return false;
    } else {
      await db.insert(likes).values({ postId, userId });
      return true;
    }
  }

  async toggleFollow(followerId: string, followingId: string): Promise<boolean> {
    if (followerId === followingId) return false;

    const existingFollow = await db
      .select()
      .from(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));

    if (existingFollow.length > 0) {
      await db
        .delete(follows)
        .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
      return false;
    } else {
      await db.insert(follows).values({ followerId, followingId });
      return true;
    }
  }

  async getFollowers(userId: string): Promise<User[]> {
    const result = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        denomination: users.denomination,
        favoriteVerse: users.favoriteVerse,
        bio: users.bio,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(follows)
      .leftJoin(users, eq(follows.followerId, users.id))
      .where(eq(follows.followingId, userId));

    return result;
  }

  async getFollowing(userId: string): Promise<User[]> {
    const result = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        denomination: users.denomination,
        favoriteVerse: users.favoriteVerse,
        bio: users.bio,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(follows)
      .leftJoin(users, eq(follows.followingId, users.id))
      .where(eq(follows.followerId, userId));

    return result;
  }

  async getCommunities(): Promise<Community[]> {
    return await db.select().from(communities).orderBy(desc(communities.memberCount));
  }

  async createCommunity(community: InsertCommunity): Promise<Community> {
    const [newCommunity] = await db.insert(communities).values(community).returning();
    return newCommunity;
  }

  async joinCommunity(communityId: string, userId: string): Promise<boolean> {
    const existingMembership = await db
      .select()
      .from(communityMemberships)
      .where(and(eq(communityMemberships.communityId, communityId), eq(communityMemberships.userId, userId)));

    if (existingMembership.length > 0) {
      return false;
    }

    await db.insert(communityMemberships).values({ communityId, userId });
    
    // Update member count
    await db
      .update(communities)
      .set({ memberCount: sql`${communities.memberCount} + 1` })
      .where(eq(communities.id, communityId));

    return true;
  }

  async createAIInteraction(interaction: InsertAIInteraction): Promise<AIInteraction> {
    const [newInteraction] = await db.insert(aiInteractions).values(interaction).returning();
    return newInteraction;
  }

  async getAIInteractions(userId: string, limit = 10): Promise<AIInteraction[]> {
    return await db
      .select()
      .from(aiInteractions)
      .where(eq(aiInteractions.userId, userId))
      .orderBy(desc(aiInteractions.createdAt))
      .limit(limit);
  }

  async updateAIFeedback(id: string, feedback: string): Promise<void> {
    await db
      .update(aiInteractions)
      .set({ feedback })
      .where(eq(aiInteractions.id, id));
  }

  async searchVerses(emotion: string, keywords: string[] = []): Promise<BiblicalVerse[]> {
    let query = db.select().from(biblicalVerses);

    if (emotion) {
      query = query.where(sql`${emotion} = ANY(${biblicalVerses.emotions})`);
    }

    if (keywords.length > 0) {
      const keywordConditions = keywords.map(keyword => 
        sql`${keyword} = ANY(${biblicalVerses.keywords})`
      );
      query = query.where(or(...keywordConditions));
    }

    return await query.limit(5);
  }

  async getRandomVerse(): Promise<BiblicalVerse | undefined> {
    const [verse] = await db
      .select()
      .from(biblicalVerses)
      .orderBy(sql`RANDOM()`)
      .limit(1);
    return verse;
  }

  async initializeBiblicalDatabase(): Promise<void> {
    // Check if verses already exist
    const [existingVerses] = await db
      .select({ count: sql<number>`count(*)` })
      .from(biblicalVerses);

    if (existingVerses.count > 0) {
      return; // Already initialized
    }

    // Sample biblical verses with emotion and keyword mapping
    const sampleVerses = [
      {
        book: "Filipenses",
        chapter: 4,
        verse: 6,
        text: "Não andem ansiosos por coisa alguma, mas em tudo, pela oração e súplicas, e com ação de graças, apresentem seus pedidos a Deus.",
        translation: "NVI",
        emotions: ["ansiedade", "preocupação", "medo"],
        keywords: ["oração", "paz", "confiança", "descanso"],
      },
      {
        book: "Filipenses",
        chapter: 4,
        verse: 13,
        text: "Posso todas as coisas naquele que me fortalece.",
        translation: "NVI",
        emotions: ["força", "esperança", "confiança"],
        keywords: ["força", "capacidade", "superação", "vitória"],
      },
      {
        book: "Salmos",
        chapter: 23,
        verse: 1,
        text: "O Senhor é o meu pastor; nada me faltará.",
        translation: "NVI",
        emotions: ["paz", "confiança", "segurança"],
        keywords: ["cuidado", "provisão", "proteção", "descanso"],
      },
      {
        book: "Isaías",
        chapter: 41,
        verse: 10,
        text: "Não temas, porque eu sou contigo; não te assombres, porque eu sou o teu Deus; eu te fortaleço, e te ajudo, e te sustento com a minha destra fiel.",
        translation: "NVI",
        emotions: ["medo", "ansiedade", "insegurança"],
        keywords: ["força", "ajuda", "proteção", "coragem"],
      },
      {
        book: "Jeremias",
        chapter: 29,
        verse: 11,
        text: "Porque eu bem sei os pensamentos que tenho a vosso respeito, diz o Senhor; pensamentos de paz e não de mal, para vos dar o fim que esperais.",
        translation: "NVI",
        emotions: ["esperança", "paz", "futuro"],
        keywords: ["planos", "futuro", "esperança", "propósito"],
      },
      {
        book: "Salmos",
        chapter: 34,
        verse: 18,
        text: "Perto está o Senhor dos que têm o coração quebrantado e salva os contritos de espírito.",
        translation: "NVI",
        emotions: ["tristeza", "luto", "solidão"],
        keywords: ["consolação", "cura", "proximidade", "salvação"],
      },
      {
        book: "Romanos",
        chapter: 8,
        verse: 28,
        text: "Sabemos que Deus age em todas as coisas para o bem daqueles que o amam, dos que foram chamados de acordo com o seu propósito.",
        translation: "NVI",
        emotions: ["esperança", "confiança", "propósito"],
        keywords: ["propósito", "bem", "planos", "chamado"],
      },
      {
        book: "2 Coríntios",
        chapter: 12,
        verse: 9,
        text: "Mas ele me disse: 'Minha graça é suficiente para você, pois o meu poder se aperfeiçoa na fraqueza.' Portanto, eu me gloriarei ainda mais alegremente em minhas fraquezas, para que o poder de Cristo repouse em mim.",
        translation: "NVI",
        emotions: ["fraqueza", "força", "graça"],
        keywords: ["graça", "poder", "fraqueza", "suficiência"],
      },
      {
        book: "Salmos",
        chapter: 118,
        verse: 24,
        text: "Este é o dia que o Senhor fez; regozijemo-nos e alegremo-nos nele.",
        translation: "NVI",
        emotions: ["alegria", "gratidão", "celebração"],
        keywords: ["alegria", "gratidão", "dia", "regozijo"],
      },
      {
        book: "1 João",
        chapter: 4,
        verse: 19,
        text: "Nós amamos porque ele nos amou primeiro.",
        translation: "NVI",
        emotions: ["amor", "relacionamentos", "gratidão"],
        keywords: ["amor", "relacionamento", "primeiro", "resposta"],
      },
    ];

    await db.insert(biblicalVerses).values(sampleVerses);
  }
}

export const storage = new DatabaseStorage();
