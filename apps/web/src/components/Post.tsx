import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Share, Bookmark, Send, Quote, HandHelping } from "lucide-react";
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
          window.location.href = "/api/login";
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
          window.location.href = "/api/login";
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
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <img 
            src={post.user?.profileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=4A90E2&color=fff`} 
            alt={`${authorName} profile`} 
            className="w-12 h-12 rounded-full object-cover"
          />
          
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h4 className="font-semibold text-deep-blue-gray">{authorName}</h4>
              {post.user?.denomination && (
                <Badge variant="secondary" className="text-xs">
                  {post.user?.denomination}
                </Badge>
              )}
              <span className="text-gray-500 text-sm">{timeAgo}</span>
              {post.type !== "post" && (
                <Badge variant="outline" className="text-xs">
                  {post.type === "prayer" ? (
                    <>
                      <HandHelping className="w-3 h-3 mr-1" />
                      Oração
                    </>
                  ) : (
                    <>
                      <Quote className="w-3 h-3 mr-1" />
                      Versículo
                    </>
                  )}
                </Badge>
              )}
            </div>
            
            <p className="text-deep-blue-gray mb-4 whitespace-pre-wrap">
              {post.content}
            </p>
            
            {/* Verse Display */}
            {post.verseReference && post.verseText && (
              <div className="bg-gradient-to-r from-spiritual-blue to-blue-600 rounded-lg p-4 mb-4">
                <div className="flex items-center mb-2">
                  <Quote className="w-4 h-4 text-white mr-2" />
                  <span className="text-white text-sm font-medium">
                    {post.verseReference}
                  </span>
                </div>
                <p className="text-white font-scripture italic">
                  "{post.verseText}"
                </p>
              </div>
            )}

            {/* Image Display */}
            {post.imageUrl && (
              <img 
                src={post.imageUrl} 
                alt="Post image" 
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
            )}
          </div>
        </div>
        
        {/* Post Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              disabled={toggleLikeMutation.isPending}
              className={`space-x-2 ${isLiked ? 'text-red-500 hover:text-red-600' : 'text-gray-600 hover:text-red-500'}`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              <span>{post._count?.likes || 0}</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className="text-gray-600 hover:text-spiritual-blue space-x-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{post._count?.comments || 0}</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="text-gray-600 hover:text-spiritual-blue space-x-2"
            >
              <Share className="w-4 h-4" />
              <span>Compartilhar</span>
            </Button>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-600 hover:text-spiritual-blue"
          >
            <Bookmark className="w-4 h-4" />
          </Button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-4 pt-4 border-t border-gray-100 bg-gray-50 -mx-6 -mb-6 px-6 pb-6">
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
