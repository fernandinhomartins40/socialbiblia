import {
  users,
  posts,
  comments,
  likes,
  follows,
  communities,
  communityMemberships,
  aiInteractions,
  biblicalBooks,
  biblicalChapters,
  biblicalVerses,
  biblicalBookmarks,
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
  type BiblicalBook,
  type InsertBiblicalBook,
  type BiblicalChapter,
  type InsertBiblicalChapter,
  type BiblicalVerse,
  type InsertBiblicalVerse,
  type BiblicalBookmark,
  type InsertBiblicalBookmark,
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
  
  // Biblical operations
  getBiblicalBooks(): Promise<BiblicalBook[]>;
  getBiblicalBook(id: string): Promise<BiblicalBook | undefined>;
  createBiblicalBook(book: InsertBiblicalBook): Promise<BiblicalBook>;
  getBiblicalChapters(bookId: string): Promise<BiblicalChapter[]>;
  createBiblicalChapter(chapter: InsertBiblicalChapter): Promise<BiblicalChapter>;
  getBiblicalVerses(bookId?: string, chapter?: number): Promise<BiblicalVerse[]>;
  createBiblicalVerse(verse: InsertBiblicalVerse): Promise<BiblicalVerse>;
  searchVerses(emotion: string, keywords?: string[]): Promise<BiblicalVerse[]>;
  searchBibleText(query: string, maxResults?: number): Promise<BiblicalVerse[]>;
  getRandomVerse(): Promise<BiblicalVerse | undefined>;
  
  // Bookmarks
  createBookmark(bookmark: InsertBiblicalBookmark): Promise<BiblicalBookmark>;
  getUserBookmarks(userId: string): Promise<BiblicalBookmark[]>;
  deleteBookmark(id: string, userId: string): Promise<boolean>;
  
  // Bible initialization
  initializeBiblicalDatabase(): Promise<void>;
  importBibleFromPDF(): Promise<void>;
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
    // Allow "all" to get interactions from all users for ML training
    if (userId === "all") {
      return await db
        .select()
        .from(aiInteractions)
        .orderBy(desc(aiInteractions.createdAt))
        .limit(limit);
    }
    
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

  async searchBibleText(query: string, maxResults = 10): Promise<BiblicalVerse[]> {
    const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 2);
    
    if (searchTerms.length === 0) {
      return await db.select().from(biblicalVerses).limit(maxResults);
    }

    const textSearchConditions = searchTerms.map(term => 
      sql`LOWER(${biblicalVerses.text}) LIKE ${'%' + term + '%'}`
    );

    const bookSearchConditions = searchTerms.map(term => 
      sql`LOWER(${biblicalVerses.book}) LIKE ${'%' + term + '%'}`
    );

    return await db
      .select()
      .from(biblicalVerses)
      .where(or(...textSearchConditions, ...bookSearchConditions))
      .limit(maxResults);
  }

  async getRandomVerse(): Promise<BiblicalVerse | undefined> {
    const [verse] = await db
      .select()
      .from(biblicalVerses)
      .orderBy(sql`RANDOM()`)
      .limit(1);
    return verse;
  }

  // Biblical book operations
  async getBiblicalBooks(): Promise<BiblicalBook[]> {
    return await db.select().from(biblicalBooks).orderBy(biblicalBooks.order);
  }

  async getBiblicalBook(id: string): Promise<BiblicalBook | undefined> {
    const [book] = await db.select().from(biblicalBooks).where(eq(biblicalBooks.id, id));
    return book;
  }

  async createBiblicalBook(book: InsertBiblicalBook): Promise<BiblicalBook> {
    const [newBook] = await db.insert(biblicalBooks).values(book).returning();
    return newBook;
  }

  // Biblical chapter operations
  async getBiblicalChapters(bookId: string): Promise<BiblicalChapter[]> {
    return await db.select().from(biblicalChapters)
      .where(eq(biblicalChapters.bookId, bookId))
      .orderBy(biblicalChapters.chapterNumber);
  }

  async createBiblicalChapter(chapter: InsertBiblicalChapter): Promise<BiblicalChapter> {
    const [newChapter] = await db.insert(biblicalChapters).values(chapter).returning();
    return newChapter;
  }

  // Biblical verse operations
  async getBiblicalVerses(bookId?: string, chapter?: number): Promise<BiblicalVerse[]> {
    let query = db.select().from(biblicalVerses);
    
    if (bookId && chapter) {
      query = query.where(and(
        eq(biblicalVerses.bookId, bookId),
        eq(biblicalVerses.chapter, chapter)
      ));
    } else if (bookId) {
      query = query.where(eq(biblicalVerses.bookId, bookId));
    }
    
    return await query.orderBy(biblicalVerses.chapter, biblicalVerses.verse);
  }

  async createBiblicalVerse(verse: InsertBiblicalVerse): Promise<BiblicalVerse> {
    const [newVerse] = await db.insert(biblicalVerses).values(verse).returning();
    return newVerse;
  }

  // Bookmark operations
  async createBookmark(bookmark: InsertBiblicalBookmark): Promise<BiblicalBookmark> {
    const [newBookmark] = await db.insert(biblicalBookmarks).values(bookmark).returning();
    return newBookmark;
  }

  async getUserBookmarks(userId: string): Promise<BiblicalBookmark[]> {
    return await db.select().from(biblicalBookmarks)
      .where(eq(biblicalBookmarks.userId, userId))
      .orderBy(desc(biblicalBookmarks.createdAt));
  }

  async deleteBookmark(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(biblicalBookmarks)
      .where(and(
        eq(biblicalBookmarks.id, id),
        eq(biblicalBookmarks.userId, userId)
      ));
    return (result.rowCount || 0) > 0;
  }

  async importBibleFromPDF(): Promise<void> {
    console.log("Initializing complete Bible database from PDF...");

    // Check if books already exist
    const [existingBooks] = await db
      .select({ count: sql<number>`count(*)` })
      .from(biblicalBooks);

    if (existingBooks.count > 0) {
      console.log("Bible database already initialized");
      return;
    }

    // Initialize biblical books structure based on PDF content
    const biblicalBooksData = [
      // Old Testament
      { name: "Gênesis", abbreviation: "Gên.", testament: "old", order: 1, chapters: 50 },
      { name: "Êxodo", abbreviation: "Êx.", testament: "old", order: 2, chapters: 40 },
      { name: "Levítico", abbreviation: "Lev.", testament: "old", order: 3, chapters: 27 },
      { name: "Números", abbreviation: "Núm.", testament: "old", order: 4, chapters: 36 },
      { name: "Deuteronômio", abbreviation: "Deut.", testament: "old", order: 5, chapters: 34 },
      { name: "Josué", abbreviation: "Jos.", testament: "old", order: 6, chapters: 24 },
      { name: "Juízes", abbreviation: "Juí.", testament: "old", order: 7, chapters: 21 },
      { name: "Rute", abbreviation: "Rut.", testament: "old", order: 8, chapters: 4 },
      { name: "1 Samuel", abbreviation: "1 Sam.", testament: "old", order: 9, chapters: 31 },
      { name: "2 Samuel", abbreviation: "2 Sam.", testament: "old", order: 10, chapters: 24 },
      { name: "1 Reis", abbreviation: "1 Re.", testament: "old", order: 11, chapters: 22 },
      { name: "2 Reis", abbreviation: "2 Re.", testament: "old", order: 12, chapters: 25 },
      { name: "1 Crônicas", abbreviation: "1 Crôn.", testament: "old", order: 13, chapters: 29 },
      { name: "2 Crônicas", abbreviation: "2 Crôn.", testament: "old", order: 14, chapters: 36 },
      { name: "Esdras", abbreviation: "Esd.", testament: "old", order: 15, chapters: 10 },
      { name: "Neemias", abbreviation: "Ne.", testament: "old", order: 16, chapters: 13 },
      { name: "Ester", abbreviation: "Est.", testament: "old", order: 17, chapters: 10 },
      { name: "Jó", abbreviation: "Jó", testament: "old", order: 18, chapters: 42 },
      { name: "Salmos", abbreviation: "Salm.", testament: "old", order: 19, chapters: 150 },
      { name: "Provérbios", abbreviation: "Prov.", testament: "old", order: 20, chapters: 31 },
      { name: "Eclesiastes", abbreviation: "Ecles.", testament: "old", order: 21, chapters: 12 },
      { name: "Cantares de Salomão", abbreviation: "Cant.", testament: "old", order: 22, chapters: 8 },
      { name: "Isaías", abbreviation: "Isa.", testament: "old", order: 23, chapters: 66 },
      { name: "Jeremias", abbreviation: "Jer.", testament: "old", order: 24, chapters: 52 },
      { name: "Lamentações", abbreviation: "Lam.", testament: "old", order: 25, chapters: 5 },
      { name: "Ezequiel", abbreviation: "Eze.", testament: "old", order: 26, chapters: 48 },
      { name: "Daniel", abbreviation: "Dan.", testament: "old", order: 27, chapters: 12 },
      { name: "Oseias", abbreviation: "Ose.", testament: "old", order: 28, chapters: 14 },
      { name: "Joel", abbreviation: "Joel", testament: "old", order: 29, chapters: 3 },
      { name: "Amós", abbreviation: "Amós", testament: "old", order: 30, chapters: 9 },
      { name: "Obadias", abbreviation: "Oba.", testament: "old", order: 31, chapters: 1 },
      { name: "Jonas", abbreviation: "Jon.", testament: "old", order: 32, chapters: 4 },
      { name: "Miqueias", abbreviation: "Miq.", testament: "old", order: 33, chapters: 7 },
      { name: "Naum", abbreviation: "Naum", testament: "old", order: 34, chapters: 3 },
      { name: "Habacuque", abbreviation: "Hab.", testament: "old", order: 35, chapters: 3 },
      { name: "Sofonias", abbreviation: "Sof.", testament: "old", order: 36, chapters: 3 },
      { name: "Ageu", abbreviation: "Ageu", testament: "old", order: 37, chapters: 2 },
      { name: "Zacarias", abbreviation: "Zac.", testament: "old", order: 38, chapters: 14 },
      { name: "Malaquias", abbreviation: "Mal.", testament: "old", order: 39, chapters: 4 },

      // New Testament
      { name: "Mateus", abbreviation: "Mt.", testament: "new", order: 40, chapters: 28 },
      { name: "Marcos", abbreviation: "Mc.", testament: "new", order: 41, chapters: 16 },
      { name: "Lucas", abbreviation: "Lc.", testament: "new", order: 42, chapters: 24 },
      { name: "João", abbreviation: "Jo.", testament: "new", order: 43, chapters: 21 },
      { name: "Atos dos Apóstolos", abbreviation: "At.", testament: "new", order: 44, chapters: 28 },
      { name: "Romanos", abbreviation: "Rom.", testament: "new", order: 45, chapters: 16 },
      { name: "1 Coríntios", abbreviation: "1 Cor.", testament: "new", order: 46, chapters: 16 },
      { name: "2 Coríntios", abbreviation: "2 Cor.", testament: "new", order: 47, chapters: 13 },
      { name: "Gálatas", abbreviation: "Gál.", testament: "new", order: 48, chapters: 6 },
      { name: "Efésios", abbreviation: "Ef.", testament: "new", order: 49, chapters: 6 },
      { name: "Filipenses", abbreviation: "Filip.", testament: "new", order: 50, chapters: 4 },
      { name: "Colossenses", abbreviation: "Col.", testament: "new", order: 51, chapters: 4 },
      { name: "1 Tessalonicenses", abbreviation: "1 Tess.", testament: "new", order: 52, chapters: 5 },
      { name: "2 Tessalonicenses", abbreviation: "2 Tess.", testament: "new", order: 53, chapters: 3 },
      { name: "1 Timóteo", abbreviation: "1 Tim.", testament: "new", order: 54, chapters: 6 },
      { name: "2 Timóteo", abbreviation: "2 Tim.", testament: "new", order: 55, chapters: 4 },
      { name: "Tito", abbreviation: "Tit.", testament: "new", order: 56, chapters: 3 },
      { name: "Filemom", abbreviation: "Fil.", testament: "new", order: 57, chapters: 1 },
      { name: "Hebreus", abbreviation: "Heb.", testament: "new", order: 58, chapters: 13 },
      { name: "Tiago", abbreviation: "Tg.", testament: "new", order: 59, chapters: 5 },
      { name: "1 Pedro", abbreviation: "1 Ped.", testament: "new", order: 60, chapters: 5 },
      { name: "2 Pedro", abbreviation: "2 Ped.", testament: "new", order: 61, chapters: 3 },
      { name: "1 João", abbreviation: "1 Jo.", testament: "new", order: 62, chapters: 5 },
      { name: "2 João", abbreviation: "2 Jo.", testament: "new", order: 63, chapters: 1 },
      { name: "3 João", abbreviation: "3 Jo.", testament: "new", order: 64, chapters: 1 },
      { name: "Judas", abbreviation: "Jud.", testament: "new", order: 65, chapters: 1 },
      { name: "Apocalipse", abbreviation: "Apoc.", testament: "new", order: 66, chapters: 22 },
    ];

    console.log("Inserting biblical books and chapters...");

    // Insert books and chapters
    for (const bookData of biblicalBooksData) {
      try {
        const [book] = await db.insert(biblicalBooks).values(bookData).returning();
        
        // Create chapters for each book
        for (let i = 1; i <= bookData.chapters; i++) {
          await db.insert(biblicalChapters).values({
            bookId: book.id,
            chapterNumber: i,
            verses: 1, // Will be updated as verses are added
          });
        }
      } catch (error) {
        console.log(`Error inserting book ${bookData.name}:`, error);
      }
    }

    // Insert sample verses extracted from PDF content
    await this.initializeSampleVerses();
    
    console.log("Bible database initialization completed");
  }

  async initializeBiblicalDatabase(): Promise<void> {
    await this.importBibleFromPDF();
  }

  async initializeSampleVerses(): Promise<void> {
    console.log("Inserting sample verses from PDF content...");

    // Get Genesis book
    const [genesisBook] = await db.select().from(biblicalBooks)
      .where(eq(biblicalBooks.name, "Gênesis"));
    
    if (!genesisBook) return;

    const [genesisChapter1] = await db.select().from(biblicalChapters)
      .where(and(
        eq(biblicalChapters.bookId, genesisBook.id),
        eq(biblicalChapters.chapterNumber, 1)
      ));

    if (!genesisChapter1) return;

    // Sample verses extracted from the PDF content provided
    const genesisVerses = [
      {
        bookId: genesisBook.id,
        chapterId: genesisChapter1.id,
        book: "Gênesis",
        chapter: 1,
        verse: 1,
        text: "No princípio, Deus criou os céus e a terra.",
        translation: "ACF",
        emotions: ["criação", "início", "poder"],
        keywords: ["princípio", "Deus", "criou", "céus", "terra"],
      },
      {
        bookId: genesisBook.id,
        chapterId: genesisChapter1.id,
        book: "Gênesis",
        chapter: 1,
        verse: 2,
        text: "E a terra era sem forma e vazia; e havia trevas sobre a face do abismo; e o Espírito de Deus se movia sobre a face das águas.",
        translation: "ACF",
        emotions: ["caos", "vazio", "presença"],
        keywords: ["terra", "vazia", "trevas", "Espírito", "águas"],
      },
      {
        bookId: genesisBook.id,
        chapterId: genesisChapter1.id,
        book: "Gênesis",
        chapter: 1,
        verse: 3,
        text: "E disse Deus: Haja luz; e houve luz.",
        translation: "ACF",
        emotions: ["poder", "criação", "comando"],
        keywords: ["Deus", "luz", "palavra", "criação"],
      },
      {
        bookId: genesisBook.id,
        chapterId: genesisChapter1.id,
        book: "Gênesis",
        chapter: 1,
        verse: 4,
        text: "E viu Deus que era boa a luz; e fez Deus separação entre a luz e as trevas.",
        translation: "ACF",
        emotions: ["aprovação", "ordem", "separação"],
        keywords: ["Deus", "boa", "luz", "separação", "trevas"],
      },
      {
        bookId: genesisBook.id,
        chapterId: genesisChapter1.id,
        book: "Gênesis",
        chapter: 1,
        verse: 26,
        text: "E disse Deus: Façamos o homem à nossa imagem, conforme a nossa semelhança; e domine sobre os peixes do mar, e sobre as aves dos céus, e sobre o gado, e sobre toda a terra, e sobre todo réptil que se move sobre a terra.",
        translation: "ACF",
        emotions: ["criação", "propósito", "dignidade"],
        keywords: ["Deus", "homem", "imagem", "semelhança", "domínio"],
      },
      {
        bookId: genesisBook.id,
        chapterId: genesisChapter1.id,
        book: "Gênesis",
        chapter: 1,
        verse: 27,
        text: "E criou Deus o homem à sua imagem, à imagem de Deus o criou, macho e fêmea os criou.",
        translation: "ACF",
        emotions: ["criação", "identidade", "igualdade"],
        keywords: ["Deus", "homem", "imagem", "macho", "fêmea"],
      },
    ];

    // Insert Genesis verses
    for (const verse of genesisVerses) {
      try {
        await db.insert(biblicalVerses).values(verse);
      } catch (error) {
        console.log('Error inserting Genesis verse:', error);
      }
    }

    // Add additional sample verses with emotions for AI correlation
    const sampleVerses = [
      // Ansiedade e Preocupação
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
        verse: 7,
        text: "E a paz de Deus, que excede todo o entendimento, guardará o coração e a mente de vocês em Cristo Jesus.",
        translation: "NVI",
        emotions: ["ansiedade", "paz"],
        keywords: ["paz", "proteção", "Cristo", "entendimento"],
      },
      {
        book: "1 Pedro",
        chapter: 5,
        verse: 7,
        text: "Lancem sobre ele toda a sua ansiedade, porque ele tem cuidado de vocês.",
        translation: "NVI",
        emotions: ["ansiedade", "preocupação"],
        keywords: ["cuidado", "confiança", "entrega"],
      },
      {
        book: "Mateus",
        chapter: 6,
        verse: 26,
        text: "Observem as aves do céu: não semeiam nem colhem nem armazenam em celeiros; contudo, o Pai celestial as alimenta. Não têm vocês muito mais valor do que elas?",
        translation: "NVI",
        emotions: ["ansiedade", "preocupação"],
        keywords: ["provisão", "valor", "cuidado", "confiança"],
      },
      {
        book: "Mateus",
        chapter: 11,
        verse: 28,
        text: "Venham a mim, todos os que estão cansados e sobrecarregados, e eu darei descanso a vocês.",
        translation: "NVI",
        emotions: ["cansaço", "fardo", "ansiedade"],
        keywords: ["descanso", "alívio", "Jesus", "convite"],
      },
      
      // Tristeza e Luto
      {
        book: "Salmos",
        chapter: 34,
        verse: 18,
        text: "O Senhor está perto dos que têm o coração quebrantado e salva os de espírito abatido.",
        translation: "NVI",
        emotions: ["tristeza", "desânimo", "quebrantamento"],
        keywords: ["proximidade", "salvação", "consolo", "presença"],
      },
      {
        book: "Salmos",
        chapter: 23,
        verse: 4,
        text: "Mesmo quando eu andar pelo vale da sombra da morte, não temerei mal algum, pois tu estás comigo; a tua vara e o teu cajado me consolam.",
        translation: "NVI",
        emotions: ["medo", "tristeza", "morte"],
        keywords: ["proteção", "consolo", "presença", "coragem"],
      },
      {
        book: "Isaías",
        chapter: 61,
        verse: 3,
        text: "E dar-lhes uma coroa em vez de cinzas, óleo de alegria em vez de pranto, e manto de louvor em vez de espírito angustiado.",
        translation: "NVI",
        emotions: ["tristeza", "luto", "angústia"],
        keywords: ["restauração", "alegria", "louvor", "transformação"],
      },
      {
        book: "João",
        chapter: 16,
        verse: 33,
        text: "Disse-lhes isso para que em mim vocês tenham paz. No mundo vocês terão aflições; contudo, tenham ânimo! Eu venci o mundo.",
        translation: "NVI",
        emotions: ["aflição", "tribulação", "desânimo"],
        keywords: ["paz", "vitória", "ânimo", "superação"],
      },
      
      // Esperança e Fé
      {
        book: "Jeremias",
        chapter: 29,
        verse: 11,
        text: "Porque eu bem sei os pensamentos que tenho a vosso respeito, diz o Senhor; pensamentos de paz e não de mal, para vos dar o fim que esperais.",
        translation: "NVI",
        emotions: ["esperança", "futuro", "planos"],
        keywords: ["planos", "prosperidade", "futuro", "bem-estar"],
      },
      {
        book: "Romanos",
        chapter: 8,
        verse: 28,
        text: "Sabemos que Deus age em todas as coisas para o bem daqueles que o amam, dos que foram chamados de acordo com o seu propósito.",
        translation: "NVI",
        emotions: ["esperança", "confiança"],
        keywords: ["propósito", "bem", "soberania", "chamado"],
      },
      {
        book: "Hebreus",
        chapter: 11,
        verse: 1,
        text: "Ora, a fé é a certeza daquilo que esperamos e a prova das coisas que não vemos.",
        translation: "NVI",
        emotions: ["fé", "esperança"],
        keywords: ["certeza", "esperança", "invisível", "confiança"],
      },
      {
        book: "Isaías",
        chapter: 40,
        verse: 31,
        text: "Mas aqueles que esperam no Senhor renovam as suas forças. Voam alto como águias; correm e não ficam exaustos, andam e não se cansam.",
        translation: "NVI",
        emotions: ["cansaço", "esperança", "força"],
        keywords: ["renovação", "força", "esperança", "resistência"],
      },
      
      // Amor e Relacionamentos
      {
        book: "1 Coríntios",
        chapter: 13,
        verse: 4,
        text: "O amor é paciente, o amor é bondoso. Não inveja, não se vangloria, não se orgulha.",
        translation: "NVI",
        emotions: ["amor", "relacionamento"],
        keywords: ["paciência", "bondade", "humildade", "caráter"],
      },
      {
        book: "1 João",
        chapter: 4,
        verse: 19,
        text: "Nós amamos porque ele nos amou primeiro.",
        translation: "NVI",
        emotions: ["amor", "gratidão"],
        keywords: ["amor", "primeiro", "resposta", "iniciativa"],
      },
      {
        book: "João",
        chapter: 3,
        verse: 16,
        text: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.",
        translation: "NVI",
        emotions: ["amor", "salvação"],
        keywords: ["amor", "sacrifício", "vida eterna", "fé"],
      },
      {
        book: "Romanos",
        chapter: 8,
        verse: 38,
        text: "Pois estou convencido de que nem morte nem vida, nem anjos nem demônios, nem o presente nem o futuro, nem quaisquer poderes,",
        translation: "NVI",
        emotions: ["amor", "segurança"],
        keywords: ["separação", "amor", "certeza", "eternidade"],
      },
      
      // Perdão e Reconciliação
      {
        book: "1 João",
        chapter: 1,
        verse: 9,
        text: "Se confessarmos os nossos pecados, ele é fiel e justo para perdoar os nossos pecados e nos purificar de toda injustiça.",
        translation: "NVI",
        emotions: ["culpa", "perdão", "purificação"],
        keywords: ["confissão", "perdão", "purificação", "fidelidade"],
      },
      {
        book: "Efésios",
        chapter: 4,
        verse: 32,
        text: "Sejam bondosos e compassivos uns para com os outros, perdoando-se mutuamente, assim como Deus os perdoou em Cristo.",
        translation: "NVI",
        emotions: ["perdão", "relacionamento"],
        keywords: ["bondade", "compaixão", "perdão", "mutualidade"],
      },
      {
        book: "Mateus",
        chapter: 6,
        verse: 14,
        text: "Pois, se perdoarem as ofensas uns dos outros, o Pai celestial também lhes perdoará.",
        translation: "NVI",
        emotions: ["perdão", "ofensa"],
        keywords: ["perdão", "reciprocidade", "ofensa", "celestial"],
      },
      
      // Força e Coragem
      {
        book: "Filipenses",
        chapter: 4,
        verse: 13,
        text: "Posso todas as coisas naquele que me fortalece.",
        translation: "NVI",
        emotions: ["força", "capacidade", "confiança"],
        keywords: ["força", "capacidade", "Cristo", "poder"],
      },
      {
        book: "Josué",
        chapter: 1,
        verse: 9,
        text: "Não foi isso que eu lhe ordenei? Seja forte e corajoso! Não se apavore nem desanime, pois o Senhor, o seu Deus, estará com você por onde você andar.",
        translation: "NVI",
        emotions: ["medo", "coragem", "força"],
        keywords: ["coragem", "presença", "força", "acompanhamento"],
      },
      {
        book: "Isaías",
        chapter: 41,
        verse: 10,
        text: "Não temas, porque eu sou contigo; não te assombres, porque eu sou o teu Deus; eu te fortaleço, e te ajudo, e te sustento com a minha destra fiel.",
        translation: "NVI",
        emotions: ["medo", "força", "sustento"],
        keywords: ["fortalecimento", "ajuda", "sustento", "fidelidade"],
      },
      
      // Paz e Tranquilidade
      {
        book: "João",
        chapter: 14,
        verse: 27,
        text: "Deixo-lhes a paz; a minha paz lhes dou. Não a dou como o mundo a dá. Não se perturbe o seu coração, nem tenham medo.",
        translation: "NVI",
        emotions: ["paz", "medo", "perturbação"],
        keywords: ["paz", "coração", "perturbação", "diferença"],
      },
      {
        book: "Salmos",
        chapter: 46,
        verse: 10,
        text: "Aquietem-se e saibam que eu sou Deus! Serei exaltado entre as nações, serei exaltado na terra.",
        translation: "NVI",
        emotions: ["paz", "quietude", "reconhecimento"],
        keywords: ["quietude", "conhecimento", "exaltação", "soberania"],
      },
      
      // Sabedoria e Discernimento
      {
        book: "Provérbios",
        chapter: 3,
        verse: 5,
        text: "Confie no Senhor de todo o seu coração e não se apoie em seu próprio entendimento.",
        translation: "NVI",
        emotions: ["confiança", "sabedoria"],
        keywords: ["confiança", "coração", "entendimento", "dependência"],
      },
      {
        book: "Tiago",
        chapter: 1,
        verse: 5,
        text: "Se algum de vocês tem falta de sabedoria, peça-a a Deus, que a todos dá livremente, de boa vontade; e lhe será concedida.",
        translation: "NVI",
        emotions: ["sabedoria", "necessidade"],
        keywords: ["sabedoria", "pedido", "generosidade", "concessão"],
      },
      
      // Gratidão e Louvor
      {
        book: "Salmos",
        chapter: 100,
        verse: 4,
        text: "Entrem por suas portas com ação de graças e em seus átrios com louvor; deem-lhe graças e bendigam o seu nome.",
        translation: "NVI",
        emotions: ["gratidão", "louvor", "alegria"],
        keywords: ["gratidão", "louvor", "entrada", "bênção"],
      },
      {
        book: "1 Tessalonicenses",
        chapter: 5,
        verse: 18,
        text: "Deem graças em todas as circunstâncias, pois esta é a vontade de Deus para vocês em Cristo Jesus.",
        translation: "NVI",
        emotions: ["gratidão", "contentamento"],
        keywords: ["gratidão", "circunstâncias", "vontade", "Cristo"],
      },
      
      // Versículos adicionais para completar a base de dados
      {
        book: "Salmos",
        chapter: 23,
        verse: 1,
        text: "O Senhor é o meu pastor; nada me faltará.",
        translation: "NVI",
        emotions: ["confiança", "provisão", "cuidado"],
        keywords: ["pastor", "provisão", "cuidado", "suficiência"],
      },
      {
        book: "Salmos",
        chapter: 139,
        verse: 14,
        text: "Eu te louvo porque me fizeste de modo especial e admirável. Tuas obras são maravilhosas! Disso tenho plena certeza.",
        translation: "NVI",
        emotions: ["autoestima", "identidade", "louvor"],
        keywords: ["criação", "especial", "maravilhoso", "certeza"],
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

    // Insert verses into database
    for (const verse of sampleVerses) {
      try {
        await db
          .insert(biblicalVerses)
          .values(verse)
          .onConflictDoNothing();
      } catch (error) {
        console.log('Error inserting verse:', error);
      }
    }
  }
}

export const storage = new DatabaseStorage();
