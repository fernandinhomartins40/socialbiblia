import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertPostSchema, insertCommentSchema, insertAIInteractionSchema } from "@shared/schema";
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

  // AI Chat routes
  app.post('/api/ai/chat', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { message, emotion } = req.body;

      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }

      // Simple AI logic to correlate emotions with biblical verses
      const response = await generateBiblicalResponse(message, emotion);
      
      const interactionData = insertAIInteractionSchema.parse({
        userId,
        userMessage: message,
        aiResponse: response.text,
        emotion: response.emotion,
      });

      const interaction = await storage.createAIInteraction(interactionData);
      
      res.json({
        id: interaction.id,
        response: response.text,
        verse: response.verse,
        emotion: response.emotion,
      });
    } catch (error) {
      console.error("Error in AI chat:", error);
      res.status(500).json({ message: "Failed to process AI chat" });
    }
  });

  app.post('/api/ai/feedback', isAuthenticated, async (req: any, res) => {
    try {
      const { interactionId, feedback } = req.body;
      
      await storage.updateAIFeedback(interactionId, feedback);
      res.json({ success: true });
    } catch (error) {
      console.error("Error submitting feedback:", error);
      res.status(500).json({ message: "Failed to submit feedback" });
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
