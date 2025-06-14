import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
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
          window.location.href = "/api/login";
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
    searchMutation.mutate(query.trim());
  };

  const handleQuickSearch = (quickQuery: string) => {
    setQuery(quickQuery);
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
    <div className="space-y-4">
      {/* Search Input */}
      <div className="flex items-center space-x-2">
        <div className="flex-1 relative">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              searchMode === "ai" 
                ? "Como estou me sentindo ansioso..." 
                : "Pesquisar versículos, palavras ou referências..."
            }
            className="pr-10"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {searchMode === "ai" ? (
              <Sparkles className="w-4 h-4 text-spiritual-blue" />
            ) : (
              <Search className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </div>
        <Button
          onClick={handleSearch}
          disabled={searchMutation.isPending || !query.trim()}
          className="bg-spiritual-blue hover:bg-blue-600 text-white"
        >
          {searchMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Buscar"
          )}
        </Button>
      </div>

      {/* Search Mode Toggle */}
      <div className="flex items-center space-x-2">
        <Button
          variant={searchMode === "search" ? "default" : "outline"}
          size="sm"
          onClick={() => setSearchMode("search")}
          className={searchMode === "search" ? "bg-spiritual-blue hover:bg-blue-600" : ""}
        >
          <BookOpen className="w-4 h-4 mr-2" />
          Busca Tradicional
        </Button>
        <Button
          variant={searchMode === "ai" ? "default" : "outline"}
          size="sm"
          onClick={() => setSearchMode("ai")}
          className={searchMode === "ai" ? "bg-spiritual-blue hover:bg-blue-600" : ""}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Busca com IA
        </Button>
      </div>

      {/* Quick Searches */}
      {results.length === 0 && (
        <div>
          <p className="text-sm text-gray-600 mb-3">Sugestões populares:</p>
          <div className="flex flex-wrap gap-2">
            {quickSearches.map((item) => (
              <Button
                key={item.label}
                variant="outline"
                size="sm"
                onClick={() => handleQuickSearch(item.query)}
                className="text-xs h-7"
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      {results.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-deep-blue-gray">
                Resultados da busca
              </h4>
              <Badge variant="secondary">
                {results.length} {results.length === 1 ? 'resultado' : 'resultados'}
              </Badge>
            </div>
            
            <ScrollArea className="max-h-96">
              <div className="space-y-4">
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