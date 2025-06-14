/**
 * Sistema Inteligente de IA para Correlação Bíblica
 * Analisa texto do usuário e correlaciona com versículos usando tags emocionais e palavras-chave
 */

import { BiblicalVerse } from '@shared/schema';

// Dicionário expandido de emoções e palavras-chave
export const EMOTIONAL_KEYWORDS = {
  // Emoções negativas
  tristeza: ['triste', 'tristeza', 'melancolia', 'deprimido', 'desanimado', 'abatido', 'luto', 'perda', 'chorando', 'lágrimas'],
  ansiedade: ['ansioso', 'ansiedade', 'nervoso', 'preocupado', 'angústia', 'angustiado', 'inquieto', 'tenso', 'estresse'],
  medo: ['medo', 'miedoso', 'assustado', 'terror', 'pavor', 'temor', 'receio', 'fobia', 'pânico'],
  raiva: ['raiva', 'raivoso', 'irritado', 'furioso', 'irado', 'zangado', 'revoltado', 'indignado', 'bravo'],
  solidão: ['sozinho', 'solidão', 'isolado', 'abandonado', 'rejeitado', 'excluído', 'solitário'],
  dúvida: ['dúvida', 'duvidando', 'incerto', 'confuso', 'perdido', 'questionando', 'incerteza'],
  
  // Emoções positivas
  alegria: ['alegre', 'alegria', 'feliz', 'felicidade', 'contente', 'radiante', 'animado', 'eufórico'],
  paz: ['paz', 'tranquilo', 'calmo', 'sereno', 'pacífico', 'equilibrado', 'harmonioso'],
  amor: ['amor', 'amoroso', 'carinho', 'carinhoso', 'afeto', 'ternura', 'compaixão'],
  gratidão: ['grato', 'gratidão', 'agradecido', 'reconhecido', 'abençoado', 'agradecimento'],
  esperança: ['esperança', 'esperançoso', 'otimista', 'confiante', 'fé', 'expectativa'],
  força: ['forte', 'força', 'corajoso', 'determinado', 'resistente', 'valente', 'perseverante'],
  
  // Situações específicas
  perdão: ['perdão', 'perdoar', 'perdoado', 'arrependimento', 'arrependido', 'reconciliação'],
  trabalho: ['trabalho', 'emprego', 'carreira', 'profissão', 'ocupação', 'serviço'],
  família: ['família', 'pai', 'mãe', 'filho', 'filha', 'irmão', 'irmã', 'parente', 'casamento'],
  saúde: ['doença', 'doente', 'enfermo', 'saúde', 'cura', 'healing', 'medicina', 'hospital'],
  dinheiro: ['dinheiro', 'dívida', 'pobreza', 'riqueza', 'financeiro', 'provisão', 'necessidade']
};

// Tags emocionais para categorizar versículos
export const VERSE_EMOTIONAL_TAGS = {
  // Consolação e paz
  'Salmos 23:4': ['medo', 'proteção', 'paz', 'conforto'],
  'João 14:27': ['paz', 'ansiedade', 'tranquilidade'],
  'Filipenses 4:6-7': ['ansiedade', 'preocupação', 'paz', 'oração'],
  'Mateus 11:28': ['cansaço', 'descanso', 'alívio', 'paz'],
  
  // Força e coragem
  'Josué 1:9': ['medo', 'coragem', 'força', 'determinação'],
  'Isaías 41:10': ['medo', 'força', 'proteção', 'confiança'],
  'Filipenses 4:13': ['força', 'capacidade', 'determinação'],
  
  // Amor e relacionamentos
  '1 Coríntios 13:4-7': ['amor', 'relacionamento', 'paciência'],
  'João 3:16': ['amor', 'salvação', 'esperança'],
  'Romanos 8:38-39': ['amor', 'segurança', 'proteção'],
  
  // Perdão e arrependimento
  '1 João 1:9': ['perdão', 'arrependimento', 'limpeza'],
  'Salmos 51:10': ['arrependimento', 'renovação', 'pureza'],
  'Mateus 6:14-15': ['perdão', 'relacionamento'],
  
  // Provisão e necessidades
  'Filipenses 4:19': ['provisão', 'necessidade', 'dinheiro'],
  'Mateus 6:26': ['preocupação', 'provisão', 'cuidado'],
  'Salmos 37:25': ['provisão', 'fidelidade'],
  
  // Sabedoria e direção
  'Provérbios 3:5-6': ['direção', 'confiança', 'sabedoria'],
  'Jeremias 29:11': ['futuro', 'planos', 'esperança'],
  'Tiago 1:5': ['sabedoria', 'decisão', 'direção']
};

export interface EmotionalAnalysis {
  primaryEmotion: string;
  confidence: number;
  intensity: number;
  keywords: string[];
  themes: string[];
  context: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

export interface VerseMatch {
  verse: BiblicalVerse;
  relevanceScore: number;
  emotionalMatch: number;
  keywordMatches: string[];
  contextMatch: number;
}

export class IntelligentBiblicalAI {
  
  /**
   * Analisa o texto do usuário para extrair emoções, contexto e intenções
   */
  analyzeUserInput(text: string): EmotionalAnalysis {
    const lowercaseText = text.toLowerCase();
    const words = lowercaseText.split(/\s+/);
    
    // Detectar palavras-chave emocionais
    const detectedEmotions: { [key: string]: number } = {};
    const foundKeywords: string[] = [];
    
    // Analisar cada categoria emocional
    for (const [emotion, keywords] of Object.entries(EMOTIONAL_KEYWORDS)) {
      let emotionScore = 0;
      
      for (const keyword of keywords) {
        if (lowercaseText.includes(keyword)) {
          emotionScore += 1;
          foundKeywords.push(keyword);
        }
      }
      
      if (emotionScore > 0) {
        detectedEmotions[emotion] = emotionScore;
      }
    }
    
    // Determinar emoção primária
    const primaryEmotion = Object.keys(detectedEmotions).length > 0 
      ? Object.entries(detectedEmotions).sort(([,a], [,b]) => b - a)[0][0]
      : 'neutro';
    
    // Calcular confiança baseada na quantidade de palavras-chave encontradas
    const confidence = Math.min(foundKeywords.length / 3, 1);
    
    // Determinar intensidade baseada na repetição e contexto
    const intensity = this.calculateIntensity(text, foundKeywords);
    
    // Identificar temas contextuais
    const themes = this.identifyThemes(text, primaryEmotion);
    
    // Determinar sentimento geral
    const sentiment = this.determineSentiment(primaryEmotion, detectedEmotions);
    
    // Gerar contexto descritivo
    const context = this.generateContext(primaryEmotion, themes, foundKeywords);
    
    return {
      primaryEmotion,
      confidence,
      intensity,
      keywords: foundKeywords,
      themes,
      context,
      sentiment
    };
  }
  
  /**
   * Encontra versículos relevantes baseado na análise emocional
   */
  findRelevantVerses(analysis: EmotionalAnalysis, allVerses: BiblicalVerse[]): VerseMatch[] {
    const matches: VerseMatch[] = [];
    
    for (const verse of allVerses) {
      const relevanceScore = this.calculateRelevanceScore(analysis, verse);
      
      if (relevanceScore > 0.3) { // Threshold mínimo de relevância
        matches.push({
          verse,
          relevanceScore,
          emotionalMatch: this.calculateEmotionalMatch(analysis, verse),
          keywordMatches: this.findKeywordMatches(analysis.keywords, verse.text),
          contextMatch: this.calculateContextMatch(analysis.themes, verse)
        });
      }
    }
    
    // Ordenar por relevância
    return matches.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }
  
  /**
   * Gera uma resposta contextual inteligente
   */
  generateIntelligentResponse(analysis: EmotionalAnalysis, topVerse?: BiblicalVerse): string {
    const { primaryEmotion, context, themes } = analysis;
    
    if (!topVerse) {
      return this.generateGeneralEncouragement(primaryEmotion);
    }
    
    // Gerar resposta personalizada baseada na emoção e versículo
    const responses = this.getEmotionalResponseTemplates(primaryEmotion);
    const selectedTemplate = responses[Math.floor(Math.random() * responses.length)];
    
    return selectedTemplate
      .replace('{verse}', `"${topVerse.text}" - ${topVerse.book} ${topVerse.chapter}:${topVerse.verse}`)
      .replace('{context}', context)
      .replace('{emotion}', primaryEmotion);
  }
  
  private calculateIntensity(text: string, keywords: string[]): number {
    // Verificar intensificadores
    const intensifiers = ['muito', 'extremamente', 'completamente', 'totalmente', 'profundamente'];
    const hasIntensifiers = intensifiers.some(word => text.toLowerCase().includes(word));
    
    // Verificar pontuação expressiva
    const exclamationMarks = (text.match(/!/g) || []).length;
    const questionMarks = (text.match(/\?/g) || []).length;
    
    let intensity = keywords.length / 5; // Base na quantidade de palavras-chave
    
    if (hasIntensifiers) intensity += 0.3;
    if (exclamationMarks > 0) intensity += 0.2;
    if (questionMarks > 1) intensity += 0.1;
    
    return Math.min(intensity, 1);
  }
  
  private identifyThemes(text: string, primaryEmotion: string): string[] {
    const themes: string[] = [];
    const lowercaseText = text.toLowerCase();
    
    // Temas relacionais
    if (lowercaseText.includes('família') || lowercaseText.includes('casamento') || lowercaseText.includes('relacionamento')) {
      themes.push('relacionamento');
    }
    
    // Temas profissionais
    if (lowercaseText.includes('trabalho') || lowercaseText.includes('emprego') || lowercaseText.includes('carreira')) {
      themes.push('trabalho');
    }
    
    // Temas financeiros
    if (lowercaseText.includes('dinheiro') || lowercaseText.includes('dívida') || lowercaseText.includes('financeiro')) {
      themes.push('financeiro');
    }
    
    // Temas de saúde
    if (lowercaseText.includes('saúde') || lowercaseText.includes('doença') || lowercaseText.includes('cura')) {
      themes.push('saúde');
    }
    
    // Temas espirituais
    if (lowercaseText.includes('deus') || lowercaseText.includes('oração') || lowercaseText.includes('fé')) {
      themes.push('espiritual');
    }
    
    // Adicionar tema baseado na emoção primária
    if (!themes.length) {
      themes.push(primaryEmotion);
    }
    
    return themes;
  }
  
  private determineSentiment(primaryEmotion: string, emotions: { [key: string]: number }): 'positive' | 'negative' | 'neutral' {
    const negativeEmotions = ['tristeza', 'ansiedade', 'medo', 'raiva', 'solidão', 'dúvida'];
    const positiveEmotions = ['alegria', 'paz', 'amor', 'gratidão', 'esperança', 'força'];
    
    if (negativeEmotions.includes(primaryEmotion)) return 'negative';
    if (positiveEmotions.includes(primaryEmotion)) return 'positive';
    
    return 'neutral';
  }
  
  private generateContext(primaryEmotion: string, themes: string[], keywords: string[]): string {
    const contexts: { [key: string]: string } = {
      tristeza: 'Momento de dor e necessidade de consolação',
      ansiedade: 'Situação de preocupação que precisa de paz',
      medo: 'Enfrentando incertezas que requerem coragem',
      alegria: 'Tempo de celebração e gratidão',
      paz: 'Busca por tranquilidade e serenidade',
      amor: 'Foco em relacionamentos e afeto',
      esperança: 'Necessidade de encorajamento e perspectiva futura'
    };
    
    return contexts[primaryEmotion] || `Reflexão sobre ${themes.join(', ')}`;
  }
  
  private calculateRelevanceScore(analysis: EmotionalAnalysis, verse: BiblicalVerse): number {
    let score = 0;
    
    // Score baseado em correspondência de palavras-chave
    const keywordMatches = this.findKeywordMatches(analysis.keywords, verse.text);
    score += keywordMatches.length * 0.3;
    
    // Score baseado em tags emocionais predefinidas
    const verseReference = `${verse.book} ${verse.chapter}:${verse.verse}`;
    const verseTags = (VERSE_EMOTIONAL_TAGS as { [key: string]: string[] })[verseReference] || [];
    
    if (verseTags.includes(analysis.primaryEmotion)) {
      score += 0.5;
    }
    
    // Score baseado em temas
    for (const theme of analysis.themes) {
      if (verseTags.includes(theme)) {
        score += 0.2;
      }
    }
    
    // Score baseado na análise de texto do versículo
    const verseWords = verse.text.toLowerCase();
    for (const keyword of analysis.keywords) {
      if (verseWords.includes(keyword)) {
        score += 0.1;
      }
    }
    
    return Math.min(score, 1);
  }
  
  private calculateEmotionalMatch(analysis: EmotionalAnalysis, verse: BiblicalVerse): number {
    const verseReference = `${verse.book} ${verse.chapter}:${verse.verse}`;
    const verseTags = (VERSE_EMOTIONAL_TAGS as { [key: string]: string[] })[verseReference] || [];
    
    return verseTags.includes(analysis.primaryEmotion) ? 1 : 0;
  }
  
  private findKeywordMatches(keywords: string[], verseText: string): string[] {
    const matches: string[] = [];
    const lowercaseVerse = verseText.toLowerCase();
    
    for (const keyword of keywords) {
      if (lowercaseVerse.includes(keyword)) {
        matches.push(keyword);
      }
    }
    
    return matches;
  }
  
  private calculateContextMatch(themes: string[], verse: BiblicalVerse): number {
    // Implementar lógica mais sofisticada de matching contextual
    return 0.5; // Placeholder
  }
  
  private generateGeneralEncouragement(emotion: string): string {
    const encouragements: { [key: string]: string } = {
      tristeza: "Nos momentos de tristeza, lembre-se de que Deus está próximo aos quebrantados de coração. Ele conhece sua dor e tem palavras de consolação para você.",
      ansiedade: "Quando a ansiedade tenta dominar seus pensamentos, entregue suas preocupações a Deus. Ele cuida de você e tem o controle de todas as situações.",
      medo: "O medo não vem de Deus. Ele nos deu espírito de poder, amor e moderação. Confie na proteção divina sobre sua vida.",
      alegria: "Que bom ver você em um momento de alegria! Continue celebrando as bênçãos de Deus em sua vida.",
      esperança: "A esperança em Deus nunca decepciona. Ele tem planos de bem para o seu futuro."
    };
    
    return encouragements[emotion] || "Deus tem uma palavra especial para você hoje. Confie em Seu amor e direção.";
  }
  
  private getEmotionalResponseTemplates(emotion: string): string[] {
    const templates: { [key: string]: string[] } = {
      tristeza: [
        "Entendo que você está passando por um momento difícil. A Palavra de Deus nos lembra: {verse}. {context} - Deus está próximo a você neste momento.",
        "Nos momentos de dor, Deus tem palavras especiais de consolação. Veja o que Ele diz: {verse}. Você não está sozinho nesta jornada."
      ],
      ansiedade: [
        "Quando a preocupação tenta dominar nossos pensamentos, Deus nos convida a confiar. {verse}. Entregue suas ansiedades a Ele.",
        "A paz de Deus é maior que qualquer ansiedade. Medite nesta verdade: {verse}. Respire fundo e confie no cuidado divino."
      ],
      medo: [
        "O medo não tem a última palavra sobre sua vida. Deus declara: {verse}. Você pode caminhar com coragem, pois Ele está com você.",
        "Quando o medo bater à porta, lembre-se desta promessa: {verse}. Deus é seu protetor e guardião."
      ],
      alegria: [
        "Que alegria perceber sua gratidão! Deus se alegra conosco: {verse}. Continue celebrando as bênçãos divinas.",
        "Momentos de alegria são presentes de Deus. Como está escrito: {verse}. Compartilhe essa alegria com outros."
      ]
    };
    
    return templates[emotion] || [
      "Deus tem uma palavra especial para você: {verse}. Confie em Seu amor e direção para sua vida."
    ];
  }
}

// Instância singleton para uso em toda a aplicação
export const intelligentAI = new IntelligentBiblicalAI();