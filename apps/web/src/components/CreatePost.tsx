import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError, redirectToAuth } from "@/lib/authUtils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Image, BookOpen, HandHelping, Send, Sparkles, Heart, Users } from "lucide-react";

export default function CreatePost() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [verseReference, setVerseReference] = useState("");
  const [verseText, setVerseText] = useState("");
  const [postType, setPostType] = useState<"post" | "prayer" | "verse">("post");

  const createPostMutation = useMutation({
    mutationFn: async (data: {
      content: string;
      verseReference?: string;
      verseText?: string;
      type: string;
    }) => {
      await apiRequest("POST", "/api/posts", data);
    },
    onSuccess: () => {
      toast({
        title: "Post criado!",
        description: "Seu post foi compartilhado com sucesso.",
      });
      setContent("");
      setVerseReference("");
      setVerseText("");
      setPostType("post");
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          redirectToAuth();
        }, 500);
        return;
      }
      toast({
        title: "Erro",
        description: "Não foi possível criar o post. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!content.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, escreva algo antes de publicar.",
        variant: "destructive",
      });
      return;
    }

    createPostMutation.mutate({
      content: content.trim(),
      verseReference: verseReference.trim() || undefined,
      verseText: verseText.trim() || undefined,
      type: postType,
    });
  };

  if (!user) return null;

  return (
    <div className="card-modern p-6 space-y-6">
      <div className="flex items-start space-x-4">
        <div className="relative">
          <img 
            src={user?.profileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.firstName || user?.name || 'User')}&background=4A90E2&color=fff`} 
            alt="Profile picture" 
            className="w-12 h-12 rounded-full object-cover ring-2 ring-spiritual-blue/20"
          />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-spiritual rounded-full flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-white" />
          </div>
        </div>
        
        <div className="flex-1 space-y-5">
          <div className="space-y-3">
            <div className="text-sm font-semibold text-deep-blue-gray">
              Compartilhe sua inspiração, {user?.firstName || 'irmão(ã)'}!
            </div>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="O que está em seu coração hoje? Compartilhe uma reflexão, testemunho ou oração..."
              className="min-h-[120px] resize-none text-base rounded-xl border-gray-200 focus:border-spiritual-blue focus:ring-spiritual-blue/20 p-4"
            />
          </div>
          
          {/* Post Type Selector - Modern */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-deep-blue-gray">Tipo de publicação:</div>
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPostType("post")}
                className={postType === "post" 
                  ? "bg-spiritual-blue/10 text-spiritual-blue border border-spiritual-blue/30 font-semibold px-4 py-2 rounded-xl" 
                  : "border border-gray-200 text-gray-600 hover:border-spiritual-blue/30 hover:text-spiritual-blue px-4 py-2 rounded-xl"
                }
              >
                <Heart className="w-4 h-4 mr-2" />
                Reflexão
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPostType("verse")}
                className={postType === "verse" 
                  ? "bg-divine-gold/10 text-orange-700 border border-divine-gold/30 font-semibold px-4 py-2 rounded-xl" 
                  : "border border-gray-200 text-gray-600 hover:border-divine-gold/30 hover:text-orange-700 px-4 py-2 rounded-xl"
                }
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Versículo
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPostType("prayer")}
                className={postType === "prayer" 
                  ? "bg-hope-green/10 text-green-700 border border-hope-green/30 font-semibold px-4 py-2 rounded-xl" 
                  : "border border-gray-200 text-gray-600 hover:border-hope-green/30 hover:text-green-700 px-4 py-2 rounded-xl"
                }
              >
                <HandHelping className="w-4 h-4 mr-2" />
                Oração
              </Button>
            </div>
          </div>

          {/* Verse Section - Modern */}
          {postType === "verse" && (
            <div className="space-y-4 p-5 bg-gradient-to-br from-divine-gold/5 to-orange-100/30 rounded-2xl border border-divine-gold/20">
              <div className="flex items-center gap-2 text-divine-gold font-semibold">
                <BookOpen className="w-4 h-4" />
                <span>Detalhes do Versículo</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="verseReference" className="text-sm font-semibold text-deep-blue-gray">
                    Referência Bíblica
                  </Label>
                  <Input
                    id="verseReference"
                    value={verseReference}
                    onChange={(e) => setVerseReference(e.target.value)}
                    placeholder="Ex: João 3:16"
                    className="mt-1 rounded-xl border-gray-200 focus:border-divine-gold focus:ring-divine-gold/20"
                  />
                </div>
                <div className="md:col-span-1">
                  <Label htmlFor="verseText" className="text-sm font-semibold text-deep-blue-gray">
                    Texto do Versículo
                  </Label>
                  <Textarea
                    id="verseText"
                    value={verseText}
                    onChange={(e) => setVerseText(e.target.value)}
                    placeholder="Porque Deus amou o mundo de tal maneira..."
                    className="mt-1 min-h-[80px] rounded-xl border-gray-200 focus:border-divine-gold focus:ring-divine-gold/20"
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Action Bar */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-gray-600 hover:text-spiritual-blue hover:bg-spiritual-blue/5 px-3 py-2 rounded-xl transition-all duration-200"
              >
                <Image className="w-4 h-4 mr-2" />
                <span className="text-sm">Adicionar Foto</span>
              </Button>
              
              <div className="text-xs text-muted-foreground">
                {content.length}/500 caracteres
              </div>
            </div>
            
            <Button 
              onClick={handleSubmit}
              disabled={createPostMutation.isPending || !content.trim()}
              className="btn-primary group px-6 py-3 h-auto"
            >
              {createPostMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Publicando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2 group-hover:translate-x-0.5 transition-transform" />
                  <span>Compartilhar</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
