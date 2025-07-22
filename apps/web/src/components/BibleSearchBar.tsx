import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError, redirectToAuth } from "@/lib/authUtils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Search, Sparkles, BookOpen, Heart, Share, Copy, Loader2 } from "lucide-react";

interface SearchResult {
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

export default function BibleSearchBar() {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchMode, setSearchMode] = useState<"search" | "ai">("search");

  const searchMutation = useMutation({
    mutationFn: async (searchQuery: string) => {
      const endpoint = searchMode === "ai" ? "/api/bible/ai-search" : "/api/bible/search";
      const response = await apiRequest("POST", endpoint, { 
        query: searchQuery,
        includeContext: true,
        maxResults: 10 
      });
      return response.json();
    },
    onSuccess: (data) => {
      setResults(data.results || []);
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Não autorizado",
          description: "Você precisa estar logado para usar a busca bíblica.",
          variant: "destructive",
        });
        setTimeout(() => {
          redirectToAuth();
        }, 500);
        return;
      }
      toast({
        title: "Erro na busca",
        description: "Não foi possível realizar a busca. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleSearch = () => {
    if (!query.trim()) return;
    // Clear previous results before starting new search
    setResults([]);
    searchMutation.mutate(query.trim());
  };

  const handleQuickSearch = (quickQuery: string) => {
    setQuery(quickQuery);
    // Clear previous results before starting new search
    setResults([]);
    searchMutation.mutate(quickQuery);
  };

  const copyVerse = (verse: any) => {
    const text = `"${verse.text}" - ${verse.book} ${verse.chapter}:${verse.verse}`;
    navigator.clipboard.writeText(text);
    toast({
      title: "Versículo copiado!",
      description: "O versículo foi copiado para a área de transferência.",
    });
  };

  const shareVerse = (verse: any) => {
    const text = `"${verse.text}" - ${verse.book} ${verse.chapter}:${verse.verse}`;
    if (navigator.share) {
      navigator.share({
        title: `BibliaConnect - ${verse.book} ${verse.chapter}:${verse.verse}`,
        text: text,
        url: window.location.href,
      });
    } else {
      copyVerse(verse);
    }
  };

  const quickSearches = [
    { label: "Ansiedade", query: "Como lidar com ansiedade", color: "bg-red-100 text-red-800" },
    { label: "Esperança", query: "Versículos sobre esperança", color: "bg-green-100 text-green-800" },
    { label: "Amor", query: "O que a Bíblia diz sobre amor", color: "bg-pink-100 text-pink-800" },
    { label: "Perdão", query: "Como perdoar alguém", color: "bg-blue-100 text-blue-800" },
    { label: "Força", query: "Preciso de força espiritual", color: "bg-purple-100 text-purple-800" },
    { label: "Paz", query: "Encontrar paz interior", color: "bg-indigo-100 text-indigo-800" },
  ];

  return (
    <div className="space-y-6">
      {/* Search Input - Modern */}
      <div className="relative">
        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                searchMode === "ai" 
                  ? "Como estou me sentindo ansioso hoje..." 
                  : "Pesquise versículos, palavras ou referências bíblicas..."
              }
              className="h-14 text-base rounded-2xl border-gray-200 focus:border-spiritual-blue focus:ring-spiritual-blue/20 pl-6 pr-16 bg-white shadow-soft"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              {searchMode === "ai" ? (
                <div className="w-8 h-8 bg-gradient-spiritual rounded-xl flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              ) : (
                <Search className="w-5 h-5 text-spiritual-blue" />
              )}
            </div>
          </div>
          <Button
            onClick={handleSearch}
            disabled={searchMutation.isPending || !query.trim()}
            className="btn-primary h-14 px-8 rounded-2xl"
          >
            {searchMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <span className="font-semibold">Buscar</span>
            )}
          </Button>
        </div>
      </div>

      {/* Search Mode Toggle - Modern */}
      <div className="flex items-center justify-center space-x-3 p-2 bg-gray-50 rounded-2xl">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSearchMode("search")}
          className={searchMode === "search" 
            ? "bg-white text-spiritual-blue shadow-soft font-semibold px-6 py-3 rounded-xl" 
            : "text-gray-600 hover:text-spiritual-blue px-6 py-3 rounded-xl"
          }
        >
          <BookOpen className="w-4 h-4 mr-2" />
          Busca Tradicional
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSearchMode("ai")}
          className={searchMode === "ai" 
            ? "bg-white text-spiritual-blue shadow-soft font-semibold px-6 py-3 rounded-xl" 
            : "text-gray-600 hover:text-spiritual-blue px-6 py-3 rounded-xl"
          }
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Busca com IA
        </Button>
      </div>

      {/* Quick Searches - Modern */}
      {results.length === 0 && (
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-deep-blue-gray mb-2">
              {searchMode === "ai" ? "Compartilhe seus sentimentos" : "Explore temas populares"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {searchMode === "ai" 
                ? "Nossa IA encontrará versículos que falam ao seu coração"
                : "Clique em um tema para começar sua busca"
              }
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {quickSearches.map((item) => (
              <Button
                key={item.label}
                variant="outline"
                size="sm"
                onClick={() => handleQuickSearch(item.query)}
                className="btn-secondary text-sm h-10 px-4 rounded-xl hover:scale-105 transition-all duration-200"
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Search Results - Modern */}
      {results.length > 0 && (
        <Card className="card-modern">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-spiritual rounded-xl flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-lg text-deep-blue-gray">
                    Resultados Encontrados
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {searchMode === "ai" ? "Respostas da IA Bíblica" : "Versículos relacionados"}
                  </p>
                </div>
              </div>
              <Badge className="bg-spiritual-blue/10 text-spiritual-blue font-semibold px-3 py-1">
                {results.length} {results.length === 1 ? 'resultado' : 'resultados'}
              </Badge>
            </div>
            
            <ScrollArea className="max-h-96">
              <div className="space-y-6">
                {results.map((result, index) => (
                  <div key={result.id || index}>
                    {result.type === 'verse' && result.verse && (
                      <div className="group">
                        <div className="flex items-start justify-between mb-2">
                          <Badge variant="outline" className="text-spiritual-blue">
                            {result.verse.book} {result.verse.chapter}:{result.verse.verse}
                          </Badge>
                          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyVerse(result.verse)}
                              className="h-8 w-8 p-0"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => shareVerse(result.verse)}
                              className="h-8 w-8 p-0"
                            >
                              <Share className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                            >
                              <Heart className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-deep-blue-gray font-scripture leading-relaxed">
                          "{result.verse.text}"
                        </p>
                        {result.relevanceScore && (
                          <div className="mt-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500">Relevância:</span>
                              <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-spiritual-blue rounded-full"
                                  style={{ width: `${result.relevanceScore * 100}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500">
                                {Math.round(result.relevanceScore * 100)}%
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {result.type === 'ai_response' && result.aiResponse && (
                      <div className="bg-gradient-to-r from-spiritual-blue/10 to-blue-600/10 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-3">
                          <Sparkles className="w-4 h-4 text-spiritual-blue" />
                          <span className="text-sm font-medium text-spiritual-blue">
                            Resposta da IA Bíblica
                          </span>
                          {result.aiResponse.emotion && (
                            <Badge variant="secondary" className="text-xs">
                              {result.aiResponse.emotion}
                            </Badge>
                          )}
                        </div>
                        <p className="text-deep-blue-gray leading-relaxed whitespace-pre-wrap">
                          {result.aiResponse.text}
                        </p>
                      </div>
                    )}

                    {index < results.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            <div className="mt-4 pt-4 border-t border-gray-100">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setResults([])}
                className="text-gray-600 hover:text-spiritual-blue"
              >
                Limpar resultados
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}