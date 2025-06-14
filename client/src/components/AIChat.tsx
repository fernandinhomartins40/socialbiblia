import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, ThumbsUp, ThumbsDown, MessageCircle, Quote } from "lucide-react";

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  verse?: {
    book: string;
    chapter: number;
    verse: number;
    text: string;
  };
  emotion?: string;
  confidence?: number;
  intensity?: number;
  themes?: string[];
  recommendations?: Array<{
    verse: {
      book: string;
      chapter: number;
      verse: number;
      text: string;
    };
    relevanceScore: number;
  }>;
  timestamp: Date;
}

interface AIChatProps {
  onClose: () => void;
}

export default function AIChat({ onClose }: AIChatProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      type: 'ai',
      content: 'Olá! Sou seu assistente bíblico. Como posso ajudá-lo hoje? Conte-me como está se sentindo ou sobre alguma situação que está enfrentando.',
      timestamp: new Date(),
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const emotions = [
    { key: 'anxiety', label: 'Ansiedade', color: 'bg-red-100 text-red-800' },
    { key: 'sadness', label: 'Tristeza', color: 'bg-blue-100 text-blue-800' },
    { key: 'joy', label: 'Alegria', color: 'bg-yellow-100 text-yellow-800' },
    { key: 'fear', label: 'Medo', color: 'bg-purple-100 text-purple-800' },
    { key: 'loneliness', label: 'Solidão', color: 'bg-gray-100 text-gray-800' },
    { key: 'hope', label: 'Esperança', color: 'bg-green-100 text-green-800' },
    { key: 'anger', label: 'Raiva', color: 'bg-orange-100 text-orange-800' },
    { key: 'love', label: 'Amor', color: 'bg-pink-100 text-pink-800' },
  ];

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { message: string; emotion?: string }) => {
      const response = await apiRequest("POST", "/api/ai/chat", data);
      return response.json();
    },
    onSuccess: (data) => {
      const aiMessage: Message = {
        id: data.id,
        type: 'ai',
        content: data.response,
        verse: data.verse,
        emotion: data.emotion,
        confidence: data.confidence,
        intensity: data.intensity,
        themes: data.themes,
        recommendations: data.recommendations,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
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
        description: "Não foi possível enviar a mensagem. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const feedbackMutation = useMutation({
    mutationFn: async (data: { 
      interactionId: string; 
      feedback: string; 
      verseId?: string; 
      emotion?: string; 
      context?: string; 
    }) => {
      await apiRequest("POST", "/api/ai/feedback", data);
    },
    onSuccess: () => {
      toast({
        title: "Feedback enviado!",
        description: "Sua avaliação ajuda nosso AI a melhorar as recomendações bíblicas.",
      });
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
      console.error("Feedback error:", error);
    },
  });

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    
    sendMessageMutation.mutate({
      message: inputMessage,
      emotion: selectedEmotion || undefined,
    });

    setInputMessage("");
    setSelectedEmotion(null);
  };

  const handleEmotionSelect = (emotion: string) => {
    setSelectedEmotion(emotion);
    const emotionLabel = emotions.find(e => e.key === emotion)?.label || emotion;
    setInputMessage(`Estou me sentindo ${emotionLabel.toLowerCase()}`);
  };

  const handleFeedback = (messageId: string, feedback: 'useful' | 'not_useful') => {
    // Find the message to get context for ML learning
    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    // Map feedback to ML-compatible values
    const mlFeedback = feedback === 'useful' ? 'helpful' : 'not_helpful';
    
    feedbackMutation.mutate({
      interactionId: messageId,
      feedback: mlFeedback,
      verseId: message.verse?.book ? `${message.verse.book}_${message.verse.chapter}_${message.verse.verse}` : undefined,
      emotion: message.emotion,
      context: message.content,
    });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!user) return null;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="bg-gradient-to-r from-spiritual-blue to-blue-600 text-white p-6 rounded-t-lg">
          <div className="flex items-center space-x-2">
            <MessageCircle className="w-6 h-6" />
            <DialogTitle className="text-xl">Assistente Bíblico</DialogTitle>
          </div>
          <p className="text-blue-100 text-sm">
            Compartilhe seus sentimentos e encontre conforto nas Escrituras
          </p>
        </DialogHeader>

        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                    {message.type === 'ai' && (
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-8 h-8 bg-spiritual-blue rounded-full flex items-center justify-center">
                          <MessageCircle className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm text-gray-600">Assistente Bíblico</span>
                      </div>
                    )}
                    
                    <Card className={message.type === 'user' ? 'bg-spiritual-blue text-white' : 'bg-gray-50'}>
                      <CardContent className="p-3">
                        <p className="text-sm whitespace-pre-wrap">
                          {message.content}
                        </p>
                        
                        {/* Verse Display */}
                        {message.verse && (
                          <div className="mt-3 p-3 bg-white rounded-lg border-l-4 border-spiritual-blue">
                            <div className="flex items-center mb-2">
                              <Quote className="w-4 h-4 text-spiritual-blue mr-2" />
                              <span className="text-xs text-spiritual-blue font-medium">
                                {message.verse.book} {message.verse.chapter}:{message.verse.verse}
                              </span>
                            </div>
                            <p className="text-xs font-scripture italic text-deep-blue-gray">
                              "{message.verse.text}"
                            </p>
                          </div>
                        )}

                        {/* Advanced ML Analytics Display */}
                        {message.type === 'ai' && message.emotion && (
                          <div className="mt-3 space-y-2">
                            {/* Emotion Analysis */}
                            <div className="flex items-center space-x-2">
                              <Badge variant="secondary" className="text-xs">
                                {emotions.find(e => e.key === message.emotion)?.label || message.emotion}
                              </Badge>
                              {message.confidence && (
                                <span className="text-xs text-gray-500">
                                  {message.confidence}% confiança
                                </span>
                              )}
                            </div>

                            {/* Intensity and Themes */}
                            {(message.intensity || message.themes) && (
                              <div className="bg-blue-50 p-2 rounded text-xs">
                                {message.intensity && (
                                  <div className="flex items-center space-x-1 mb-1">
                                    <span className="text-gray-600">Intensidade:</span>
                                    <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                                      <div 
                                        className="bg-spiritual-blue h-1.5 rounded-full transition-all"
                                        style={{ width: `${message.intensity}%` }}
                                      />
                                    </div>
                                    <span className="text-gray-500">{message.intensity}%</span>
                                  </div>
                                )}
                                {message.themes && message.themes.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    <span className="text-gray-600">Temas:</span>
                                    {message.themes.map((theme, idx) => (
                                      <Badge key={idx} variant="outline" className="text-xs py-0">
                                        {theme}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Additional Verse Recommendations */}
                            {message.recommendations && message.recommendations.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs text-gray-600 mb-2">Versículos recomendados:</p>
                                <div className="space-y-1">
                                  {message.recommendations.slice(0, 2).map((rec, idx) => (
                                    <div key={idx} className="bg-spiritual-light p-2 rounded text-xs border-l-2 border-spiritual-blue">
                                      <div className="flex justify-between items-center mb-1">
                                        <span className="font-medium text-spiritual-blue">
                                          {rec.verse.book} {rec.verse.chapter}:{rec.verse.verse}
                                        </span>
                                        <span className="text-gray-500">{rec.relevanceScore}% relevante</span>
                                      </div>
                                      <p className="text-gray-700 italic">
                                        "{rec.verse.text.substring(0, 100)}{rec.verse.text.length > 100 ? '...' : ''}"
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Feedback Buttons for AI messages */}
                        {message.type === 'ai' && message.id !== 'welcome' && (
                          <div className="flex items-center space-x-2 mt-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleFeedback(message.id, 'useful')}
                              className="text-xs h-7 px-2"
                            >
                              <ThumbsUp className="w-3 h-3 mr-1" />
                              Útil
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleFeedback(message.id, 'not_useful')}
                              className="text-xs h-7 px-2"
                            >
                              <ThumbsDown className="w-3 h-3 mr-1" />
                              Não útil
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                  
                  {message.type === 'user' && (
                    <img 
                      src={user.profileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.firstName || user.email || 'User')}&background=4A90E2&color=fff`} 
                      alt="Your profile" 
                      className="w-8 h-8 rounded-full object-cover order-1 mr-2"
                    />
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t border-gray-200 p-4">
            {/* Emotion Quick Select */}
            <div className="flex flex-wrap gap-2 mb-4">
              {emotions.map((emotion) => (
                <Button
                  key={emotion.key}
                  size="sm"
                  variant="outline"
                  onClick={() => handleEmotionSelect(emotion.key)}
                  className={`text-xs h-7 ${selectedEmotion === emotion.key ? 'bg-spiritual-blue text-white' : ''}`}
                >
                  {emotion.label}
                </Button>
              ))}
            </div>

            {/* Message Input */}
            <div className="flex items-center space-x-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Como você está se sentindo?"
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <Button
                onClick={handleSendMessage}
                disabled={sendMessageMutation.isPending || !inputMessage.trim()}
                className="bg-spiritual-blue hover:bg-blue-600 text-white"
              >
                {sendMessageMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
