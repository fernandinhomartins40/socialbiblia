import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertPostSchema, insertCommentSchema, insertAIInteractionSchema } from "@shared/schema";
import { aiEngine } from "./aiEngine";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Initialize biblical database
  await storage.initializeBiblicalDatabase();

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUserWithStats(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Biblical API routes - using content from PDF
  app.get('/api/bible/books', async (req, res) => {
    try {
      const books = await storage.getBiblicalBooks();
      res.json(books);
    } catch (error) {
      console.error("Error fetching biblical books:", error);
      res.status(500).json({ message: "Failed to fetch biblical books" });
    }
  });

  app.get('/api/bible/books/:bookId', async (req, res) => {
    try {
      const { bookId } = req.params;
      const book = await storage.getBiblicalBook(bookId);
      if (!book) {
        return res.status(404).json({ message: "Book not found" });
      }
      res.json(book);
    } catch (error) {
      console.error("Error fetching biblical book:", error);
      res.status(500).json({ message: "Failed to fetch biblical book" });
    }
  });

  app.get('/api/bible/books/:bookId/chapters', async (req, res) => {
    try {
      const { bookId } = req.params;
      const chapters = await storage.getBiblicalChapters(bookId);
      res.json(chapters);
    } catch (error) {
      console.error("Error fetching biblical chapters:", error);
      res.status(500).json({ message: "Failed to fetch biblical chapters" });
    }
  });

  app.get('/api/bible/books/:bookId/verses', async (req, res) => {
    try {
      const { bookId } = req.params;
      const { chapter } = req.query;
      const verses = await storage.getBiblicalVerses(bookId, chapter ? parseInt(chapter as string) : undefined);
      res.json(verses);
    } catch (error) {
      console.error("Error fetching biblical verses:", error);
      res.status(500).json({ message: "Failed to fetch biblical verses" });
    }
  });

  app.get('/api/bible/verses', async (req, res) => {
    try {
      const { bookId, chapter } = req.query;
      const verses = await storage.getBiblicalVerses(
        bookId as string,
        chapter ? parseInt(chapter as string) : undefined
      );
      res.json(verses);
    } catch (error) {
      console.error("Error fetching verses:", error);
      res.status(500).json({ message: "Failed to fetch verses" });
    }
  });

  // Bookmarks for Bible verses
  app.post('/api/bible/bookmarks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const bookmark = await storage.createBookmark({
        ...req.body,
        userId,
      });
      res.json(bookmark);
    } catch (error) {
      console.error("Error creating bookmark:", error);
      res.status(500).json({ message: "Failed to create bookmark" });
    }
  });

  app.get('/api/bible/bookmarks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const bookmarks = await storage.getUserBookmarks(userId);
      res.json(bookmarks);
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
      res.status(500).json({ message: "Failed to fetch bookmarks" });
    }
  });

  app.delete('/api/bible/bookmarks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const success = await storage.deleteBookmark(id, userId);
      if (!success) {
        return res.status(404).json({ message: "Bookmark not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting bookmark:", error);
      res.status(500).json({ message: "Failed to delete bookmark" });
    }
  });

  // Advanced Bible AI Search
  app.post('/api/bible/ai-search', async (req, res) => {
    try {
      const { query, type, emotion } = req.body;
      
      if (!query) {
        return res.status(400).json({ message: "Query is required" });
      }

      const results: any[] = [];
      
      // Use AI engine for emotion analysis and verse recommendations
      const emotionAnalysis = aiEngine.analyzeEmotion(query);
      const allVerses = await storage.getBiblicalVerses();
      
      // Get AI recommendations using machine learning
      const recommendations = aiEngine.recommendVerses(emotionAnalysis, allVerses.slice(0, 100));
      
      // Add top verse recommendations
      for (const rec of recommendations.slice(0, 5)) {
        results.push({
          id: `verse-${rec.verse.id}`,
          type: 'verse',
          verse: {
            book: rec.verse.book,
            chapter: rec.verse.chapter,
            verse: rec.verse.verse,
            text: rec.verse.text,
            translation: rec.verse.translation
          },
          relevanceScore: Math.round(rec.relevanceScore)
        });
      }

      // Use advanced AI engine for emotional analysis and verse recommendation
      if (type === 'emotion' || emotion) {
        // Analyze emotion using machine learning
        const emotionAnalysis = aiEngine.analyzeEmotion(query);
        
        // Get verse recommendations based on analysis
        const verseRecommendations = aiEngine.recommendVerses(emotionAnalysis, allVerses.slice(0, 200));
        
        // Add top recommended verse as AI response
        if (verseRecommendations.length > 0) {
          const topRecommendation = verseRecommendations[0];
          const contextualResponse = aiEngine.generateContextualResponse(emotionAnalysis, topRecommendation.verse);
          
          results.unshift({
            id: `ai-${Date.now()}`,
            type: 'ai_response',
            aiResponse: {
              text: contextualResponse,
              emotion: emotionAnalysis.primaryEmotion,
              context: `Análise: ${emotionAnalysis.primaryEmotion} (${Math.round(emotionAnalysis.confidence * 100)}% confiança)`
            }
          });
          
          // Add recommended verses with ML scores
          verseRecommendations.slice(0, 5).forEach(recommendation => {
            if (!results.find(r => r.verse && r.verse.book === recommendation.verse.book && 
                                    r.verse.chapter === recommendation.verse.chapter && 
                                    r.verse.verse === recommendation.verse.verse)) {
              results.push({
                id: `verse-ml-${recommendation.verse.id}`,
                type: 'verse',
                verse: {
                  book: recommendation.verse.book,
                  chapter: recommendation.verse.chapter,
                  verse: recommendation.verse.verse,
                  text: recommendation.verse.text,
                  translation: recommendation.verse.translation
                },
                relevanceScore: Math.round(recommendation.relevanceScore)
              });
            }
          });
        }
      }

      // Sort results by relevance
      results.sort((a, b) => (b.relevanceScore || 1) - (a.relevanceScore || 1));

      res.json({ results });
    } catch (error) {
      console.error("Bible AI search error:", error);
      res.status(500).json({ message: "Failed to perform Bible search" });
    }
  });

  // User routes
  app.put('/api/users/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updateData = req.body;
      const user = await storage.updateUserProfile(userId, updateData);
      res.json(user);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Post routes
  app.get('/api/posts', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const userId = req.query.userId as string;
      
      const posts = await storage.getPosts(userId, limit, offset);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  app.post('/api/posts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const postData = insertPostSchema.parse({ ...req.body, userId });
      
      const post = await storage.createPost(postData);
      res.json(post);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  app.delete('/api/posts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const postId = req.params.id;
      
      const deleted = await storage.deletePost(postId, userId);
      if (deleted) {
        res.json({ success: true });
      } else {
        res.status(404).json({ message: "Post not found or not authorized" });
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      res.status(500).json({ message: "Failed to delete post" });
    }
  });

  // Comment routes
  app.post('/api/comments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const commentData = insertCommentSchema.parse({ ...req.body, userId });
      
      const comment = await storage.createComment(commentData);
      res.json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  app.get('/api/posts/:postId/comments', async (req, res) => {
    try {
      const postId = req.params.postId;
      const comments = await storage.getComments(postId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  // Like routes
  app.post('/api/posts/:postId/like', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const postId = req.params.postId;
      
      const liked = await storage.toggleLike(postId, userId);
      res.json({ liked });
    } catch (error) {
      console.error("Error toggling like:", error);
      res.status(500).json({ message: "Failed to toggle like" });
    }
  });

  // Follow routes
  app.post('/api/users/:userId/follow', isAuthenticated, async (req: any, res) => {
    try {
      const followerId = req.user.claims.sub;
      const followingId = req.params.userId;
      
      const followed = await storage.toggleFollow(followerId, followingId);
      res.json({ followed });
    } catch (error) {
      console.error("Error toggling follow:", error);
      res.status(500).json({ message: "Failed to toggle follow" });
    }
  });

  // Community routes
  app.get('/api/communities', async (req, res) => {
    try {
      const communities = await storage.getCommunities();
      res.json(communities);
    } catch (error) {
      console.error("Error fetching communities:", error);
      res.status(500).json({ message: "Failed to fetch communities" });
    }
  });

  app.post('/api/communities/:communityId/join', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const communityId = req.params.communityId;
      
      const joined = await storage.joinCommunity(communityId, userId);
      res.json({ joined });
    } catch (error) {
      console.error("Error joining community:", error);
      res.status(500).json({ message: "Failed to join community" });
    }
  });

  // AI Chat routes with Local LLM Integration
  app.post('/api/ai/chat', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { message, emotion } = req.body;

      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }

      // Try to use local LLM first, fallback to built-in AI
      let aiResponse;
      let selectedVerse = null;
      let emotionAnalysis;

      try {
        // Call local LLM server
        const llmResponse = await fetch('http://localhost:8080/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: message,
            context: 'biblical'
          })
        });

        if (llmResponse.ok) {
          const llmData = await llmResponse.json();
          aiResponse = llmData.data.response;
          emotionAnalysis = {
            primaryEmotion: llmData.data.emotion_detected,
            confidence: llmData.data.confidence,
            intensity: 0.8,
            themes: ['biblical', 'spiritual'],
            sentiment: 'neutral'
          };
          
          // Parse biblical reference if available
          if (llmData.data.biblical_reference) {
            const verseMatch = llmData.data.biblical_reference.match(/\(([^)]+)\)/);
            if (verseMatch) {
              selectedVerse = {
                id: `llm-${Date.now()}`,
                book: verseMatch[1].split(' ')[0],
                chapter: 1,
                verse: 1,
                text: llmData.data.biblical_reference.split('(')[0].trim(),
                translation: 'NVI'
              };
            }
          }
        } else {
          throw new Error('LLM server not available');
        }
      } catch (llmError) {
        console.log('Local LLM not available, using built-in AI engine');
        
        // Fallback to built-in AI engine
        emotionAnalysis = aiEngine.analyzeEmotion(message);
        
        // Get all verses for recommendation
        const verses = await storage.getBiblicalVerses();
        
        // Get user's interaction history for context
        const userHistory = await storage.getAIInteractions(userId, 20);
        const historyIds = userHistory.map(h => h.id);
        
        // Get verse recommendations using machine learning
        const recommendations = aiEngine.recommendVerses(emotionAnalysis, verses, historyIds);
        
        if (recommendations.length > 0) {
          selectedVerse = recommendations[0].verse;
        }
        
        // Generate contextual response based on ML analysis
        aiResponse = aiEngine.generateContextualResponse(emotionAnalysis, selectedVerse || undefined);
      }
      
      const interactionData = insertAIInteractionSchema.parse({
        userId,
        userMessage: message,
        aiResponse: aiResponse,
        emotion: emotionAnalysis.primaryEmotion,
      });

      const interaction = await storage.createAIInteraction(interactionData);
      
      res.json({
        id: interaction.id,
        response: aiResponse,
        emotion: emotionAnalysis.primaryEmotion,
        confidence: Math.round(emotionAnalysis.confidence * 100),
        intensity: Math.round(emotionAnalysis.intensity * 100),
        themes: emotionAnalysis.themes,
        verse: selectedVerse ? {
          book: selectedVerse.book,
          chapter: selectedVerse.chapter,
          verse: selectedVerse.verse,
          text: selectedVerse.text
        } : null,
        recommendations: recommendations.slice(0, 3).map(r => ({
          verse: {
            book: r.verse.book,
            chapter: r.verse.chapter,
            verse: r.verse.verse,
            text: r.verse.text
          },
          relevanceScore: Math.round(r.relevanceScore * 100)
        }))
      });
    } catch (error) {
      console.error("Error in AI chat:", error);
      res.status(500).json({ message: "Failed to process AI chat" });
    }
  });

  // Local LLM status and testing routes
  app.get('/api/llm/status', async (req, res) => {
    try {
      const response = await fetch('http://127.0.0.1:8080/health', {
        method: 'GET',
        timeout: 5000
      });
      
      if (response.ok) {
        const data = await response.json();
        res.json({
          available: true,
          ...data
        });
      } else {
        throw new Error('LLM server responded with error');
      }
    } catch (error) {
      res.json({
        available: false,
        error: 'Local LLM server not running'
      });
    }
  });

  app.post('/api/llm/test', async (req, res) => {
    try {
      const { message } = req.body;
      const response = await fetch('http://localhost:8080/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: message || 'Hello, how are you?',
          context: 'test'
        })
      });
      
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to connect to local LLM',
        message: error.message
      });
    }
  });

  app.post('/api/ai/feedback', isAuthenticated, async (req: any, res) => {
    try {
      const { interactionId, feedback, verseId, emotion, context } = req.body;
      
      if (!interactionId || !feedback) {
        return res.status(400).json({ message: "Interaction ID and feedback are required" });
      }

      // Update feedback in database
      await storage.updateAIFeedback(interactionId, feedback);
      
      // Update ML model with feedback for continuous learning
      if (verseId && emotion) {
        aiEngine.updateModelFromFeedback(verseId, emotion, feedback, context);
      }

      res.json({ 
        success: true, 
        message: "Feedback received and AI model updated for improved recommendations" 
      });
    } catch (error) {
      console.error("Error submitting feedback:", error);
      res.status(500).json({ message: "Failed to submit feedback" });
    }
  });

  // New AI Analytics route for user insights
  app.get('/api/ai/analytics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const interactions = await storage.getAIInteractions(userId, 50);
      
      // Analyze user's emotional patterns using ML insights
      const emotionCounts: Record<string, number> = {};
      let totalInteractions = interactions.length;
      
      interactions.forEach(interaction => {
        if (interaction.emotion) {
          emotionCounts[interaction.emotion] = (emotionCounts[interaction.emotion] || 0) + 1;
        }
      });

      // Calculate emotional trends and patterns
      const emotionalProfile = Object.entries(emotionCounts)
        .map(([emotion, count]) => ({
          emotion,
          frequency: (count as number) / totalInteractions,
          count: count as number
        }))
        .sort((a, b) => b.frequency - a.frequency);

      // Calculate spiritual growth metrics
      const recentInteractions = interactions.slice(0, 10);
      const positiveEmotions = ['joy', 'peace', 'hope', 'love', 'gratitude', 'faith', 'worship'];
      const positiveCount = recentInteractions.filter(i => i.emotion && positiveEmotions.includes(i.emotion)).length;
      const spiritualGrowthScore = Math.round((positiveCount / Math.min(recentInteractions.length, 10)) * 100);

      res.json({
        totalInteractions,
        emotionalProfile,
        recentInteractions: recentInteractions.map(i => ({
          id: i.id,
          emotion: i.emotion,
          createdAt: i.createdAt,
          userMessage: i.userMessage.substring(0, 100) + (i.userMessage.length > 100 ? '...' : '')
        })),
        insights: {
          primaryEmotion: emotionalProfile[0]?.emotion || 'neutral',
          emotionalDiversity: Object.keys(emotionCounts).length,
          averageSessionsPerWeek: Math.round(totalInteractions / 4),
          spiritualGrowthScore,
          recommendation: spiritualGrowthScore > 70 
            ? "Você está demonstrando um crescimento espiritual consistente!" 
            : "Continue buscando a Palavra para fortalecer sua jornada espiritual."
        }
      });
    } catch (error) {
      console.error("Error generating AI analytics:", error);
      res.status(500).json({ message: "Failed to generate analytics" });
    }
  });

  // Bible search routes
  app.post('/api/bible/search', async (req, res) => {
    try {
      const { query, maxResults = 10 } = req.body;
      
      if (!query) {
        return res.status(400).json({ message: "Query is required" });
      }

      const results = await storage.searchBibleText(query, maxResults);
      
      res.json({
        results: results.map(verse => ({
          id: verse.id,
          type: 'verse',
          verse: {
            book: verse.book,
            chapter: verse.chapter,
            verse: verse.verse,
            text: verse.text,
            translation: verse.translation
          },
          relevanceScore: calculateRelevanceScore(query, verse.text)
        }))
      });
    } catch (error) {
      console.error("Error in bible search:", error);
      res.status(500).json({ message: "Failed to search bible" });
    }
  });

  app.post('/api/bible/ai-search', async (req, res) => {
    try {
      const { query } = req.body;
      
      if (!query) {
        return res.status(400).json({ message: "Query is required" });
      }

      // Generate AI response with biblical correlation
      const aiResponse = await generateAdvancedBiblicalResponse(query);
      
      const results = [
        {
          id: `ai-${Date.now()}`,
          type: 'ai_response',
          aiResponse: {
            text: aiResponse.text,
            emotion: aiResponse.emotion,
            context: aiResponse.context
          }
        }
      ];

      // Add related verses
      if (aiResponse.relatedVerses && aiResponse.relatedVerses.length > 0) {
        for (const verse of aiResponse.relatedVerses) {
          results.push({
            id: verse.id,
            type: 'verse',
            verse: {
              book: verse.book,
              chapter: verse.chapter,
              verse: verse.verse,
              text: verse.text,
              translation: verse.translation
            },
            relevanceScore: verse.relevanceScore || 0.9
          });
        }
      }
      
      res.json({ results });
    } catch (error) {
      console.error("Error in AI bible search:", error);
      res.status(500).json({ message: "Failed to process AI search" });
    }
  });

  // Random verse route
  app.get('/api/verses/random', async (req, res) => {
    try {
      const verse = await storage.getRandomVerse();
      res.json(verse);
    } catch (error) {
      console.error("Error fetching random verse:", error);
      res.status(500).json({ message: "Failed to fetch random verse" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

function calculateRelevanceScore(query: string, text: string): number {
  const queryWords = query.toLowerCase().split(/\s+/);
  const textWords = text.toLowerCase().split(/\s+/);
  
  let matches = 0;
  for (const queryWord of queryWords) {
    if (queryWord.length > 2) { // Skip very short words
      for (const textWord of textWords) {
        if (textWord.includes(queryWord) || queryWord.includes(textWord)) {
          matches++;
          break;
        }
      }
    }
  }
  
  return Math.min(matches / Math.max(queryWords.length, 1), 1);
}

async function generateAdvancedBiblicalResponse(query: string): Promise<{
  text: string;
  emotion: string;
  context: string;
  relatedVerses?: any[];
}> {
  // Detect emotion and theme from query
  const emotions = {
    ansiedade: ["ansioso", "preocupado", "medo", "nervoso", "estresse"],
    tristeza: ["triste", "deprimido", "desanimado", "melancólico", "abatido"],
    esperança: ["esperança", "fé", "confiança", "otimismo", "expectativa"],
    amor: ["amor", "amar", "carinho", "afeto", "paixão"],
    perdão: ["perdão", "perdoar", "reconciliação", "misericórdia"],
    força: ["força", "coragem", "determinação", "resistência", "poder"],
    paz: ["paz", "tranquilidade", "serenidade", "calma", "descanso"],
    gratidão: ["grato", "agradecer", "reconhecimento", "gratidão"],
    sabedoria: ["sabedoria", "conhecimento", "entendimento", "discernimento"]
  };

  let detectedEmotion = "esperança";
  const queryLower = query.toLowerCase();
  
  for (const [emotion, keywords] of Object.entries(emotions)) {
    if (keywords.some(keyword => queryLower.includes(keyword))) {
      detectedEmotion = emotion;
      break;
    }
  }

  // Search for related verses
  const relatedVerses = await storage.searchVerses(detectedEmotion, queryLower.split(/\s+/));
  
  // Generate contextual response
  let responseText = "";
  let context = "";
  
  switch (detectedEmotion) {
    case "ansiedade":
      responseText = "Compreendo sua ansiedade. A Palavra de Deus nos ensina que podemos lançar sobre Ele toda a nossa ansiedade, porque Ele tem cuidado de nós. Não estamos sozinhos em nossas preocupações.";
      context = "Quando sentimos ansiedade, Deus nos convida a confiar em Sua providência e cuidado paternal.";
      break;
    case "tristeza":
      responseText = "Sinto muito por este momento difícil. Deus está próximo dos quebrantados de coração e salva os contritos de espírito. Sua tristeza não é ignorada por Ele.";
      context = "Nos momentos de tristeza, encontramos consolo na presença constante de Deus e em Suas promessas.";
      break;
    case "esperança":
      responseText = "Que bela busca pela esperança! A esperança que temos em Deus é firme e segura, uma âncora para a alma que não falha.";
      context = "A verdadeira esperança está fundamentada nas promessas fiéis de Deus para conosco.";
      break;
    case "amor":
      responseText = "O amor é o maior de todos os mandamentos. Deus nos amou primeiro, e esse amor deve transbordar em nossos relacionamentos.";
      context = "O amor divino é a fonte e o modelo para todo amor verdadeiro em nossas vidas.";
      break;
    case "perdão":
      responseText = "O perdão é um dos maiores atos de amor e liberdade. Assim como Cristo nos perdoou, somos chamados a perdoar uns aos outros.";
      context = "O perdão nos liberta do peso do ressentimento e reflete o caráter misericordioso de Deus.";
      break;
    case "força":
      responseText = "Quando nos sentimos fracos, é quando Deus manifesta Sua força em nós. Podemos todas as coisas nAquele que nos fortalece.";
      context = "Nossa força vem do Senhor, que renova as forças dos que nEle esperam.";
      break;
    case "paz":
      responseText = "A paz que Deus oferece excede todo entendimento. É uma paz que não depende das circunstâncias externas.";
      context = "A verdadeira paz é fruto da reconciliação com Deus e da confiança em Sua soberania.";
      break;
    default:
      responseText = "Deus tem uma palavra especial para cada situação de nossa vida. Ele nos conhece intimamente e cuida de cada detalhe.";
      context = "Em toda circunstância, podemos confiar no amor e cuidado paternal de Deus.";
  }

  return {
    text: responseText,
    emotion: detectedEmotion,
    context: context,
    relatedVerses: relatedVerses.slice(0, 3)
  };
}

// Simple AI logic for biblical correlation
async function generateBiblicalResponse(message: string, emotion?: string): Promise<{
  text: string;
  verse?: any;
  emotion: string;
}> {
  const lowerMessage = message.toLowerCase();

  // Emotion detection based on keywords
  let detectedEmotion = emotion;
  if (!detectedEmotion) {
    if (lowerMessage.includes('ansioso') || lowerMessage.includes('preocupado') || lowerMessage.includes('nervoso')) {
      detectedEmotion = 'ansiedade';
    } else if (lowerMessage.includes('triste') || lowerMessage.includes('deprimido') || lowerMessage.includes('melancólico')) {
      detectedEmotion = 'tristeza';
    } else if (lowerMessage.includes('medo') || lowerMessage.includes('assustado') || lowerMessage.includes('receioso')) {
      detectedEmotion = 'medo';
    } else if (lowerMessage.includes('sozinho') || lowerMessage.includes('solitário') || lowerMessage.includes('isolado')) {
      detectedEmotion = 'solidão';
    } else if (lowerMessage.includes('feliz') || lowerMessage.includes('alegre') || lowerMessage.includes('contente')) {
      detectedEmotion = 'alegria';
    } else if (lowerMessage.includes('raiva') || lowerMessage.includes('irritado') || lowerMessage.includes('zangado')) {
      detectedEmotion = 'raiva';
    } else if (lowerMessage.includes('esperança') || lowerMessage.includes('otimista') || lowerMessage.includes('confiante')) {
      detectedEmotion = 'esperança';
    } else if (lowerMessage.includes('amor') || lowerMessage.includes('relacionamento') || lowerMessage.includes('namoro')) {
      detectedEmotion = 'amor';
    } else {
      detectedEmotion = 'esperança'; // Default
    }
  }

  // Search for relevant verses
  const verses = await storage.searchVerses(detectedEmotion);
  const selectedVerse = verses.length > 0 ? verses[Math.floor(Math.random() * verses.length)] : null;

  // Generate contextual response
  let responseText = "";
  
  if (selectedVerse) {
    responseText = `Compreendo que você está se sentindo ${detectedEmotion}. Deixe-me compartilhar uma palavra de conforto das Escrituras:\n\n`;
    responseText += `"${selectedVerse.text}" - ${selectedVerse.book} ${selectedVerse.chapter}:${selectedVerse.verse}\n\n`;
    
    // Add contextual advice based on emotion
    switch (detectedEmotion) {
      case 'ansiedade':
        responseText += "Lembre-se de que Deus conhece suas necessidades e se importa com você. Que tal dedicar um momento para entregar suas preocupações a Ele em oração?";
        break;
      case 'tristeza':
        responseText += "Deus está perto de você neste momento difícil. Sua presença é real e Seu amor por você é inabalável.";
        break;
      case 'medo':
        responseText += "Você não precisa enfrentar seus medos sozinho. Deus é sua força e proteção em todos os momentos.";
        break;
      case 'solidão':
        responseText += "Mesmo quando se sente sozinho, saiba que Deus nunca o abandona. Ele está sempre ao seu lado.";
        break;
      case 'alegria':
        responseText += "Que bênção saber que você está alegre! Continue cultivando um coração grato e compartilhando essa alegria com outros.";
        break;
      case 'esperança':
        responseText += "Sua esperança em Deus não é em vão. Ele tem planos maravilhosos para sua vida.";
        break;
      default:
        responseText += "Confie em Deus em todas as circunstâncias. Ele é fiel e cuidará de você.";
    }
  } else {
    responseText = `Compreendo que você está passando por um momento de ${detectedEmotion}. Mesmo quando não temos as palavras certas, Deus conhece seu coração e se importa com você. Que tal buscar um momento de oração e reflexão?`;
  }

  return {
    text: responseText,
    verse: selectedVerse,
    emotion: detectedEmotion,
  };
}
