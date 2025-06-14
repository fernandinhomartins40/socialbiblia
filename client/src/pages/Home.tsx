import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import UserProfile from "@/components/UserProfile";
import CreatePost from "@/components/CreatePost";
import Post from "@/components/Post";
import AIChat from "@/components/AIChat";
import Communities from "@/components/Communities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MessageCircle, Users, BookOpen, Bell, HandHelping, Calendar } from "lucide-react";
import type { PostWithUser, Community } from "@shared/schema";

export default function Home() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAIChat, setShowAIChat] = useState(false);
  const [showCommunities, setShowCommunities] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
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
          <div className="w-16 h-16 bg-spiritual-blue rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <HandHelping className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600">Carregando...</p>
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
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-spiritual-blue rounded-full flex items-center justify-center">
                  <HandHelping className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-bold text-spiritual-blue">BibliaConnect</span>
              </div>
            </div>
            
            <nav className="hidden md:flex items-center space-x-8">
              <Button variant="ghost" className="text-deep-blue-gray hover:text-spiritual-blue">
                <BookOpen className="w-4 h-4 mr-2" />
                Início
              </Button>
              <Button 
                variant="ghost" 
                className="text-deep-blue-gray hover:text-spiritual-blue"
                onClick={() => setShowAIChat(true)}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Chat IA
              </Button>
              <Button 
                variant="ghost" 
                className="text-deep-blue-gray hover:text-spiritual-blue"
                onClick={() => setShowCommunities(true)}
              >
                <Users className="w-4 h-4 mr-2" />
                Comunidades
              </Button>
            </nav>
            
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-4 h-4" />
                <Badge className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  3
                </Badge>
              </Button>
              
              <div className="flex items-center space-x-2">
                <img 
                  src={user.profileImageUrl || "https://via.placeholder.com/32"} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span className="text-deep-blue-gray font-medium">
                  {user.firstName} {user.lastName}
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

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <UserProfile user={user} />
            
            {/* Spiritual Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-deep-blue-gray">
                  <BookOpen className="w-5 h-5 text-spiritual-blue mr-2" />
                  Progresso Espiritual
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Leitura Bíblica</span>
                    <span className="text-spiritual-blue font-medium">65%</span>
                  </div>
                  <Progress value={65} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Dias Consecutivos</span>
                    <span className="text-hope-green font-medium">12 dias</span>
                  </div>
                </div>
                
                <div className="bg-light-background rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">Próxima leitura:</p>
                  <p className="text-sm font-medium text-deep-blue-gray">Salmos 23</p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-deep-blue-gray">Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full bg-spiritual-blue hover:bg-blue-600 text-white"
                  onClick={() => setShowAIChat(true)}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Conversar com IA
                </Button>
                
                <Button className="w-full bg-divine-gold hover:bg-yellow-600 text-white">
                  <HandHelping className="w-4 h-4 mr-2" />
                  Lembrete de Oração
                </Button>
                
                <Button className="w-full bg-hope-green hover:bg-green-600 text-white">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Estudo Bíblico
                </Button>
              </CardContent>
            </Card>

            {/* Daily Verse */}
            {randomVerse && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-deep-blue-gray">Versículo do Dia</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gradient-to-r from-spiritual-blue to-blue-600 rounded-lg p-4 text-white">
                    <p className="text-sm font-medium mb-2">
                      {randomVerse.book} {randomVerse.chapter}:{randomVerse.verse}
                    </p>
                    <p className="text-sm italic font-scripture">
                      "{randomVerse.text}"
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            <CreatePost />
            
            <Separator />
            
            {/* Posts Feed */}
            <div className="space-y-6">
              {postsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                          <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : posts.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">
                      Nenhum post ainda
                    </h3>
                    <p className="text-gray-500">
                      Seja o primeiro a compartilhar uma reflexão ou versículo!
                    </p>
                  </CardContent>
                </Card>
              ) : (
                posts.map((post) => (
                  <Post key={post.id} post={post} />
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* AI Chat Modal */}
      {showAIChat && (
        <AIChat onClose={() => setShowAIChat(false)} />
      )}

      {/* Communities Modal */}
      {showCommunities && (
        <Communities 
          communities={communities}
          onClose={() => setShowCommunities(false)} 
        />
      )}

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className="flex justify-around py-2">
          <Button variant="ghost" className="flex flex-col items-center py-2 px-3 text-spiritual-blue">
            <BookOpen className="w-5 h-5" />
            <span className="text-xs mt-1">Início</span>
          </Button>
          <Button 
            variant="ghost" 
            className="flex flex-col items-center py-2 px-3 text-gray-600"
            onClick={() => setShowAIChat(true)}
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-xs mt-1">IA</span>
          </Button>
          <Button 
            variant="ghost" 
            className="flex flex-col items-center py-2 px-3 text-gray-600"
            onClick={() => setShowCommunities(true)}
          >
            <Users className="w-5 h-5" />
            <span className="text-xs mt-1">Grupos</span>
          </Button>
          <Button variant="ghost" className="flex flex-col items-center py-2 px-3 text-gray-600">
            <Calendar className="w-5 h-5" />
            <span className="text-xs mt-1">Perfil</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
