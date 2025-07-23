import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Heart, 
  MessageCircle, 
  Share, 
  Bookmark, 
  Send, 
  Quote, 
  Sparkles, 
  MoreHorizontal, 
  Clock,
  CheckCircle,
  Trash2 
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { PostWithUser } from "@/lib/shared-types";

interface PostProps {
  post: PostWithUser;
}

export default function Post({ post }: PostProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");

  // Load comments when showing comments section
  const { data: commentsData, isLoading: commentsLoading } = useQuery({
    queryKey: ["comments", post.id],
    queryFn: () => apiClient.getComments(post.id),
    enabled: showComments,
  });

  const comments = commentsData?.comments || [];

  const authorName = post.author.firstName && post.author.lastName
    ? `${post.author.firstName} ${post.author.lastName}`
    : post.author.name;

  const toggleLikeMutation = useMutation({
    mutationFn: async () => {
      return await apiClient.likePost({
        postId: post.id,
        action: post.isLiked ? 'unlike' : 'like'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      toast({
        title: post.isLiked ? "Like removido" : "Post curtido!",
        description: post.isLiked ? "Você descurtiu este post." : "Você curtiu este post.",
      });
    },
    onError: (error: any) => {
      console.error('Like error:', error);
      toast({
        title: "Erro",
        description: "Não foi possível curtir o post. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiClient.createComment({
        content,
        postId: post.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", post.id] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      setCommentText("");
      toast({
        title: "Comentário adicionado!",
        description: "Seu comentário foi publicado com sucesso.",
      });
    },
    onError: (error: any) => {
      console.error('Create comment error:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o comentário. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleCreateComment = () => {
    if (!commentText.trim()) return;
    createCommentMutation.mutate(commentText.trim());
  };

  const deletePostMutation = useMutation({
    mutationFn: async () => {
      return await apiClient.deletePost(post.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      toast({
        title: "Post excluído!",
        description: "Seu post foi excluído com sucesso.",
      });
    },
    onError: (error: any) => {
      console.error('Delete post error:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o post. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleDeletePost = () => {
    if (window.confirm("Tem certeza que deseja excluir este post? Esta ação não pode ser desfeita.")) {
      deletePostMutation.mutate();
    }
  };

  const isOwnPost = user?.id === post.authorId;

  const getPostTypeInfo = () => {
    if (post.verseReference && post.verseText) {
      return {
        icon: <Quote className="w-4 h-4" />,
        label: "Versículo Bíblico",
        color: "bg-divine-gold/10 text-orange-700 border-divine-gold/30"
      };
    }
    return {
      icon: <Sparkles className="w-4 h-4" />,
      label: "Reflexão",
      color: "bg-spiritual-blue/10 text-spiritual-blue border-spiritual-blue/30"
    };
  };

  const postTypeInfo = getPostTypeInfo();

  return (
    <Card className="card-modern overflow-hidden hover:shadow-medium transition-all duration-300">
      <CardContent className="p-0">
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <div className="relative">
                <Avatar className="h-12 w-12 ring-2 ring-spiritual-blue/10">
                  <AvatarImage 
                    src={post.author.profileImageUrl || ""} 
                    alt={authorName}
                  />
                  <AvatarFallback className="bg-gradient-spiritual text-white font-semibold">
                    {authorName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {post.author.isVerified && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-spiritual-blue rounded-full flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-deep-blue-gray">{authorName}</h3>
                  {post.author.denomination && (
                    <Badge variant="secondary" className="text-xs">
                      {post.author.denomination}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <Badge className={`text-xs font-medium border ${postTypeInfo.color}`}>
                    {postTypeInfo.icon}
                    <span className="ml-1">{postTypeInfo.label}</span>
                  </Badge>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="w-3 h-3 mr-1" />
                    <span>
                      {formatDistanceToNow(new Date(post.createdAt), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="rounded-full h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isOwnPost && (
                  <DropdownMenuItem 
                    onClick={handleDeletePost}
                    disabled={deletePostMutation.isPending}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {deletePostMutation.isPending ? "Excluindo..." : "Excluir post"}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem>
                  <Share className="w-4 h-4 mr-2" />
                  Compartilhar
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Bookmark className="w-4 h-4 mr-2" />
                  Salvar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-4">
          <div className="space-y-4">
            {/* Main Content */}
            <div className="text-base leading-relaxed text-gray-800">
              {post.content}
            </div>

            {/* Verse Display */}
            {post.verseReference && post.verseText && (
              <div className="relative overflow-hidden bg-gradient-to-br from-spiritual-blue/5 via-blue-50/50 to-purple-100/30 rounded-2xl p-6 border border-spiritual-blue/10">
                <div className="absolute top-3 right-3 opacity-20">
                  <Quote className="w-8 h-8 text-spiritual-blue" />
                </div>
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 bg-spiritual-blue/10 text-spiritual-blue px-3 py-1 rounded-full text-xs font-semibold mb-3">
                    <Quote className="w-3 h-3" />
                    <span>{post.verseReference}</span>
                  </div>
                  <blockquote className="text-base italic leading-relaxed text-deep-blue-gray font-scripture">
                    "{post.verseText}"
                  </blockquote>
                </div>
              </div>
            )}

            {/* Image */}
            {post.imageUrl && (
              <div className="rounded-2xl overflow-hidden">
                <img 
                  src={post.imageUrl} 
                  alt="Post image" 
                  className="w-full h-auto object-cover"
                />
              </div>
            )}
          </div>
        </div>

        {/* Engagement Stats */}
        <div className="px-6 pb-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground border-t border-gray-100 pt-4">
            <div className="flex items-center space-x-4">
              {post.stats.likesCount > 0 && (
                <span>{post.stats.likesCount} {post.stats.likesCount === 1 ? 'curtida' : 'curtidas'}</span>
              )}
              {post.stats.commentsCount > 0 && (
                <span>{post.stats.commentsCount} {post.stats.commentsCount === 1 ? 'comentário' : 'comentários'}</span>
              )}
            </div>
            {post.stats.sharesCount > 0 && (
              <span>{post.stats.sharesCount} {post.stats.sharesCount === 1 ? 'compartilhamento' : 'compartilhamentos'}</span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleLikeMutation.mutate()}
                disabled={toggleLikeMutation.isPending}
                className={`rounded-xl px-4 py-2 transition-all duration-200 ${
                  post.isLiked
                    ? "bg-red-50 text-red-600 hover:bg-red-100"
                    : "hover:bg-gray-50 text-gray-700"
                }`}
              >
                <Heart 
                  className={`w-4 h-4 mr-2 ${
                    post.isLiked ? "fill-current" : ""
                  }`} 
                />
                <span className="font-medium">
                  {post.isLiked ? "Curtido" : "Curtir"}
                </span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowComments(!showComments)}
                className="rounded-xl px-4 py-2 hover:bg-gray-50 text-gray-700"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                <span className="font-medium">Comentar</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="rounded-xl px-4 py-2 hover:bg-gray-50 text-gray-700"
              >
                <Share className="w-4 h-4 mr-2" />
                <span className="font-medium">Compartilhar</span>
              </Button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl px-3 py-2 hover:bg-gray-50 text-gray-700"
            >
              <Bookmark className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="border-t border-gray-100 px-6 py-4 bg-gray-50/50">
            <div className="space-y-4">
              {/* Add Comment */}
              <div className="flex items-start space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage 
                    src={user?.profileImageUrl || ""} 
                    alt={user?.name || ""}
                  />
                  <AvatarFallback className="bg-gradient-spiritual text-white text-sm">
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 flex items-center space-x-2">
                  <Input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Escreva um comentário inspirador..."
                    className="flex-1 rounded-full border-gray-200 focus:border-spiritual-blue"
                  />
                  <Button 
                    size="sm" 
                    className="rounded-full w-8 h-8 p-0 bg-spiritual-blue hover:bg-spiritual-blue-dark"
                    disabled={!commentText.trim() || createCommentMutation.isPending}
                    onClick={handleCreateComment}
                  >
                    {createCommentMutation.isPending ? (
                      <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Comments List */}
              {commentsLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex items-start space-x-3 animate-pulse">
                      <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-gray-200 rounded w-20"></div>
                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : comments.length > 0 ? (
                <div className="space-y-4">
                  {comments.map((comment: any) => (
                    <div key={comment.id} className="flex items-start space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage 
                          src={comment.author.profileImageUrl || ""} 
                          alt={comment.author.name || ""}
                        />
                        <AvatarFallback className="bg-gradient-spiritual text-white text-sm">
                          {comment.author.name?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="bg-gray-100 rounded-2xl px-4 py-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm text-deep-blue-gray">
                              {comment.author.firstName && comment.author.lastName
                                ? `${comment.author.firstName} ${comment.author.lastName}`
                                : comment.author.name}
                            </span>
                            {comment.author.denomination && (
                              <Badge variant="secondary" className="text-xs">
                                {comment.author.denomination}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-800 leading-relaxed">
                            {comment.content}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>
                            {formatDistanceToNow(new Date(comment.createdAt), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </span>
                          <Button variant="ghost" size="sm" className="h-auto p-0 text-xs font-medium">
                            Curtir
                          </Button>
                          <Button variant="ghost" size="sm" className="h-auto p-0 text-xs font-medium">
                            Responder
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-4">
                  Seja o primeiro a comentar neste post...
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}