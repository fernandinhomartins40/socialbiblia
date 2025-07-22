import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, Sprout, Heart, BookOpen, HandHelping, Star, Calendar, Music } from "lucide-react";
import type { Community } from "@shared/schema";

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
    onSuccess: (data, communityId) => {
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
          window.location.href = "/api/login";
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
      createdAt: new Date(),
    },
    {
      id: '2',
      name: 'Casais na Fé',
      description: 'Fortalecendo relacionamentos matrimoniais com princípios bíblicos e apoio mútuo.',
      icon: 'fas fa-heart',
      color: 'divine-gold',
      memberCount: 856,
      createdAt: new Date(),
    },
    {
      id: '3',
      name: 'Estudos Bíblicos',
      description: 'Aprofunde-se nas Escrituras com estudos sistemáticos e discussões edificantes.',
      icon: 'fas fa-book-open',
      color: 'spiritual-blue',
      memberCount: 2100,
      createdAt: new Date(),
    },
    {
      id: '4',
      name: 'Corrente de Oração',
      description: 'Unidos em oração, intercedendo uns pelos outros e compartilhando testemunhos.',
      icon: 'fas fa-praying-hands',
      color: 'red-500',
      memberCount: 3400,
      createdAt: new Date(),
    },
    {
      id: '5',
      name: 'Mamães Cristãs',
      description: 'Apoio e orientação para mães na criação dos filhos com valores cristãos.',
      icon: 'fas fa-heart',
      color: 'purple-500',
      memberCount: 978,
      createdAt: new Date(),
    },
    {
      id: '6',
      name: 'Louvor e Adoração',
      description: 'Compartilhe e descubra músicas que edificam e aproximam nossos corações de Deus.',
      icon: 'fas fa-music',
      color: 'indigo-500',
      memberCount: 1456,
      createdAt: new Date(),
    },
  ];

  const displayCommunities = communities.length > 0 ? communities : defaultCommunities;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col p-0">
        <DialogHeader className="bg-gradient-to-r from-spiritual-blue to-blue-600 text-white p-6 rounded-t-lg">
          <div className="flex items-center space-x-2">
            <Users className="w-6 h-6" />
            <DialogTitle className="text-xl">Comunidades</DialogTitle>
          </div>
          <p className="text-blue-100 text-sm">
            Conecte-se com irmãos que compartilham seus interesses espirituais
          </p>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {displayCommunities.map((community) => {
              const IconComponent = communityIcons[community.icon as keyof typeof communityIcons] || Users;
              const colorClass = communityColors[community.color as keyof typeof communityColors] || 'bg-spiritual-blue';

              return (
                <Card key={community.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className={`w-12 h-12 ${colorClass} rounded-full flex items-center justify-center`}>
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-deep-blue-gray">{community.name}</h4>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary" className="text-xs">
                            {community.memberCount.toLocaleString()} membros
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {community.description}
                    </p>
                    
                    <Button 
                      className="w-full bg-spiritual-blue hover:bg-blue-600 text-white"
                      onClick={() => handleJoinCommunity(community.id)}
                      disabled={joinCommunityMutation.isPending}
                    >
                      {joinCommunityMutation.isPending ? "Entrando..." : "Participar"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Create Community CTA */}
          <Card className="mt-6 border-2 border-dashed border-gray-300">
            <CardContent className="p-6 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                Não encontrou sua comunidade?
              </h3>
              <p className="text-gray-500 mb-4">
                Que tal criar uma nova comunidade para conectar pessoas com interesses similares?
              </p>
              <Button variant="outline">
                Criar Comunidade
              </Button>
            </CardContent>
          </Card>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
