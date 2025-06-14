import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import CreatePost from "@/components/CreatePost";
import Post from "@/components/Post";
import AIChat from "@/components/AIChat";
import Communities from "@/components/Communities";
import AdvancedBibleSearch from "@/components/AdvancedBibleSearch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, Users, BookOpen, Bell, HandHelping, Calendar, Plus, Heart } from "lucide-react";
import type { PostWithUser, Community } from "@shared/schema";

export default function Home() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAIChat, setShowAIChat] = useState(false);
  const [showCommunities, setShowCommunities] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Não autorizado",
        description: "Você foi desconectado. Redirecionando...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [user, authLoading, toast]);

  // Fetch posts
  const { data: posts = [], isLoading: postsLoading } = useQuery<PostWithUser[]>({
    queryKey: ["/api/posts"],
    enabled: !!user,
  });

  // Fetch communities
  const { data: communities = [] } = useQuery<Community[]>({
    queryKey: ["/api/communities"],
    enabled: !!user,
  });

  // Fetch random verse
  const { data: randomVerse } = useQuery({
    queryKey: ["/api/verses/random"],
    enabled: !!user,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-blue-500 animate-pulse" />
          <p className="text-muted-foreground">Carregando BibliaConnect...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-blue-600">BibliaConnect</h1>
              <nav className="hidden md:flex space-x-1">
                <Button 
                  variant="ghost" 
                  onClick={() => window.location.href = '/biblia'}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Bíblia
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => setShowAIChat(true)}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Chat IA
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => setShowCommunities(true)}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Comunidades
                </Button>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-4 h-4" />
                <Badge className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  3
                </Badge>
              </Button>
              
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.profileImageUrl || ""} />
                  <AvatarFallback>{user?.firstName?.[0] || "U"}</AvatarFallback>
                </Avatar>
                <span className="hidden md:block text-sm font-medium">
                  {user?.firstName} {user?.lastName}
                </span>
              </div>

              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.href = '/api/logout'}
              >
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* User Profile Card */}
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <Avatar className="h-16 w-16 mx-auto mb-4">
                    <AvatarImage src={user?.profileImageUrl || ""} />
                    <AvatarFallback className="text-lg">{user?.firstName?.[0] || "U"}</AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold text-lg">{user?.firstName} {user?.lastName}</h3>
                  <p className="text-sm text-muted-foreground">{user?.denomination || "Cristão"}</p>
                  {user?.favoriteVerse && (
                    <p className="text-xs text-blue-600 mt-2">{user.favoriteVerse}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Spiritual Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-sm">
                  <BookOpen className="w-4 h-4 text-blue-500 mr-2" />
                  Progresso Espiritual
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Leitura Bíblica</span>
                    <span className="text-blue-600 font-medium">65%</span>
                  </div>
                  <Progress value={65} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Dias Consecutivos</span>
                    <span className="text-green-600 font-medium">12 dias</span>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Próxima leitura:</p>
                  <p className="text-sm font-medium">Salmos 23</p>
                </div>
              </CardContent>
            </Card>

            {/* Daily Verse */}
            {randomVerse && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Versículo do Dia</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
                    <p className="text-sm font-medium mb-2">
                      {randomVerse.book} {randomVerse.chapter}:{randomVerse.verse}
                    </p>
                    <p className="text-sm italic">
                      "{randomVerse.text}"
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full"
                  onClick={() => setShowCreatePost(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Publicação
                </Button>
                
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowAIChat(true)}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Conversar com IA
                </Button>
                
                <Button 
                  variant="outline"
                  className="w-full"
                >
                  <HandHelping className="w-4 h-4 mr-2" />
                  Lembrete de Oração
                </Button>
              </CardContent>
            </Card>
          </div>
          
          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Advanced Bible Search */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="w-5 h-5 text-blue-500 mr-2" />
                  Busca Bíblica Inteligente
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Pesquise versículos, compartilhe sentimentos ou faça perguntas espirituais
                </p>
              </CardHeader>
              <CardContent>
                <AdvancedBibleSearch />
              </CardContent>
            </Card>

            {/* Create Post Section */}
            {showCreatePost && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Compartilhe sua Fé</CardTitle>
                </CardHeader>
                <CardContent>
                  <CreatePost />
                </CardContent>
              </Card>
            )}

            {/* Social Feed */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Feed da Comunidade</h2>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowCreatePost(!showCreatePost)}
                >
                  {showCreatePost ? "Cancelar" : "Nova Publicação"}
                </Button>
              </div>

              {postsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="p-6">
                      <div className="animate-pulse">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                          <div className="space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-24"></div>
                            <div className="h-3 bg-gray-200 rounded w-16"></div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded"></div>
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : posts.length > 0 ? (
                <div className="space-y-6">
                  {posts.map((post) => (
                    <Post key={post.id} post={post} />
                  ))}
                </div>
              ) : (
                <Card className="p-8 text-center">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma publicação ainda</h3>
                  <p className="text-muted-foreground mb-4">
                    Seja o primeiro a compartilhar sua fé com a comunidade
                  </p>
                  <Button onClick={() => setShowCreatePost(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar primeira publicação
                  </Button>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      {showAIChat && <AIChat onClose={() => setShowAIChat(false)} />}
      {showCommunities && (
        <Communities 
          communities={communities} 
          onClose={() => setShowCommunities(false)} 
        />
      )}
    </div>
  );
}