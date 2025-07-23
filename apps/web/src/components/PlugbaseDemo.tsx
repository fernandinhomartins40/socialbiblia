import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { usePlugbaseAuth } from '@/hooks/usePlugbaseAuth'
import { useWebSocket } from '@/hooks/useWebSocket'
import { usePosts, useCreatePost, useUsers } from '@/hooks/usePlugbaseAPI'
import { FileUpload } from '@/components/FileUpload'
import { NotificationCenter } from '@/components/NotificationCenter'
import { StorageFile } from '@/lib/plugbase-api'
import { 
  Users, 
  MessageSquare, 
  Upload, 
  Wifi, 
  WifiOff,
  Bell,
  Plus,
  Loader2
} from 'lucide-react'

export function PlugbaseDemo() {
  const { user, logout, isAuthenticated } = usePlugbaseAuth()
  const { isConnected, emit, notifications, unreadCount } = useWebSocket()
  const [newPostTitle, setNewPostTitle] = useState('')
  const [newPostContent, setNewPostContent] = useState('')
  
  // Queries
  const { data: postsData, isLoading: postsLoading } = usePosts(1, 5)
  const { data: usersData, isLoading: usersLoading } = useUsers(1, 5)
  const createPostMutation = useCreatePost()

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPostTitle.trim() || !newPostContent.trim()) return
    
    try {
      await createPostMutation.mutateAsync({
        title: newPostTitle.trim(),
        content: newPostContent.trim(),
      })
      setNewPostTitle('')
      setNewPostContent('')
    } catch (error) {
      console.error('Erro ao criar post:', error)
    }
  }

  const handleFileUpload = (files: StorageFile[]) => {
    console.log('Arquivos enviados:', files)
    // Aqui você pode integrar os arquivos com posts ou outras funcionalidades
  }

  const testWebSocket = () => {
    emit('test_message', { message: 'Teste do WebSocket', timestamp: new Date().toISOString() })
  }

  if (!isAuthenticated || !user) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <p className="text-lg text-muted-foreground">
            Faça login para ver a demonstração do Plugbase
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header com Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                🔌 Demonstração Plugbase
                <Badge variant={isConnected ? 'default' : 'secondary'}>
                  {isConnected ? (
                    <>
                      <Wifi className="w-3 h-3 mr-1" />
                      Conectado
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3 h-3 mr-1" />
                      Desconectado
                    </>
                  )}
                </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Bem-vindo, {user.name}! ({user.email})
              </p>
            </div>
            <div className="flex items-center gap-2">
              <NotificationCenter />
              <Button variant="outline" onClick={logout}>
                Sair
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Criar Post */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Criar Post
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreatePost} className="space-y-4">
              <Input
                placeholder="Título do post"
                value={newPostTitle}
                onChange={(e) => setNewPostTitle(e.target.value)}
                disabled={createPostMutation.isPending}
              />
              <Textarea
                placeholder="Conteúdo do post"
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                disabled={createPostMutation.isPending}
                rows={3}
              />
              <Button 
                type="submit" 
                disabled={createPostMutation.isPending || !newPostTitle.trim() || !newPostContent.trim()}
                className="w-full"
              >
                {createPostMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  'Criar Post'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Upload de Arquivos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload de Arquivos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FileUpload
              accept="image/*,application/pdf,.doc,.docx"
              multiple={true}
              maxSize={5}
              onSuccess={handleFileUpload}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Posts Recentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Posts Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {postsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : postsData?.posts.length ? (
              <div className="space-y-3">
                {postsData.posts.map((post) => (
                  <div key={post.id} className="p-3 border rounded-lg">
                    <h4 className="font-medium text-sm">{post.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {post.content}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">
                        Por {post.author.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(post.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum post encontrado
              </p>
            )}
          </CardContent>
        </Card>

        {/* Usuários */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Usuários
            </CardTitle>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : usersData?.users.length ? (
              <div className="space-y-3">
                {usersData.users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {user.role}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum usuário encontrado
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* WebSocket Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Teste WebSocket & Notificações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm">
                Status: {isConnected ? 'Conectado' : 'Desconectado'}
              </p>
              <p className="text-sm text-muted-foreground">
                Notificações não lidas: {unreadCount}
              </p>
            </div>
            <Button onClick={testWebSocket} disabled={!isConnected}>
              Testar WebSocket
            </Button>
          </div>
          
          {notifications.length > 0 && (
            <>
              <Separator className="my-4" />
              <div className="space-y-2">
                <h5 className="text-sm font-medium">Últimas notificações:</h5>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {notifications.slice(0, 3).map((notification) => (
                    <div 
                      key={notification.id} 
                      className="text-xs p-2 bg-muted rounded border-l-2 border-l-blue-500"
                    >
                      <div className="font-medium">{notification.title}</div>
                      <div className="text-muted-foreground">{notification.message}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}