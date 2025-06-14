import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BookOpen, Search, Heart, Share, Bookmark, ChevronLeft, ChevronRight } from "lucide-react";

// Estrutura completa da Bíblia
const bibleStructure = {
  "Antigo Testamento": {
    "Pentateuco": [
      { name: "Gênesis", chapters: 50, abbrev: "Gn" },
      { name: "Êxodo", chapters: 40, abbrev: "Ex" },
      { name: "Levítico", chapters: 27, abbrev: "Lv" },
      { name: "Números", chapters: 36, abbrev: "Nm" },
      { name: "Deuteronômio", chapters: 34, abbrev: "Dt" }
    ],
    "Históricos": [
      { name: "Josué", chapters: 24, abbrev: "Js" },
      { name: "Juízes", chapters: 21, abbrev: "Jz" },
      { name: "Rute", chapters: 4, abbrev: "Rt" },
      { name: "1 Samuel", chapters: 31, abbrev: "1Sm" },
      { name: "2 Samuel", chapters: 24, abbrev: "2Sm" },
      { name: "1 Reis", chapters: 22, abbrev: "1Rs" },
      { name: "2 Reis", chapters: 25, abbrev: "2Rs" },
      { name: "1 Crônicas", chapters: 29, abbrev: "1Cr" },
      { name: "2 Crônicas", chapters: 36, abbrev: "2Cr" },
      { name: "Esdras", chapters: 10, abbrev: "Ed" },
      { name: "Neemias", chapters: 13, abbrev: "Ne" },
      { name: "Ester", chapters: 10, abbrev: "Et" }
    ],
    "Poéticos": [
      { name: "Jó", chapters: 42, abbrev: "Jó" },
      { name: "Salmos", chapters: 150, abbrev: "Sl" },
      { name: "Provérbios", chapters: 31, abbrev: "Pv" },
      { name: "Eclesiastes", chapters: 12, abbrev: "Ec" },
      { name: "Cantares", chapters: 8, abbrev: "Ct" }
    ],
    "Profetas Maiores": [
      { name: "Isaías", chapters: 66, abbrev: "Is" },
      { name: "Jeremias", chapters: 52, abbrev: "Jr" },
      { name: "Lamentações", chapters: 5, abbrev: "Lm" },
      { name: "Ezequiel", chapters: 48, abbrev: "Ez" },
      { name: "Daniel", chapters: 12, abbrev: "Dn" }
    ],
    "Profetas Menores": [
      { name: "Oseias", chapters: 14, abbrev: "Os" },
      { name: "Joel", chapters: 3, abbrev: "Jl" },
      { name: "Amós", chapters: 9, abbrev: "Am" },
      { name: "Obadias", chapters: 1, abbrev: "Ob" },
      { name: "Jonas", chapters: 4, abbrev: "Jn" },
      { name: "Miqueias", chapters: 7, abbrev: "Mq" },
      { name: "Naum", chapters: 3, abbrev: "Na" },
      { name: "Habacuque", chapters: 3, abbrev: "Hc" },
      { name: "Sofonias", chapters: 3, abbrev: "Sf" },
      { name: "Ageu", chapters: 2, abbrev: "Ag" },
      { name: "Zacarias", chapters: 14, abbrev: "Zc" },
      { name: "Malaquias", chapters: 4, abbrev: "Ml" }
    ]
  },
  "Novo Testamento": {
    "Evangelhos": [
      { name: "Mateus", chapters: 28, abbrev: "Mt" },
      { name: "Marcos", chapters: 16, abbrev: "Mc" },
      { name: "Lucas", chapters: 24, abbrev: "Lc" },
      { name: "João", chapters: 21, abbrev: "Jo" }
    ],
    "Histórico": [
      { name: "Atos", chapters: 28, abbrev: "At" }
    ],
    "Epístolas Paulinas": [
      { name: "Romanos", chapters: 16, abbrev: "Rm" },
      { name: "1 Coríntios", chapters: 16, abbrev: "1Co" },
      { name: "2 Coríntios", chapters: 13, abbrev: "2Co" },
      { name: "Gálatas", chapters: 6, abbrev: "Gl" },
      { name: "Efésios", chapters: 6, abbrev: "Ef" },
      { name: "Filipenses", chapters: 4, abbrev: "Fp" },
      { name: "Colossenses", chapters: 4, abbrev: "Cl" },
      { name: "1 Tessalonicenses", chapters: 5, abbrev: "1Ts" },
      { name: "2 Tessalonicenses", chapters: 3, abbrev: "2Ts" },
      { name: "1 Timóteo", chapters: 6, abbrev: "1Tm" },
      { name: "2 Timóteo", chapters: 4, abbrev: "2Tm" },
      { name: "Tito", chapters: 3, abbrev: "Tt" },
      { name: "Filemom", chapters: 1, abbrev: "Fm" }
    ],
    "Epístolas Gerais": [
      { name: "Hebreus", chapters: 13, abbrev: "Hb" },
      { name: "Tiago", chapters: 5, abbrev: "Tg" },
      { name: "1 Pedro", chapters: 5, abbrev: "1Pe" },
      { name: "2 Pedro", chapters: 3, abbrev: "2Pe" },
      { name: "1 João", chapters: 5, abbrev: "1Jo" },
      { name: "2 João", chapters: 1, abbrev: "2Jo" },
      { name: "3 João", chapters: 1, abbrev: "3Jo" },
      { name: "Judas", chapters: 1, abbrev: "Jd" }
    ],
    "Profético": [
      { name: "Apocalipse", chapters: 22, abbrev: "Ap" }
    ]
  }
};

// Versículos de exemplo (em uma aplicação real, isso viria de uma API)
const sampleVerses: Record<string, string> = {
  "João 3:16": "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.",
  "Salmos 23:1": "O Senhor é o meu pastor; nada me faltará.",
  "Filipenses 4:13": "Posso todas as coisas naquele que me fortalece.",
  "Isaías 41:10": "Não temas, porque eu sou contigo; não te assombres, porque eu sou o teu Deus; eu te fortaleço, e te ajudo, e te sustento com a minha destra fiel.",
  "Romanos 8:28": "Sabemos que Deus age em todas as coisas para o bem daqueles que o amam, dos que foram chamados de acordo com o seu propósito.",
  "Mateus 11:28": "Venham a mim, todos os que estão cansados e sobrecarregados, e eu darei descanso a vocês.",
  "1 Pedro 5:7": "Lancem sobre ele toda a sua ansiedade, porque ele tem cuidado de vocês.",
  "Jeremias 29:11": "Porque eu bem sei os pensamentos que tenho a vosso respeito, diz o Senhor; pensamentos de paz e não de mal, para vos dar o fim que esperais."
};

export default function Bible() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [selectedBook, setSelectedBook] = useState<string>("");
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"browse" | "search">("browse");
  const [favorites, setFavorites] = useState<string[]>([]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Acesso negado",
        description: "Você precisa estar logado para acessar a Bíblia.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [user, authLoading, toast]);

  const handleBookSelect = (bookName: string) => {
    setSelectedBook(bookName);
    setSelectedChapter(1);
    setViewMode("browse");
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    setViewMode("search");
  };

  const addToFavorites = (verse: string) => {
    if (!favorites.includes(verse)) {
      setFavorites([...favorites, verse]);
      toast({
        title: "Versículo salvo!",
        description: "Adicionado aos seus favoritos.",
      });
    }
  };

  const shareVerse = (verse: string, text: string) => {
    if (navigator.share) {
      navigator.share({
        title: `BibliaConnect - ${verse}`,
        text: `"${text}" - ${verse}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(`"${text}" - ${verse}`);
      toast({
        title: "Versículo copiado!",
        description: "O versículo foi copiado para a área de transferência.",
      });
    }
  };

  const getBookInfo = (bookName: string) => {
    for (const testament of Object.values(bibleStructure)) {
      for (const category of Object.values(testament)) {
        const book = category.find(b => b.name === bookName);
        if (book) return book;
      }
    }
    return null;
  };

  const generateChapterVerses = (book: string, chapter: number) => {
    // Simulação de versículos para demonstração
    const verseCount = Math.floor(Math.random() * 30) + 10; // 10-40 versículos por capítulo
    const verses = [];
    
    for (let i = 1; i <= verseCount; i++) {
      const reference = `${book} ${chapter}:${i}`;
      verses.push({
        number: i,
        text: sampleVerses[reference] || `Este é o versículo ${i} do capítulo ${chapter} de ${book}. Em uma implementação real, este texto viria de uma API bíblica completa.`,
        reference
      });
    }
    return verses;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-spiritual-blue rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600">Carregando Bíblia...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-light-background">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => window.location.href = '/'}
                className="text-deep-blue-gray hover:text-spiritual-blue"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-spiritual-blue rounded-full flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-bold text-spiritual-blue">Bíblia Sagrada</span>
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="flex-1 max-w-md mx-8">
              <div className="relative">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Pesquisar versículos, palavras ou referências..."
                  className="pr-10"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                />
                <Button
                  size="sm"
                  onClick={handleSearch}
                  className="absolute right-1 top-1 h-8 w-8 p-0 bg-spiritual-blue hover:bg-blue-600"
                >
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">
                {favorites.length} favoritos
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar - Book Navigation */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center text-deep-blue-gray">
                  <BookOpen className="w-5 h-5 text-spiritual-blue mr-2" />
                  Livros da Bíblia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  {Object.entries(bibleStructure).map(([testament, categories]) => (
                    <div key={testament} className="mb-6">
                      <h4 className="font-semibold text-deep-blue-gray mb-3 text-sm">
                        {testament}
                      </h4>
                      {Object.entries(categories).map(([category, books]) => (
                        <div key={category} className="mb-4">
                          <h5 className="text-xs text-gray-600 mb-2 font-medium">
                            {category}
                          </h5>
                          <div className="space-y-1">
                            {books.map((book) => (
                              <Button
                                key={book.name}
                                variant={selectedBook === book.name ? "default" : "ghost"}
                                size="sm"
                                onClick={() => handleBookSelect(book.name)}
                                className="w-full justify-start text-left text-xs h-8"
                              >
                                <span className="truncate">{book.name}</span>
                                <span className="ml-auto text-xs text-gray-500">
                                  {book.chapters}
                                </span>
                              </Button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
          
          {/* Main Content */}
          <div className="lg:col-span-3">
            {viewMode === "browse" ? (
              selectedBook ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-deep-blue-gray">
                        {selectedBook}
                      </CardTitle>
                      <div className="flex items-center space-x-2">
                        <Select 
                          value={selectedChapter.toString()} 
                          onValueChange={(value) => setSelectedChapter(parseInt(value))}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: getBookInfo(selectedBook)?.chapters || 1 }, (_, i) => (
                              <SelectItem key={i + 1} value={(i + 1).toString()}>
                                Capítulo {i + 1}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedChapter(Math.max(1, selectedChapter - 1))}
                            disabled={selectedChapter === 1}
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedChapter(Math.min(getBookInfo(selectedBook)?.chapters || 1, selectedChapter + 1))}
                            disabled={selectedChapter === (getBookInfo(selectedBook)?.chapters || 1)}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {generateChapterVerses(selectedBook, selectedChapter).map((verse) => (
                        <div key={verse.number} className="group">
                          <div className="flex items-start space-x-3">
                            <Badge variant="outline" className="text-xs mt-1 flex-shrink-0">
                              {verse.number}
                            </Badge>
                            <div className="flex-1">
                              <p className="text-deep-blue-gray font-scripture leading-relaxed">
                                {verse.text}
                              </p>
                              <div className="flex items-center space-x-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => addToFavorites(verse.reference)}
                                  className="text-gray-500 hover:text-red-500 h-8 px-2"
                                >
                                  <Heart className="w-3 h-3 mr-1" />
                                  Favoritar
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => shareVerse(verse.reference, verse.text)}
                                  className="text-gray-500 hover:text-spiritual-blue h-8 px-2"
                                >
                                  <Share className="w-3 h-3 mr-1" />
                                  Compartilhar
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-gray-500 hover:text-spiritual-blue h-8 px-2"
                                >
                                  <Bookmark className="w-3 h-3 mr-1" />
                                  Salvar
                                </Button>
                              </div>
                            </div>
                          </div>
                          {verse.number < generateChapterVerses(selectedBook, selectedChapter).length && (
                            <Separator className="mt-4" />
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">
                      Selecione um Livro
                    </h3>
                    <p className="text-gray-500">
                      Escolha um livro da Bíblia na barra lateral para começar a ler
                    </p>
                  </CardContent>
                </Card>
              )
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-deep-blue-gray">
                    Resultados da pesquisa: "{searchQuery}"
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(sampleVerses)
                      .filter(([ref, text]) => 
                        text.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        ref.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map(([reference, text]) => (
                        <div key={reference} className="group border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <Badge variant="outline" className="text-spiritual-blue">
                              {reference}
                            </Badge>
                            <div className="flex items-center space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => addToFavorites(reference)}
                                className="text-gray-500 hover:text-red-500 h-8 px-2"
                              >
                                <Heart className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => shareVerse(reference, text)}
                                className="text-gray-500 hover:text-spiritual-blue h-8 px-2"
                              >
                                <Share className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-deep-blue-gray font-scripture leading-relaxed">
                            "{text}"
                          </p>
                        </div>
                      ))}
                    {Object.entries(sampleVerses)
                      .filter(([ref, text]) => 
                        text.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        ref.toLowerCase().includes(searchQuery.toLowerCase())
                      ).length === 0 && (
                      <div className="text-center py-8">
                        <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-600 mb-2">
                          Nenhum resultado encontrado
                        </h3>
                        <p className="text-gray-500">
                          Tente pesquisar com outras palavras-chave
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}