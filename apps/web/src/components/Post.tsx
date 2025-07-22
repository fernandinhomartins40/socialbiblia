import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError, redirectToAuth } from "@/lib/authUtils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Share, Bookmark, Send, Quote, HandHelping, Sparkles, MoreHorizontal, Clock, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { PostWithDetails } from "@/lib/shared-types";

interface PostProps {
  post: PostWithDetails;
}

export default function Post({ post }: PostProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");

  const authorName = `${post.user?.firstName || ''} ${post.user?.lastName || ''}`.trim() || 
                    post.user?.name || 'Usuário';

  const isLiked = post.likes?.some((like: any) => like.userId === user?.id) || false;

  const toggleLikeMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/posts/${post.id}/like`);
    },
    onSuccess: () => {
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
        description: "Não foi possível curtir o post.",
        variant: "destructive",
      });
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      await apiRequest("POST", "/api/comments", {
        postId: post.id,
        content,
      });
    },
    onSuccess: () => {
      setCommentText("");
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
        description: "Não foi possível comentar.",
        variant: "destructive",
      });
    },
  });

  const handleLike = () => {
    toggleLikeMutation.mutate();
  };

  const handleComment = () => {
    if (!commentText.trim()) return;
    createCommentMutation.mutate(commentText.trim());
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'BibliaConnect - Post',
        text: post.content,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copiado!",
        description: "O link do post foi copiado para a área de transferência.",
      });
    }
  };

  const timeAgo = formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: true,
    locale: ptBR,
  });

  return (
    <Card className="card-modern group hover:shadow-strong transition-all duration-300">
      <CardContent className="p-8">
        <div className="flex items-start space-x-4">
          <div className="relative">
            <img 
              src={post.user?.profileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=4A90E2&color=fff`} 
              alt={`${authorName} profile`} 
              className="w-14 h-14 rounded-full object-cover ring-2 ring-gray-100 group-hover:ring-spiritual-blue/30 transition-all duration-300"
            />
            {post.type !== "post" && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-spiritual rounded-full flex items-center justify-center shadow-soft">
                {post.type === "prayer" ? (
                  <HandHelping className="w-3 h-3 text-white" />
                ) : (
                  <Quote className="w-3 h-3 text-white" />
                )}
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div>
                  <h4 className="font-bold text-deep-blue-gray text-lg">{authorName}</h4>
                  <div className="flex items-center space-x-2">
                    {post.user?.denomination && (
                      <Badge className="bg-spiritual-blue/10 text-spiritual-blue text-xs px-2 py-1">
                        {post.user?.denomination}
                      </Badge>
                    )}
                    <div className="flex items-center space-x-1 text-muted-foreground text-sm">
                      <Clock className="w-3 h-3" />
                      <span>{timeAgo}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {post.type !== "post" && (
                  <Badge className={
                    post.type === "prayer" 
                      ? "bg-hope-green/10 text-green-700 border border-hope-green/30" 
                      : "bg-divine-gold/10 text-orange-700 border border-divine-gold/30"
                  }>
                    {post.type === "prayer" ? (
                      <>
                        <HandHelping className="w-3 h-3 mr-1" />
                        Pedido de Oração
                      </>
                    ) : (
                      <>
                        <Quote className="w-3 h-3 mr-1" />
                        Reflexão Bíblica
                      </>
                    )}
                  </Badge>
                )}
                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <p className="text-deep-blue-gray mb-6 whitespace-pre-wrap text-base leading-relaxed">
              {post.content}
            </p>
            
            {/* Verse Display - Modern */}
            {post.verseReference && post.verseText && (
              <div className="bg-gradient-to-br from-spiritual-blue via-blue-600 to-purple-600 rounded-2xl p-6 mb-6 relative overflow-hidden">
                <div className="absolute top-3 right-3 opacity-20">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mr-3">
                      <Quote className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-white text-base font-bold">
                      {post.verseReference}
                    </span>
                  </div>
                  <p className="text-white font-scripture text-lg italic leading-relaxed">
                    "{post.verseText}"
                  </p>
                </div>
              </div>
            )}

            {/* Image Display - Modern */}
            {post.imageUrl && (
              <div className="mb-6">
                <img 
                  src={post.imageUrl} 
                  alt="Post image" 
                  className="w-full h-64 object-cover rounded-2xl shadow-medium"
                />
              </div>
            )}
          </div>
        </div>
        
        {/* Post Actions - Modern */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-100/60">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              disabled={toggleLikeMutation.isPending}
              className={`px-4 py-2 rounded-xl transition-all duration-200 ${
                isLiked 
                  ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                  : 'text-gray-600 hover:bg-red-50 hover:text-red-600'
              }`}
            >
              <Heart className={`w-4 h-4 mr-2 ${isLiked ? 'fill-current' : ''}`} />
              <span className="font-semibold">{post._count?.likes || 0}</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className={`px-4 py-2 rounded-xl transition-all duration-200 ${
                showComments
                  ? 'bg-spiritual-blue/10 text-spiritual-blue'
                  : 'text-gray-600 hover:bg-spiritual-blue/10 hover:text-spiritual-blue'
              }`}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              <span className="font-semibold">{post._count?.comments || 0}</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="px-4 py-2 rounded-xl text-gray-600 hover:bg-spiritual-blue/10 hover:text-spiritual-blue transition-all duration-200"
            >
              <Share className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline font-semibold">Compartilhar</span>
            </Button>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            className="w-10 h-10 rounded-xl text-gray-600 hover:bg-spiritual-blue/10 hover:text-spiritual-blue transition-all duration-200"
          >
            <Bookmark className="w-4 h-4" />
          </Button>
        </div>

        {/* Comments Section - Modern */}
        {showComments && (
          <div className="mt-6 pt-6 border-t border-gray-100/60 bg-gradient-to-br from-gray-50/50 to-blue-50/30 -mx-8 -mb-8 px-8 pb-8 rounded-b-2xl">
            <div className="space-y-3 mb-4">
              {post.comments?.map((comment: any) => {
                const commentAuthor = `${comment.user?.firstName || ''} ${comment.user?.lastName || ''}`.trim() || 
                                     comment.user?.name || 'Usuário';
                const commentTimeAgo = formatDistanceToNow(new Date(comment.createdAt), {
                  addSuffix: true,
                  locale: ptBR,
                });

                return (
                  <div key={comment.id} className="flex items-start space-x-3">
                    <img 
                      src={comment.user.profileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(commentAuthor)}&background=4A90E2&color=fff`} 
                      alt={`${commentAuthor} comment`} 
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium text-deep-blue-gray">
                          {commentAuthor}
                        </span>{' '}
                        <span className="text-gray-600">{comment.content}</span>
                      </p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-xs text-gray-500">{commentTimeAgo}</span>
                        <Button variant="ghost" size="sm" className="text-xs text-gray-600 hover:text-spiritual-blue h-auto p-0">
                          Responder
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Add Comment */}
            {user && (
              <div className="flex items-center space-x-3">
                <img 
                  src={user?.profileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.firstName || user?.name || 'User')}&background=4A90E2&color=fff`} 
                  alt="Your profile" 
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div className="flex-1 flex items-center space-x-2">
                  <Input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Escreva um comentário..."
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleComment();
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={handleComment}
                    disabled={createCommentMutation.isPending || !commentText.trim()}
                    className="bg-spiritual-blue hover:bg-blue-600 text-white"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
