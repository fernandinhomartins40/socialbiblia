import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError, redirectToAuth } from "@/lib/authUtils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, Sprout, Heart, BookOpen, HandHelping, Star, Calendar, Music, Plus, Sparkles, ArrowRight } from "lucide-react";
import type { Community } from "@/lib/shared-types";

interface CommunitiesProps {
  communities: Community[];
  onClose: () => void;
}

const communityIcons = {
  'fas fa-seedling': Sprout,
  'fas fa-heart': Heart,
  'fas fa-book-open': BookOpen,
  'fas fa-praying-hands': HandHelping,
  'fas fa-star': Star,
  'fas fa-calendar': Calendar,
  'fas fa-music': Music,
  'fas fa-users': Users,
};

const communityColors = {
  'spiritual-blue': 'bg-spiritual-blue',
  'divine-gold': 'bg-divine-gold',
  'hope-green': 'bg-hope-green',
  'red-500': 'bg-red-500',
  'purple-500': 'bg-purple-500',
  'indigo-500': 'bg-indigo-500',
};

export default function Communities({ communities, onClose }: CommunitiesProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const joinCommunityMutation = useMutation({
    mutationFn: async (communityId: string) => {
      const response = await apiRequest("POST", `/api/communities/${communityId}/join`);
      return response.json();
    },
    onSuccess: (data, _communityId) => {
      if (data.joined) {
        toast({
          title: "Bem-vindo!",
          description: "Você se juntou à comunidade com sucesso.",
        });
      } else {
        toast({
          title: "Já membro",
          description: "Você já faz parte desta comunidade.",
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/communities"] });
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
        description: "Não foi possível entrar na comunidade. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleJoinCommunity = (communityId: string) => {
    joinCommunityMutation.mutate(communityId);
  };

  // Default communities if none exist
  const defaultCommunities: Community[] = [
    {
      id: '1',
      name: 'Jovens Cristãos',
      description: 'Espaço para jovens compartilharem experiências, dúvidas e crescerem juntos na fé.',
      icon: 'fas fa-seedling',
      color: 'hope-green',
      memberCount: 1200,
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      name: 'Casais na Fé',
      description: 'Fortalecendo relacionamentos matrimoniais com princípios bíblicos e apoio mútuo.',
      icon: 'fas fa-heart',
      color: 'divine-gold',
      memberCount: 856,
      createdAt: new Date().toISOString(),
    },
    {
      id: '3',
      name: 'Estudos Bíblicos',
      description: 'Aprofunde-se nas Escrituras com estudos sistemáticos e discussões edificantes.',
      icon: 'fas fa-book-open',
      color: 'spiritual-blue',
      memberCount: 2100,
      createdAt: new Date().toISOString(),
    },
    {
      id: '4',
      name: 'Corrente de Oração',
      description: 'Unidos em oração, intercedendo uns pelos outros e compartilhando testemunhos.',
      icon: 'fas fa-praying-hands',
      color: 'red-500',
      memberCount: 3400,
      createdAt: new Date().toISOString(),
    },
    {
      id: '5',
      name: 'Mamães Cristãs',
      description: 'Apoio e orientação para mães na criação dos filhos com valores cristãos.',
      icon: 'fas fa-heart',
      color: 'purple-500',
      memberCount: 978,
      createdAt: new Date().toISOString(),
    },
    {
      id: '6',
      name: 'Louvor e Adoração',
      description: 'Compartilhe e descubra músicas que edificam e aproximam nossos corações de Deus.',
      icon: 'fas fa-music',
      color: 'indigo-500',
      memberCount: 1456,
      createdAt: new Date().toISOString(),
    },
  ];

  const displayCommunities = communities.length > 0 ? communities : defaultCommunities;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
        {/* Header Moderno */}
        <div className="relative overflow-hidden bg-gradient-to-br from-spiritual-blue via-blue-600 to-purple-700 p-8">
          {/* Background decoration */}
          <div className="absolute inset-0">
            <div className="absolute top-4 right-4 w-20 h-20 bg-white/10 rounded-full"></div>
            <div className="absolute bottom-4 left-4 w-16 h-16 bg-white/5 rounded-full"></div>
            <div className="absolute top-8 left-8 w-12 h-12 bg-divine-gold/20 rounded-full"></div>
          </div>
          
          <DialogHeader className="relative z-10">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Users className="w-7 h-7 text-white" />
              </div>
              <div>
                <DialogTitle className="text-3xl font-black text-white mb-2">
                  Comunidades
                </DialogTitle>
                <p className="text-blue-100 text-lg font-medium">
                  Conecte-se com irmãos que compartilham sua jornada de fé
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-6 text-white/80 text-sm">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4" />
                <span>+50 Comunidades Ativas</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4" />
                <span>Ambiente Acolhedor</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>Crescimento Espiritual</span>
              </div>
            </div>
          </DialogHeader>
        </div>

        <ScrollArea className="flex-1 p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayCommunities.map((community) => {
              const IconComponent = communityIcons[community.icon as keyof typeof communityIcons] || Users;
              const colorClass = communityColors[community.color as keyof typeof communityColors] || 'bg-spiritual-blue';

              return (
                <Card key={community.id} className="card-modern group hover:scale-105 transition-all duration-300 overflow-hidden">
                  <CardContent className="p-0">
                    {/* Header do Card */}
                    <div className={`${colorClass} p-4 relative overflow-hidden`}>
                      <div className="absolute top-2 right-2 opacity-20">
                        <Sparkles className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex items-center space-x-3 relative z-10">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                          <IconComponent className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-white text-lg truncate">{community.name}</h4>
                          <div className="flex items-center space-x-2">
                            <Badge className="bg-white/20 text-white text-xs px-2 py-1">
                              <Users className="w-3 h-3 mr-1" />
                              {community.memberCount?.toLocaleString() || 0} membros
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Conteúdo do Card */}
                    <div className="p-5">
                      <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3">
                        {community.description}
                      </p>
                      
                      <Button 
                        className="w-full btn-primary group"
                        onClick={() => handleJoinCommunity(community.id)}
                        disabled={joinCommunityMutation.isPending}
                      >
                        {joinCommunityMutation.isPending ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                            Entrando...
                          </>
                        ) : (
                          <>
                            <Heart className="w-4 h-4 mr-2" />
                            <span>Participar</span>
                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Create Community CTA - Modern */}
          <Card className="mt-8 border-2 border-dashed border-spiritual-blue/30 bg-gradient-to-br from-spiritual-blue/5 to-purple-50 card-modern">
            <CardContent className="p-8 text-center">
              <div className="relative mx-auto mb-6">
                <div className="w-16 h-16 bg-gradient-spiritual rounded-2xl flex items-center justify-center shadow-medium mx-auto">
                  <Plus className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-divine-gold rounded-full flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
              </div>
              
              <h3 className="text-2xl font-bold text-deep-blue-gray mb-3">
                Não encontrou sua comunidade ideal?
              </h3>
              <p className="text-muted-foreground mb-6 leading-relaxed max-w-md mx-auto">
                Seja o pioneiro! Crie uma nova comunidade e conecte pessoas que compartilham 
                dos mesmos interesses espirituais que você.
              </p>
              
              <Button className="btn-primary group px-8">
                <Plus className="w-4 h-4 mr-2" />
                <span>Criar Minha Comunidade</span>
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <div className="flex items-center justify-center gap-6 mt-6 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  <span>Totalmente gratuito</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>Ferramentas completas</span>
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="w-3 h-3" />
                  <span>Suporte dedicado</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
