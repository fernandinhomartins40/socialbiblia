// Tipos específicos para as APIs

import { BiblicalVerse } from '../schemas/bible';

export interface BibleSearchResult {
  id: string;
  type: 'verse' | 'ai_response';
  verse?: {
    book: string;
    chapter: number;
    verse: number;
    text: string;
    translation: string;
  };
  aiResponse?: {
    text: string;
    emotion: string;
    context: string;
  };
  relevanceScore?: number;
}

export interface BibleSearchResponse {
  results: BibleSearchResult[];
}

export interface AISearchResponse {
  id: string;
  response: string;
  emotion: string;
  confidence: number;
  intensity: number;
  themes: string[];
  verse?: {
    book: string;
    chapter: number;
    verse: number;
    text: string;
  } | null;
  recommendations: {
    verse: {
      book: string;
      chapter: number;
      verse: number;
      text: string;
    };
    relevanceScore: number;
  }[];
}

export interface LLMStatusResponse {
  available: boolean;
  model?: string;
  status?: string;
  error?: string;
}

export interface AIAnalyticsResponse {
  totalInteractions: number;
  emotionalProfile: {
    emotion: string;
    frequency: number;
    count: number;
  }[];
  recentInteractions: {
    id: string;
    emotion: string | null;
    createdAt: Date;
    userMessage: string;
  }[];
  insights: {
    primaryEmotion: string;
    emotionalDiversity: number;
    averageSessionsPerWeek: number;
    spiritualGrowthScore: number;
    recommendation: string;
  };
}

export interface BookmarkData {
  id: string;
  userId: string;
  verseId: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  note?: string | null;
  createdAt: Date;
}

export interface RandomVerseResponse extends BiblicalVerse {
  // Herda de BiblicalVerse
}