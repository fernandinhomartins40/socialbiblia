import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import CreatePost from "@/components/CreatePost";
import Post from "@/components/Post";
import AIChat from "@/components/AIChat";
import Communities from "@/components/Communities";
import AdvancedBibleSearch from "@/components/AdvancedBibleSearch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, Users, BookOpen, Bell, Plus, Sparkles, Heart } from "lucide-react";
import { redirectToAuth } from "@/lib/authUtils";
import type { Community, RandomVerse } from "@/lib/shared-types";

export default function Home() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
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
        redirectToAuth();
      }, 500);
      return;
    }
  }, [user, authLoading, toast]);

  // Fetch posts from feed
  const { data: feedData, isLoading: postsLoading } = useQuery({
    queryKey: ["feed"],
    queryFn: () => apiClient.getFeed(20, 0),
    enabled: !!user,
  });

  const posts = feedData?.data?.posts || [];

  // Fetch communities
  const { data: communities = [] } = useQuery<Community[]>({
    queryKey: ["/api/communities"],
    enabled: !!user,
  });

  // Fetch random verse
  const { data: randomVerse } = useQuery<RandomVerse>({
    queryKey: ["/api/verses/random"],
    enabled: !!user,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-blue-500 animate-pulse" />
          <p className="text-muted-foreground">Carregando Biblicai...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      {/* Header */}
      <header className="glass sticky top-0 z-50 border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-18">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-spiritual rounded-xl flex items-center justify-center shadow-medium">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                                 <h1 className="text-2xl font-black bg-gradient-to-r from-spiritual-blue to-purple-600 bg-clip-text text-transparent">
                   Biblicai
                 </h1>
              </div>
              
              <nav className="hidden md:flex space-x-1">
                <Button 
                  className="btn-ghost"
                  onClick={() => window.location.href = '/biblia'}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Bíblia
                </Button>
                <Button 
                  className="btn-ghost"
                  onClick={() => setShowAIChat(true)}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Chat IA
                </Button>
                <Button 
                  className="btn-ghost"
                  onClick={() => setShowCommunities(true)}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Comunidades
                </Button>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="relative hover:bg-spiritual-blue/10">
                <Bell className="w-4 h-4" />
                <Badge className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full flex items-center justify-center shadow-soft">
                  3
                </Badge>
              </Button>
              
              <div className="flex items-center space-x-3 bg-white/60 backdrop-blur-sm rounded-full p-2 pr-4 border border-white/40">
                <Avatar className="h-9 w-9 ring-2 ring-spiritual-blue/20">
                  <AvatarImage src={user?.profileImageUrl || ""} />
                  <AvatarFallback className="bg-gradient-spiritual text-white font-semibold">
                    {user?.firstName?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:block text-sm font-semibold text-deep-blue-gray">
                  {user?.firstName} {user?.lastName}
                </span>
              </div>

              <Button 
                variant="outline" 
                size="sm"
                className="border-spiritual-blue/30 text-spiritual-blue hover:bg-spiritual-blue hover:text-white transition-all duration-300"
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
          
          {/* Left Sidebar - Modern */}
          <div className="lg:col-span-1 space-y-6">
            {/* User Profile Card - Modern */}
            <Card className="card-modern">
              <CardContent className="p-6">
                <div className="text-center">
                  <Avatar className="h-16 w-16 mx-auto mb-4 ring-4 ring-spiritual-blue/10">
                    <AvatarImage src={user?.profileImageUrl || ""} />
                    <AvatarFallback className="bg-gradient-spiritual text-white text-lg font-bold">
                      {user?.firstName?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-bold text-lg text-deep-blue-gray mb-1">
                    {user?.firstName} {user?.lastName}
                  </h3>
                  <p className="text-sm text-spiritual-blue font-medium mb-4">
                    {user?.denomination || "Membro da Comunidade"}
                  </p>
                  <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                    <div className="text-center">
                      <div className="font-bold text-spiritual-blue">124</div>
                      <div>Publicações</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-spiritual-blue">2.5k</div>
                      <div>Seguidores</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Spiritual Progress - Modern */}
            <Card className="card-modern">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-hope-green to-green-600 rounded-xl flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <span className="font-semibold text-deep-blue-gray">Jornada Espiritual</span>
                      <p className="text-xs text-muted-foreground">Seu crescimento na fé</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-hope-green">65%</span>
                </div>
                
                <Progress value={65} className="h-2 mb-4" />
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Dias consecutivos:</span>
                    <span className="font-semibold text-spiritual-blue">12 dias</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Próximo capítulo:</span>
                    <span className="font-semibold text-spiritual-blue">Salmos 23</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Daily Verse - Modern */}
            {randomVerse && (
              <Card className="card-modern overflow-hidden">
                <CardContent className="p-0">
                  <div className="bg-gradient-to-br from-spiritual-blue via-blue-600 to-purple-600 p-6 text-white relative overflow-hidden">
                    <div className="absolute top-2 right-2 opacity-20">
                      <Sparkles className="w-8 h-8" />
                    </div>
                    <div className="relative z-10">
                      <div className="inline-flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full text-xs font-semibold mb-3">
                        <BookOpen className="w-3 h-3" />
                        <span>Versículo do Dia</span>
                      </div>
                      <p className="text-sm font-bold mb-2">
                        {randomVerse.book} {randomVerse.chapter}:{randomVerse.verse}
                      </p>
                      <p className="text-sm italic leading-relaxed line-clamp-3">
                        "{randomVerse.text}"
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions - Modern */}
            <Card className="card-modern">
              <CardContent className="p-6 space-y-3">
                <div className="text-center mb-4">
                  <h3 className="font-bold text-sm text-deep-blue-gray mb-1">Ações Rápidas</h3>
                  <p className="text-xs text-muted-foreground">O que você gostaria de fazer?</p>
                </div>
                
                <Button 
                  className="btn-primary w-full text-sm"
                  onClick={() => setShowCreatePost(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Publicação
                </Button>
                
                <Button 
                  className="btn-secondary w-full text-sm"
                  onClick={() => setShowAIChat(true)}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Chat com IA
                </Button>
              </CardContent>
            </Card>
          </div>
          
          {/* Main Content Area - Modern */}
          <div className="lg:col-span-3 space-y-8">
            {/* Advanced Bible Search - Modern */}
            <Card className="card-modern">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-spiritual-blue to-purple-600 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-deep-blue-gray">Busca Bíblica Inteligente</h2>
                    <p className="text-sm text-muted-foreground font-normal">
                      Encontre versículos que falam ao seu coração usando IA
                    </p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <AdvancedBibleSearch />
              </CardContent>
            </Card>

            {/* Create Post Section - Modern */}
            {showCreatePost && (
              <Card className="card-modern">
                <CardHeader className="pb-4 border-b border-border/10">
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-divine-gold to-yellow-600 rounded-xl flex items-center justify-center">
                      <Plus className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-deep-blue-gray">Compartilhe sua Fé</h2>
                      <p className="text-sm text-muted-foreground font-normal">
                        Inspire a comunidade com seus pensamentos espirituais
                      </p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <CreatePost />
                </CardContent>
              </Card>
            )}

            {/* Social Feed - Modern */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-hope-green to-green-600 rounded-xl flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-deep-blue-gray">Feed da Comunidade</h2>
                    <p className="text-sm text-muted-foreground">Últimas publicações dos seus irmãos em fé</p>
                  </div>
                </div>
                <Button 
                  className={showCreatePost ? "btn-secondary" : "btn-primary"}
                  onClick={() => setShowCreatePost(!showCreatePost)}
                >
                  {showCreatePost ? "Cancelar" : "Nova Publicação"}
                </Button>
              </div>

              {postsLoading ? (
                <div className="space-y-6">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="card-modern p-8">
                      <div className="animate-pulse">
                        <div className="flex items-center space-x-4 mb-6">
                          <div className="h-12 w-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full"></div>
                          <div className="space-y-2 flex-1">
                            <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-32"></div>
                            <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-20"></div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg"></div>
                          <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-4/5"></div>
                          <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-3/5"></div>
                        </div>
                        <div className="flex items-center space-x-6 mt-6">
                          <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-16"></div>
                          <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-16"></div>
                          <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-16"></div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : posts.length > 0 ? (
                <div className="space-y-6">
                  {posts.map((post: any) => (
                    <Post key={post.id} post={post} />
                  ))}
                </div>
              ) : (
                <Card className="card-modern p-12 text-center">
                  <div className="max-w-md mx-auto">
                    <div className="w-20 h-20 bg-gradient-to-br from-spiritual-blue/10 to-purple-600/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <MessageCircle className="h-10 w-10 text-spiritual-blue" />
                    </div>
                    <h3 className="text-2xl font-bold text-deep-blue-gray mb-3">
                      Primeira vez aqui?
                    </h3>
                    <p className="text-muted-foreground mb-6 leading-relaxed">
                      Seja o primeiro a compartilhar sua fé e inspirar nossa comunidade. 
                      Sua voz é importante para nós!
                    </p>
                    <Button className="btn-primary" onClick={() => setShowCreatePost(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Criar primeira publicação
                    </Button>
                  </div>
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