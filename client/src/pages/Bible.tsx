import { useState, useEffect } from "react";
import { Book, ChevronRight, Search, Bookmark, Share2, ChevronLeft, Heart, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface BiblicalBook {
  id: string;
  name: string;
  abbreviation: string;
  testament: string;
  order: number;
  chapters: number;
}

interface BiblicalChapter {
  id: string;
  bookId: string;
  chapterNumber: number;
  verses: number;
}

interface BiblicalVerse {
  id: string;
  bookId: string;
  chapterId: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  translation: string;
  emotions?: string[];
  keywords?: string[];
}

interface BiblicalBookmark {
  id: string;
  userId: string;
  verseId: string;
  note?: string;
  createdAt: string;
}

export default function Bible() {
  const [selectedBook, setSelectedBook] = useState<BiblicalBook | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState<"books" | "chapters" | "verses">("books");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch biblical books from our database
  const { data: books = [], isLoading: booksLoading } = useQuery({
    queryKey: ["/api/bible/books"],
  });

  // Fetch chapters for selected book
  const { data: chapters = [] } = useQuery({
    queryKey: ["/api/bible/books", selectedBook?.id, "chapters"],
    enabled: !!selectedBook,
  });

  // Fetch verses for selected book and chapter
  const { data: verses = [] } = useQuery({
    queryKey: ["/api/bible/verses", { bookId: selectedBook?.id, chapter: selectedChapter }],
    enabled: !!selectedBook && selectedChapter > 0,
  });

  // Fetch user bookmarks
  const { data: bookmarks = [] } = useQuery({
    queryKey: ["/api/bible/bookmarks"],
  });

  // Create bookmark mutation
  const createBookmarkMutation = useMutation({
    mutationFn: async (data: { verseId: string; note?: string }) => {
      return await apiRequest("/api/bible/bookmarks", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bible/bookmarks"] });
      toast({
        title: "Versículo salvo",
        description: "O versículo foi adicionado aos seus favoritos.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível salvar o versículo.",
        variant: "destructive",
      });
    },
  });

  // Delete bookmark mutation
  const deleteBookmarkMutation = useMutation({
    mutationFn: async (bookmarkId: string) => {
      return await apiRequest(`/api/bible/bookmarks/${bookmarkId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bible/bookmarks"] });
      toast({
        title: "Favorito removido",
        description: "O versículo foi removido dos seus favoritos.",
      });
    },
  });

  const handleBookSelect = (book: BiblicalBook) => {
    setSelectedBook(book);
    setSelectedChapter(1);
    setView("chapters");
  };

  const handleChapterSelect = (chapterNumber: number) => {
    setSelectedChapter(chapterNumber);
    setView("verses");
  };

  const handleBookmark = (verse: BiblicalVerse) => {
    const existingBookmark = bookmarks.find((b: BiblicalBookmark) => b.verseId === verse.id);
    
    if (existingBookmark) {
      deleteBookmarkMutation.mutate(existingBookmark.id);
    } else {
      createBookmarkMutation.mutate({ verseId: verse.id });
    }
  };

  const isBookmarked = (verseId: string) => {
    return bookmarks.some((b: BiblicalBookmark) => b.verseId === verseId);
  };

  const shareVerse = (verse: BiblicalVerse) => {
    const text = `"${verse.text}" - ${verse.book} ${verse.chapter}:${verse.verse}`;
    if (navigator.share) {
      navigator.share({ text });
    } else {
      navigator.clipboard.writeText(text);
      toast({
        title: "Versículo copiado",
        description: "O versículo foi copiado para a área de transferência.",
      });
    }
  };

  const goBack = () => {
    if (view === "verses") {
      setView("chapters");
    } else if (view === "chapters") {
      setView("books");
      setSelectedBook(null);
    }
  };

  const oldTestamentBooks = books.filter((book: BiblicalBook) => book.testament === "old");
  const newTestamentBooks = books.filter((book: BiblicalBook) => book.testament === "new");

  if (booksLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Carregando Bíblia Sagrada...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          {view !== "books" && (
            <Button variant="ghost" size="sm" onClick={goBack}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          )}
          <div>
            <h1 className="text-3xl font-bold">Bíblia Sagrada</h1>
            <p className="text-muted-foreground">
              {view === "books" && "Selecione um livro para começar a leitura"}
              {view === "chapters" && selectedBook && `${selectedBook.name} - Selecione um capítulo`}
              {view === "verses" && selectedBook && `${selectedBook.name} ${selectedChapter}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar versículos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
      </div>

      {view === "books" && (
        <div className="grid gap-8">
          {/* Old Testament */}
          <div>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Book className="h-6 w-6" />
              Antigo Testamento
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {oldTestamentBooks.map((book: BiblicalBook) => (
                <Card
                  key={book.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleBookSelect(book)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{book.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {book.chapters} capítulos
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* New Testament */}
          <div>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Book className="h-6 w-6" />
              Novo Testamento
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {newTestamentBooks.map((book: BiblicalBook) => (
                <Card
                  key={book.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleBookSelect(book)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{book.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {book.chapters} capítulos
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {view === "chapters" && selectedBook && (
        <div>
          <div className="grid grid-cols-5 md:grid-cols-10 lg:grid-cols-15 gap-2 mb-8">
            {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map((chapterNum) => (
              <Button
                key={chapterNum}
                variant={chapterNum === selectedChapter ? "default" : "outline"}
                size="sm"
                onClick={() => handleChapterSelect(chapterNum)}
                className="aspect-square"
              >
                {chapterNum}
              </Button>
            ))}
          </div>
        </div>
      )}

      {view === "verses" && selectedBook && verses.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">
              {selectedBook.name} {selectedChapter}
            </h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={selectedChapter <= 1}
                onClick={() => handleChapterSelect(selectedChapter - 1)}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={selectedChapter >= selectedBook.chapters}
                onClick={() => handleChapterSelect(selectedChapter + 1)}
              >
                Próximo
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {verses.map((verse: BiblicalVerse) => (
              <Card key={verse.id} className="p-6">
                <div className="flex items-start gap-4">
                  <Badge variant="secondary" className="mt-1 font-mono">
                    {verse.verse}
                  </Badge>
                  <div className="flex-1">
                    <p className="text-lg leading-relaxed mb-4">{verse.text}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {verse.book} {verse.chapter}:{verse.verse} - {verse.translation}
                        </span>
                        {verse.emotions && verse.emotions.length > 0 && (
                          <div className="flex gap-1">
                            {verse.emotions.slice(0, 3).map((emotion) => (
                              <Badge key={emotion} variant="outline" className="text-xs">
                                {emotion}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleBookmark(verse)}
                          className={isBookmarked(verse.id) ? "text-red-500" : ""}
                        >
                          <Heart
                            className={`h-4 w-4 ${
                              isBookmarked(verse.id) ? "fill-current" : ""
                            }`}
                          />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => shareVerse(verse)}
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {view === "verses" && selectedBook && verses.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Capítulo não disponível</h3>
          <p className="text-muted-foreground">
            Este capítulo ainda não foi carregado em nossa base de dados.
          </p>
        </div>
      )}
    </div>
  );
}