import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { extendedApiClient } from "@/lib/api-adapters";
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

  // Fetch posts from feed using the extended API client
  const { data: feedData, isLoading: postsLoading } = useQuery({
    queryKey: ["feed"],
    queryFn: () => extendedApiClient.getFeed(20, 0),
    enabled: !!user,
  });

  const posts = feedData?.data?.posts || [];

  // Fetch communities using the extended API client
  const { data: communities = [] } = useQuery({
    queryKey: ["communities"],
    queryFn: () => extendedApiClient.getCommunities(),
    enabled: !!user,
  });

  // Fetch random verse using the extended API client
  const { data: randomVerse } = useQuery({
    queryKey: ["randomVerse"],
    queryFn: () => extendedApiClient.getRandomVerse(),
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-spiritual rounded-xl flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-spiritual-blue to-purple-600 bg-clip-text text-transparent">
                Biblicai
              </h1>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAIChat(true)}
                className="bg-spiritual-blue/5 text-spiritual-blue hover:bg-spiritual-blue/10 rounded-xl"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                IA Bíblica
              </Button>
              
              <Avatar className="h-10 w-10 ring-2 ring-spiritual-blue/20">
                <AvatarImage src={user?.profileImageUrl} />
                <AvatarFallback className="bg-gradient-spiritual text-white font-semibold">
                  {user?.firstName?.[0] || user?.name?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Daily Verse */}
            {randomVerse && (
              <Card className="card-modern">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2 text-deep-blue-gray">
                    <BookOpen className="w-5 h-5 text-spiritual-blue" />
                    Versículo do Dia
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <blockquote className="text-sm italic text-gray-700 mb-3 leading-relaxed">
                    "{randomVerse.text}"
                  </blockquote>
                  <cite className="text-xs font-semibold text-spiritual-blue">
                    {randomVerse.book} {randomVerse.chapter}:{randomVerse.verse}
                  </cite>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card className="card-modern">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-deep-blue-gray">Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => setShowCreatePost(true)}
                  className="w-full bg-gradient-spiritual hover:opacity-90 text-white rounded-xl"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Publicação
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => setShowCommunities(true)}
                  className="w-full border-spiritual-blue/30 text-spiritual-blue hover:bg-spiritual-blue/5 rounded-xl"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Comunidades
                </Button>
              </CardContent>
            </Card>

            {/* Communities Preview */}
            {communities.length > 0 && (
              <Card className="card-modern">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-deep-blue-gray">Suas Comunidades</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {communities.slice(0, 3).map((community: any) => (
                    <div key={community.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="w-8 h-8 bg-spiritual-blue/10 rounded-lg flex items-center justify-center">
                        <Users className="w-4 h-4 text-spiritual-blue" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{community.name}</p>
                        <p className="text-xs text-gray-500">{community.memberCount} membros</p>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCommunities(true)}
                    className="w-full text-spiritual-blue hover:bg-spiritual-blue/5 rounded-xl mt-2"
                  >
                    Ver todas
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Create Post */}
            <CreatePost />

            {/* Posts Feed */}
            <div className="space-y-6">
              {postsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="card-modern p-6">
                      <div className="animate-pulse">
                        <div className="flex space-x-4">
                          <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : posts.length === 0 ? (
                <Card className="card-modern p-8 text-center">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 text-spiritual-blue/50" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma publicação ainda</h3>
                  <p className="text-gray-600 mb-4">Seja o primeiro a compartilhar sua inspiração!</p>
                  <Button
                    onClick={() => setShowCreatePost(true)}
                    className="bg-gradient-spiritual hover:opacity-90 text-white rounded-xl"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Criar primeira publicação
                  </Button>
                </Card>
              ) : (
                posts.map((post: any) => (
                  <Post key={post.id} post={post} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showAIChat && <AIChat onClose={() => setShowAIChat(false)} />}
      {showCommunities && <Communities communities={communities} onClose={() => setShowCommunities(false)} />}
    </div>
  );
}