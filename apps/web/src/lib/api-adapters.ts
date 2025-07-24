// API Adapters for features not yet implemented in Vincent Queimado backend
// This file provides compatibility layer for frontend features

import { apiClient } from '@/lib/unified-api';

// Mock data generators for development
function generateMockUser(id: string = '1') {
  return {
    id,
    email: `user${id}@example.com`,
    name: `Usuário ${id}`,
    firstName: `Nome${id}`,
    lastName: `Sobrenome${id}`,
    phone: `(11) 9999${id.padStart(4, '0')}`,
    profileImageUrl: `https://ui-avatars.com/api/?name=Usuario${id}&background=4A90E2&color=fff`,
    bio: 'Servo do Senhor Jesus Cristo',
    denomination: 'Evangélica',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function generateMockPost(id: string = '1') {
  const user = generateMockUser(id);
  return {
    id,
    content: `Esta é uma reflexão bíblica de exemplo ${id}. Deus tem planos maravilhosos para nossas vidas!`,
    imageUrl: undefined,
    videoUrl: undefined,
    verseReference: 'Jeremias 29:11',
    verseText: 'Porque eu bem sei os pensamentos que tenho a vosso respeito, diz o SENHOR; pensamentos de paz, e não de mal, para vos dar o fim que esperais.',
    isPublic: true,
    isPinned: false,
    authorId: user.id,
    createdAt: new Date(Date.now() - Math.random() * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    author: user,
    stats: {
      likesCount: Math.floor(Math.random() * 50),
      commentsCount: Math.floor(Math.random() * 10),
      sharesCount: Math.floor(Math.random() * 5),
    },
    isLiked: Math.random() > 0.5,
  };
}

function generateMockComment(id: string = '1', postId: string = '1') {
  const user = generateMockUser(id);
  return {
    id,
    content: `Comentário de exemplo ${id}. Amém! Deus abençoe!`,
    postId,
    userId: user.id,
    user,
    createdAt: new Date(Date.now() - Math.random() * 3600000).toISOString(),
  };
}

// Extended API client with adapters
class ApiAdapters {
  // Posts functionality (simulated until backend implements)
  async getFeed(limit: number = 20, offset: number = 0) {
    console.warn('📝 Feed endpoints not implemented in backend yet - using mock data');
    
    // Generate mock posts
    const posts = Array.from({ length: Math.min(limit, 10) }, (_, i) => 
      generateMockPost((offset + i + 1).toString())
    );
    
    return {
      success: true,
      data: { posts },
      message: 'Feed loaded successfully (mock data)'
    };
  }

  async createPost(data: any) {
    console.warn('📝 Create post endpoints not implemented in backend yet');
    return {
      success: true,
      message: 'Post criado com sucesso! (simulado)',
      data: { id: Date.now().toString(), ...data }
    };
  }

  async likePost(data: { postId: string; action: 'like' | 'unlike' }) {
    console.warn('❤️ Like endpoints not implemented in backend yet');
    return {
      success: true,
      message: `Post ${data.action === 'like' ? 'curtido' : 'descurtido'} com sucesso! (simulado)`
    };
  }

  async deletePost() {
    console.warn('🗑️ Delete post endpoints not implemented in backend yet');
    return {
      success: true,
      message: 'Post deletado com sucesso! (simulado)'
    };
  }

  async getComments(postId: string) {
    console.warn('💬 Comments endpoints not implemented in backend yet - using mock data');
    
    // Generate mock comments
    const comments = Array.from({ length: Math.floor(Math.random() * 5) }, (_, i) => 
      generateMockComment((i + 1).toString(), postId)
    );
    
    return { comments };
  }

  async createComment(data: { content: string }) {
    console.warn('💬 Create comment endpoints not implemented in backend yet');
    return {
      success: true,
      message: 'Comentário adicionado com sucesso! (simulado)',
      data: { id: Date.now().toString(), ...data }
    };
  }

  // Bible functionality (simulated until backend implements)
  async searchBible() {
    console.warn('📖 Bible search endpoints not implemented in backend yet');
    return {
      success: true,
      data: {
        results: [
          {
            id: '1',
            type: 'verse',
            verse: {
              book: 'João',
              chapter: 3,
              verse: 16,
              text: 'Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.',
              translation: 'ARC'
            },
            relevanceScore: 0.95
          }
        ]
      }
    };
  }

  async searchBibleAI() {
    console.warn('🤖 AI Bible search endpoints not implemented in backend yet');
    return {
      success: true,
      data: {
        results: [
          {
            id: '1',
            type: 'ai_response',
            aiResponse: {
              text: 'Com base na sua consulta, recomendo meditar sobre a paz que Cristo oferece.',
              emotion: 'peace',
              context: 'spiritual_guidance'
            },
            relevanceScore: 0.9
          }
        ]
      }
    };
  }

  async getBibleBooks() {
    console.warn('📚 Bible books endpoints not implemented in backend yet');
    return [
      { id: '1', name: 'Gênesis', abbreviation: 'Gn', chapters: 50, testament: 'Antigo' },
      { id: '2', name: 'Êxodo', abbreviation: 'Ex', chapters: 40, testament: 'Antigo' },
      { id: '40', name: 'Mateus', abbreviation: 'Mt', chapters: 28, testament: 'Novo' },
      { id: '43', name: 'João', abbreviation: 'Jo', chapters: 21, testament: 'Novo' },
    ];
  }

  async getRandomVerse() {
    console.warn('🎲 Random verse endpoints not implemented in backend yet');
    return {
      id: '1',
      book: 'Provérbios',
      chapter: 3,
      verse: 5,
      text: 'Confia no SENHOR de todo o teu coração, e não te estribes no teu próprio entendimento.',
      translation: 'ARC'
    };
  }

  // AI Chat functionality (simulated until backend implements)
  async chatWithAI(data: { message: string; emotion?: string }) {
    console.warn('🤖 AI Chat endpoints not implemented in backend yet');
    
    const responses = [
      'Deus tem um propósito especial para você. Continue confiando Nele.',
      'A paz de Cristo pode acalmar qualquer tempestade em seu coração.',
      'Lembre-se: "Tudo posso naquele que me fortalece" - Filipenses 4:13',
      'Suas orações são ouvidas. Deus está trabalhando em sua vida.',
      'O amor de Deus por você é incondicional e eterno.'
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    return {
      id: Date.now().toString(),
      response: randomResponse,
      verse: {
        book: 'Filipenses',
        chapter: 4,
        verse: 13,
        text: 'Tudo posso naquele que me fortalece.'
      },
      emotion: data.emotion || 'peace',
      confidence: 0.85,
      themes: ['faith', 'strength', 'hope'],
      recommendations: []
    };
  }

  async submitAIFeedback() {
    console.warn('📊 AI Feedback endpoints not implemented in backend yet');
    return {
      success: true,
      message: 'Feedback registrado! (simulado)'
    };
  }

  // Communities functionality (simulated until backend implements)
  async getCommunities() {
    console.warn('👥 Communities endpoints not implemented in backend yet');
    return [
      {
        id: '1',
        name: 'Jovens na Fé',
        description: 'Comunidade para jovens cristãos',
        memberCount: 142,
        icon: 'fas fa-seedling',
        color: 'spiritual-blue',
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Família Abençoada',
        description: 'Reflexões sobre família cristã',
        memberCount: 89,
        icon: 'fas fa-heart',
        color: 'hope-green',
        createdAt: new Date().toISOString()
      }
    ];
  }

  async joinCommunity() {
    console.warn('👥 Join community endpoints not implemented in backend yet');
    return {
      joined: true,
      message: 'Você se juntou à comunidade! (simulado)'
    };
  }

  // LLM functionality (simulated until backend implements)
  async getLLMStatus() {
    console.warn('⚙️ LLM status endpoints not implemented in backend yet');
    return {
      available: true,
      status: 'running',
      model: 'Phi-2 (simulated)',
      version: '2.7B'
    };
  }

  async testLLM(message: string = 'Hello') {
    console.warn('🧪 LLM test endpoints not implemented in backend yet');
    return {
      success: true,
      data: {
        response: `Echo: ${message} (simulado)`,
        model: 'Phi-2',
        timestamp: new Date().toISOString()
      }
    };
  }
}

// Create singleton instance
export const apiAdapters = new ApiAdapters();

// Legacy compatibility - extend the main API client with adapters
export const extendedApiClient = {
  ...apiClient,
  ...apiAdapters,
} as typeof apiClient & ApiAdapters; 