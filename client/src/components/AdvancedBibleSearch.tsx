import { useState } from "react";
import { Search, Sparkles, BookOpen, Camera, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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

export default function AdvancedBibleSearch() {
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState<"text" | "emotion" | "image">("text");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  // Search mutation using internal AI system
  const searchMutation = useMutation({
    mutationFn: async (searchData: { query: string; type: string; emotion?: string }) => {
      const response = await fetch("/api/bible/ai-search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(searchData),
      });
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      setResults(data.results || []);
      setIsSearching(false);
    },
    onError: (error) => {
      console.error("Search error:", error);
      toast({
        title: "Erro na busca",
        description: "Não foi possível realizar a busca. Tente novamente.",
        variant: "destructive",
      });
      setIsSearching(false);
    },
  });

  const handleSearch = () => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    
    // Detect if query contains emotional words for sentiment analysis
    const emotionalKeywords = [
      "triste", "alegre", "ansioso", "medo", "paz", "amor", "raiva", 
      "esperança", "depressão", "solidão", "gratidão", "perdão",
      "angústia", "conforto", "força", "fé", "dúvida", "preocupação"
    ];
    
    const hasEmotion = emotionalKeywords.some(keyword => 
      query.toLowerCase().includes(keyword)
    );
    
    const searchData = {
      query,
      type: hasEmotion ? "emotion" : searchType,
      emotion: hasEmotion ? query : undefined,
    };
    
    searchMutation.mutate(searchData);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        // For now, we'll treat image search as text search with description
        setQuery("Analisar imagem enviada para encontrar versículos relacionados");
        setSearchType("image");
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Search Input */}
      <Card className="border-2 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex flex-col space-y-3">
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Textarea
                  placeholder="Busque por versículos, compartilhe seus sentimentos ou faça uma pergunta espiritual..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-10 min-h-[60px] resize-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSearch();
                    }
                  }}
                />
              </div>
              <div className="flex flex-col space-y-2">
                <Button 
                  onClick={handleSearch} 
                  disabled={!query.trim() || isSearching}
                  size="sm"
                >
                  {isSearching ? (
                    <Sparkles className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
                <label htmlFor="image-upload">
                  <Button variant="outline" size="sm" asChild>
                    <span className="cursor-pointer">
                      <Camera className="h-4 w-4" />
                    </span>
                  </Button>
                </label>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </div>
            
            {/* Search Type Indicators */}
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <BookOpen className="h-4 w-4" />
              <span>
                Busque por texto, compartilhe sentimentos ou envie imagens para encontrar versículos relevantes
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {results.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            Versículos Encontrados
          </h3>
          
          {results.map((result) => (
            <Card key={result.id} className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                {result.type === 'verse' && result.verse && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">
                        {result.verse.book} {result.verse.chapter}:{result.verse.verse}
                      </Badge>
                      {result.relevanceScore && (
                        <Badge variant="outline">
                          {Math.round(result.relevanceScore * 100)}% relevante
                        </Badge>
                      )}
                    </div>
                    <p className="text-lg leading-relaxed italic">
                      "{result.verse.text}"
                    </p>
                    <p className="text-sm text-muted-foreground">
                      - {result.verse.translation}
                    </p>
                  </div>
                )}
                
                {result.type === 'ai_response' && result.aiResponse && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="default">Resposta da IA</Badge>
                      {result.aiResponse.emotion && (
                        <Badge variant="outline">{result.aiResponse.emotion}</Badge>
                      )}
                    </div>
                    <p className="text-base leading-relaxed">
                      {result.aiResponse.text}
                    </p>
                    {result.aiResponse.context && (
                      <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                        {result.aiResponse.context}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {isSearching && (
        <div className="text-center py-8">
          <Sparkles className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-500" />
          <p className="text-muted-foreground">Buscando versículos relevantes...</p>
        </div>
      )}
    </div>
  );
}