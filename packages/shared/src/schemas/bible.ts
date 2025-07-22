import { z } from 'zod';

// Schema para busca na Bíblia
export const bibleSearchSchema = z.object({
  query: z.string().min(1, 'Termo de busca é obrigatório'),
  maxResults: z.number().min(1).max(50).default(10),
});

// Schema para busca com IA na Bíblia
export const bibleAISearchSchema = z.object({
  query: z.string().min(1, 'Pergunta é obrigatória'),
  type: z.enum(['emotion', 'topic', 'general']).optional(),
  emotion: z.string().optional(),
});

// Schema para bookmark/favorito de versículo
export const createBookmarkSchema = z.object({
  verseId: z.string(),
  book: z.string(),
  chapter: z.number(),
  verse: z.number(),
  text: z.string(),
  note: z.string().max(500, 'Nota muito longa').optional(),
});

// Schema para versículo bíblico
export const biblicalVerseSchema = z.object({
  id: z.string(),
  book: z.string(),
  chapter: z.number(),
  verse: z.number(),
  text: z.string(),
  translation: z.string().default('NVI'),
  emotions: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),
});

// Schema para livro bíblico
export const biblicalBookSchema = z.object({
  id: z.string(),
  name: z.string(),
  abbreviation: z.string(),
  testament: z.enum(['old', 'new']),
  order: z.number(),
  chapters: z.number(),
});

// Schema para capítulo bíblico
export const biblicalChapterSchema = z.object({
  id: z.string(),
  bookId: z.string(),
  chapterNumber: z.number(),
  verses: z.number(),
});

// Types
export type BibleSearchData = z.infer<typeof bibleSearchSchema>;
export type BibleAISearchData = z.infer<typeof bibleAISearchSchema>;
export type CreateBookmarkData = z.infer<typeof createBookmarkSchema>;
export type BiblicalVerse = z.infer<typeof biblicalVerseSchema>;
export type BiblicalBook = z.infer<typeof biblicalBookSchema>;
export type BiblicalChapter = z.infer<typeof biblicalChapterSchema>;