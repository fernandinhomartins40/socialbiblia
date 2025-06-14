import { BiblicalVerse } from "@shared/schema";

// Emotion categories and their weight mappings
export const EMOTION_CATEGORIES = {
  // Positive emotions
  joy: { weight: 1.0, keywords: ['alegria', 'felicidade', 'contentamento', 'celebração', 'gratidão'] },
  peace: { weight: 0.9, keywords: ['paz', 'tranquilidade', 'serenidade', 'calma', 'descanso'] },
  hope: { weight: 0.9, keywords: ['esperança', 'fé', 'confiança', 'expectativa', 'otimismo'] },
  love: { weight: 1.0, keywords: ['amor', 'carinho', 'afeto', 'compaixão', 'bondade'] },
  gratitude: { weight: 0.8, keywords: ['gratidão', 'agradecimento', 'reconhecimento', 'louvor'] },
  
  // Negative emotions
  sadness: { weight: 0.8, keywords: ['tristeza', 'melancolia', 'pesar', 'luto', 'dor'] },
  fear: { weight: 0.9, keywords: ['medo', 'temor', 'ansiedade', 'preocupação', 'insegurança'] },
  anger: { weight: 0.7, keywords: ['raiva', 'ira', 'irritação', 'indignação', 'revolta'] },
  guilt: { weight: 0.8, keywords: ['culpa', 'remorso', 'arrependimento', 'vergonha'] },
  loneliness: { weight: 0.8, keywords: ['solidão', 'abandono', 'isolamento', 'desamparo'] },
  
  // Spiritual states
  doubt: { weight: 0.7, keywords: ['dúvida', 'incerteza', 'questionamento', 'confusão'] },
  faith: { weight: 1.0, keywords: ['fé', 'crença', 'convicção', 'confiança em deus'] },
  worship: { weight: 0.9, keywords: ['adoração', 'louvor', 'veneração', 'reverência'] },
  repentance: { weight: 0.8, keywords: ['arrependimento', 'penitência', 'conversão'] },
  forgiveness: { weight: 0.9, keywords: ['perdão', 'misericórdia', 'graça', 'absolvição'] }
};

// Verse themes and their biblical correlations
export const VERSE_THEMES = {
  comfort: {
    emotions: ['sadness', 'fear', 'loneliness', 'grief'],
    keywords: ['consolação', 'conforto', 'amparo', 'refúgio', 'abrigo'],
    bookPriority: ['Salmos', 'Isaías', '2 Coríntios', 'João']
  },
  strength: {
    emotions: ['fear', 'doubt', 'weakness'],
    keywords: ['força', 'poder', 'coragem', 'valentia', 'firmeza'],
    bookPriority: ['Filipenses', 'Isaías', 'Salmos', 'Josué']
  },
  guidance: {
    emotions: ['confusion', 'doubt', 'uncertainty'],
    keywords: ['caminho', 'direção', 'guia', 'sabedoria', 'luz'],
    bookPriority: ['Provérbios', 'Salmos', 'João', 'Tiago']
  },
  love: {
    emotions: ['loneliness', 'rejection', 'unworthiness'],
    keywords: ['amor', 'carinho', 'aceitação', 'valorização'],
    bookPriority: ['1 João', 'João', 'Romanos', 'Efésios']
  },
  forgiveness: {
    emotions: ['guilt', 'shame', 'regret'],
    keywords: ['perdão', 'misericórdia', 'graça', 'purificação'],
    bookPriority: ['1 João', 'Salmos', 'Isaías', 'Efésios']
  },
  hope: {
    emotions: ['despair', 'depression', 'hopelessness'],
    keywords: ['esperança', 'futuro', 'promessa', 'renovação'],
    bookPriority: ['Jeremias', 'Romanos', 'Salmos', 'Isaías']
  },
  peace: {
    emotions: ['anxiety', 'worry', 'stress'],
    keywords: ['paz', 'tranquilidade', 'descanso', 'serenidade'],
    bookPriority: ['Filipenses', 'João', 'Salmos', 'Mateus']
  },
  joy: {
    emotions: ['sadness', 'depression', 'grief'],
    keywords: ['alegria', 'gozo', 'felicidade', 'celebração'],
    bookPriority: ['Salmos', 'Filipenses', 'Habacuque', 'Neemias']
  }
};

export interface EmotionAnalysis {
  primaryEmotion: string;
  confidence: number;
  intensity: number;
  themes: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
}

export interface VerseRecommendation {
  verse: BiblicalVerse;
  relevanceScore: number;
  emotionalMatch: number;
  thematicMatch: number;
  contextualFit: number;
}

export class AIEngine {
  // Machine learning weights (will be updated based on user feedback)
  private emotionWeights: Map<string, number> = new Map();
  private themeWeights: Map<string, number> = new Map();
  private verseSuccessRates: Map<string, number> = new Map();
  
  constructor() {
    this.initializeWeights();
    // Load biblical data when engine starts
    this.initializeBiblicalKnowledge();
  }

  private initializeWeights() {
    // Initialize emotion weights
    Object.keys(EMOTION_CATEGORIES).forEach(emotion => {
      this.emotionWeights.set(emotion, EMOTION_CATEGORIES[emotion].weight);
    });
    
    // Initialize theme weights
    Object.keys(VERSE_THEMES).forEach(theme => {
      this.themeWeights.set(theme, 1.0);
    });
  }

  private async initializeBiblicalKnowledge() {
    try {
      // Initialize with pre-defined verse associations
      this.loadPreTrainedData();
      console.log("📖 Biblical knowledge initialized");
    } catch (error) {
      console.error("Error initializing biblical knowledge:", error);
    }
  }

  private loadPreTrainedData() {
    // Pre-train with known good verse associations for common emotions
    const preTrainedData = [
      // Comfort and peace
      { verseKey: "salmos_23_4", emotion: "fear", score: 0.9 },
      { verseKey: "mateus_11_28", emotion: "sadness", score: 0.9 },
      { verseKey: "joao_14_27", emotion: "anxiety", score: 0.9 },
      
      // Joy and hope
      { verseKey: "salmos_30_5", emotion: "sadness", score: 0.8 },
      { verseKey: "neemias_8_10", emotion: "sadness", score: 0.8 },
      
      // Guidance
      { verseKey: "proverbios_3_5", emotion: "doubt", score: 0.9 },
      { verseKey: "salmos_119_105", emotion: "doubt", score: 0.8 },
      
      // Forgiveness
      { verseKey: "1_joao_1_9", emotion: "guilt", score: 0.9 },
      { verseKey: "salmos_51_10", emotion: "guilt", score: 0.8 },
    ];

    preTrainedData.forEach(data => {
      this.verseSuccessRates.set(`${data.verseKey}_${data.emotion}`, data.score);
    });
  }

  /**
   * Analyzes user input text to determine emotional content and context
   */
  public analyzeEmotion(text: string): EmotionAnalysis {
    const normalizedText = text.toLowerCase();
    const words = normalizedText.split(/\s+/);
    
    const emotionScores = new Map<string, number>();
    let totalEmotionalWords = 0;
    
    // Analyze each emotion category
    Object.entries(EMOTION_CATEGORIES).forEach(([emotion, config]) => {
      let score = 0;
      config.keywords.forEach(keyword => {
        const matches = this.countWordMatches(normalizedText, keyword);
        score += matches * this.emotionWeights.get(emotion)!;
        totalEmotionalWords += matches;
      });
      emotionScores.set(emotion, score);
    });
    
    // Find primary emotion
    const sortedEmotions = Array.from(emotionScores.entries())
      .sort(([,a], [,b]) => b - a);
    
    const primaryEmotion = sortedEmotions[0]?.[0] || 'neutral';
    const primaryScore = sortedEmotions[0]?.[1] || 0;
    
    // Calculate confidence based on score distribution
    const totalScore = Array.from(emotionScores.values()).reduce((a, b) => a + b, 0);
    const confidence = totalScore > 0 ? primaryScore / totalScore : 0.1;
    
    // Determine intensity
    const intensity = Math.min(totalEmotionalWords / words.length * 5, 1.0);
    
    // Identify themes
    const themes = this.identifyThemes(normalizedText, primaryEmotion);
    
    // Determine sentiment
    const sentiment = this.determineSentiment(primaryEmotion, emotionScores);
    
    return {
      primaryEmotion,
      confidence: Math.max(confidence, 0.1),
      intensity: Math.max(intensity, 0.1),
      themes,
      sentiment
    };
  }

  /**
   * Recommends verses based on emotional analysis and user context
   */
  public recommendVerses(
    emotionAnalysis: EmotionAnalysis,
    availableVerses: BiblicalVerse[],
    userHistory?: string[]
  ): VerseRecommendation[] {
    const recommendations: VerseRecommendation[] = [];
    
    availableVerses.forEach(verse => {
      const relevanceScore = this.calculateRelevanceScore(verse, emotionAnalysis);
      const emotionalMatch = this.calculateEmotionalMatch(verse, emotionAnalysis);
      const thematicMatch = this.calculateThematicMatch(verse, emotionAnalysis);
      const contextualFit = this.calculateContextualFit(verse, emotionAnalysis, userHistory);
      
      recommendations.push({
        verse,
        relevanceScore,
        emotionalMatch,
        thematicMatch,
        contextualFit
      });
    });
    
    // Sort by overall relevance score
    return recommendations
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 10); // Return top 10 recommendations
  }

  /**
   * Updates the AI model based on user feedback
   */
  public updateModelFromFeedback(
    verseId: string,
    emotion: string,
    feedback: 'helpful' | 'not_helpful' | 'very_helpful',
    context?: string
  ) {
    const feedbackScore = {
      'helpful': 0.1,
      'not_helpful': -0.1,
      'very_helpful': 0.2
    }[feedback];
    
    // Update verse success rate
    const currentRate = this.verseSuccessRates.get(verseId) || 0.5;
    this.verseSuccessRates.set(verseId, Math.max(0.1, Math.min(1.0, currentRate + feedbackScore)));
    
    // Update emotion weights
    const currentWeight = this.emotionWeights.get(emotion) || 1.0;
    this.emotionWeights.set(emotion, Math.max(0.1, Math.min(2.0, currentWeight + feedbackScore * 0.1)));
    
    // Update theme weights if context provided
    if (context) {
      const themes = this.identifyThemes(context.toLowerCase(), emotion);
      themes.forEach(theme => {
        const currentThemeWeight = this.themeWeights.get(theme) || 1.0;
        this.themeWeights.set(theme, Math.max(0.1, Math.min(2.0, currentThemeWeight + feedbackScore * 0.05)));
      });
    }
  }

  /**
   * Generates a contextual response based on the emotional analysis
   */
  public generateContextualResponse(emotionAnalysis: EmotionAnalysis, recommendedVerse?: BiblicalVerse): string {
    const { primaryEmotion, sentiment, themes } = emotionAnalysis;
    
    const responses = {
      positive: {
        joy: "Que alegria saber que você está em um momento de felicidade! A Palavra de Deus nos lembra que a alegria do Senhor é a nossa força.",
        peace: "É maravilhoso que você esteja experimentando paz. Deus é o Príncipe da Paz e deseja que vivamos em Sua tranquilidade.",
        hope: "Sua esperança é um reflexo da fé que Deus colocou em seu coração. Continue confiando em Suas promessas.",
        love: "O amor que você sente é um reflexo do próprio amor de Deus. Ele nos amou primeiro para que pudéssemos amar.",
        gratitude: "Sua gratidão é uma forma linda de adoração. Deus se alegra quando reconhecemos Suas bênçãos."
      },
      negative: {
        sadness: "Entendo que você está passando por um momento difícil. Deus está perto dos quebrantados de coração e salva os de espírito oprimido.",
        fear: "O medo pode ser avassalador, mas lembre-se de que Deus não nos deu espírito de temor, mas de poder, amor e moderação.",
        anger: "Sentir raiva é humano, mas a Palavra nos ensina a não pecar em nossa ira. Que Deus acalme seu coração.",
        guilt: "A culpa pode ser pesada, mas em Cristo há perdão completo. Não há condenação para os que estão Nele.",
        loneliness: "A solidão pode doer profundamente, mas saiba que Deus promete nunca nos deixar nem desamparar."
      },
      spiritual: {
        doubt: "Dúvidas fazem parte da jornada de fé. Até mesmo grandes homens de Deus questionaram. Busque a Deus em oração.",
        faith: "Sua fé é preciosa aos olhos de Deus. Continue crescendo na graça e no conhecimento de nosso Senhor.",
        worship: "Adorar a Deus é nosso maior privilégio. Que seu coração continue a exaltá-Lo em espírito e verdade.",
        repentance: "O arrependimento genuíno é o primeiro passo para a restauração. Deus é fiel e justo para perdoar.",
        forgiveness: "O perdão liberta tanto quem perdoa quanto quem é perdoado. Que a graça de Deus flua através de você."
      }
    };
    
    let response = "";
    
    if (sentiment === 'positive') {
      response = responses.positive[primaryEmotion] || "Que bênção ver você em um momento positivo! Deus se alegra com seus filhos.";
    } else if (sentiment === 'negative') {
      response = responses.negative[primaryEmotion] || "Compreendo que este é um momento desafiador. Deus está com você em todas as circunstâncias.";
    } else {
      response = responses.spiritual[primaryEmotion] || "Que Deus continue guiando você em sua jornada espiritual.";
    }
    
    if (recommendedVerse) {
      response += ` Este versículo em ${recommendedVerse.book} pode trazer luz para sua situação atual.`;
    }
    
    return response;
  }

  // Private helper methods
  private countWordMatches(text: string, keyword: string): number {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    const matches = text.match(regex);
    return matches ? matches.length : 0;
  }

  private identifyThemes(text: string, primaryEmotion: string): string[] {
    const themes: string[] = [];
    
    Object.entries(VERSE_THEMES).forEach(([theme, config]) => {
      if (config.emotions.includes(primaryEmotion)) {
        themes.push(theme);
      }
      
      const keywordMatches = config.keywords.some(keyword => 
        this.countWordMatches(text, keyword) > 0
      );
      
      if (keywordMatches && !themes.includes(theme)) {
        themes.push(theme);
      }
    });
    
    return themes.length > 0 ? themes : ['general'];
  }

  private determineSentiment(primaryEmotion: string, emotionScores: Map<string, number>): 'positive' | 'negative' | 'neutral' {
    const positiveEmotions = ['joy', 'peace', 'hope', 'love', 'gratitude', 'faith', 'worship'];
    const negativeEmotions = ['sadness', 'fear', 'anger', 'guilt', 'loneliness'];
    
    if (positiveEmotions.includes(primaryEmotion)) {
      return 'positive';
    } else if (negativeEmotions.includes(primaryEmotion)) {
      return 'negative';
    }
    
    return 'neutral';
  }

  private calculateRelevanceScore(verse: BiblicalVerse, analysis: EmotionAnalysis): number {
    const emotionalMatch = this.calculateEmotionalMatch(verse, analysis);
    const thematicMatch = this.calculateThematicMatch(verse, analysis);
    const contextualFit = this.calculateContextualFit(verse, analysis);
    
    // Weighted combination
    return (emotionalMatch * 0.4) + (thematicMatch * 0.4) + (contextualFit * 0.2);
  }

  private calculateEmotionalMatch(verse: BiblicalVerse, analysis: EmotionAnalysis): number {
    const verseText = verse.text.toLowerCase();
    let score = 0;
    
    // Check for emotional keywords in verse
    const emotionConfig = EMOTION_CATEGORIES[analysis.primaryEmotion];
    if (emotionConfig) {
      emotionConfig.keywords.forEach(keyword => {
        score += this.countWordMatches(verseText, keyword) * 0.2;
      });
    }
    
    // Consider verse success rate
    const successRate = this.verseSuccessRates.get(verse.id) || 0.5;
    score = score * successRate;
    
    return Math.min(score, 1.0);
  }

  private calculateThematicMatch(verse: BiblicalVerse, analysis: EmotionAnalysis): number {
    const verseText = verse.text.toLowerCase();
    let score = 0;
    
    analysis.themes.forEach(theme => {
      const themeConfig = VERSE_THEMES[theme];
      if (themeConfig) {
        themeConfig.keywords.forEach(keyword => {
          score += this.countWordMatches(verseText, keyword) * 0.15;
        });
        
        // Book priority bonus
        if (themeConfig.bookPriority.includes(verse.book)) {
          score += 0.1;
        }
      }
    });
    
    return Math.min(score, 1.0);
  }

  private calculateContextualFit(verse: BiblicalVerse, analysis: EmotionAnalysis, userHistory?: string[]): number {
    let score = 0.5; // Base score
    
    // Adjust based on confidence and intensity
    score += (analysis.confidence * 0.2);
    score += (analysis.intensity * 0.1);
    
    // Avoid recently shown verses if history provided
    if (userHistory && userHistory.includes(verse.id)) {
      score *= 0.7;
    }
    
    return Math.min(score, 1.0);
  }
}

// Export singleton instance
export const aiEngine = new AIEngine();