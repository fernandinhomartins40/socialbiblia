import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Image, BookOpen, HandHelping, Send } from "lucide-react";

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
          window.location.href = "/api/login";
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
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <img 
            src={user?.profileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.firstName || user?.name || 'User')}&background=4A90E2&color=fff`} 
            alt="Profile picture" 
            className="w-10 h-10 rounded-full object-cover"
          />
          
          <div className="flex-1 space-y-4">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Compartilhe uma reflexão, versículo ou oração..."
              className="min-h-[100px] resize-none"
            />
            
            {/* Post Type Selector */}
            <div className="flex items-center space-x-4">
              <Button
                variant={postType === "post" ? "default" : "outline"}
                size="sm"
                onClick={() => setPostType("post")}
              >
                Post
              </Button>
              <Button
                variant={postType === "verse" ? "default" : "outline"}
                size="sm"
                onClick={() => setPostType("verse")}
              >
                <BookOpen className="w-4 h-4 mr-1" />
                Versículo
              </Button>
              <Button
                variant={postType === "prayer" ? "default" : "outline"}
                size="sm"
                onClick={() => setPostType("prayer")}
              >
                <HandHelping className="w-4 h-4 mr-1" />
                Oração
              </Button>
            </div>

            {/* Verse Section */}
            {postType === "verse" && (
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label htmlFor="verseReference">Referência (ex: João 3:16)</Label>
                  <Input
                    id="verseReference"
                    value={verseReference}
                    onChange={(e) => setVerseReference(e.target.value)}
                    placeholder="João 3:16"
                  />
                </div>
                <div>
                  <Label htmlFor="verseText">Texto do Versículo</Label>
                  <Textarea
                    id="verseText"
                    value={verseText}
                    onChange={(e) => setVerseText(e.target.value)}
                    placeholder="Porque Deus amou o mundo de tal maneira..."
                    className="min-h-[80px]"
                  />
                </div>
              </div>
            )}
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-spiritual-blue">
                  <Image className="w-4 h-4 mr-2" />
                  Foto
                </Button>
              </div>
              
              <Button 
                onClick={handleSubmit}
                disabled={createPostMutation.isPending}
                className="bg-spiritual-blue hover:bg-blue-600 text-white"
              >
                {createPostMutation.isPending ? (
                  "Publicando..."
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Publicar
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
