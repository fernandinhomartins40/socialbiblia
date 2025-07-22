import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Bot, CheckCircle, XCircle, Send } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface LLMStatus {
  available: boolean;
  status?: string;
  model?: string;
  version?: string;
  error?: string;
}

interface LLMResponse {
  success: boolean;
  data: {
    response: string;
    emotion_detected: string;
    biblical_reference: string;
    confidence: number;
    model: string;
  };
  timestamp: number;
}

export default function LocalLLMTest() {
  const [testMessage, setTestMessage] = useState('');

  // Query LLM status
  const { data: status, isLoading: statusLoading } = useQuery<LLMStatus>({
    queryKey: ['/api/llm/status'],
    refetchInterval: 5000, // Check status every 5 seconds
  });

  // Test LLM mutation
  const testMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest('/api/llm/test', {
        method: 'POST',
        body: JSON.stringify({ message }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response as LLMResponse;
    },
  });

  const handleTest = () => {
    if (testMessage.trim()) {
      testMutation.mutate(testMessage);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTest();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Local LLM Status - Phi-2 Biblical AI
          </CardTitle>
          <CardDescription>
            Status do modelo de inteligência artificial local baseado no Phi-2 (2.7B)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {statusLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Verificando status...</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {status?.available ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <Badge variant={status?.available ? "default" : "destructive"}>
                  {status?.available ? "Online" : "Offline"}
                </Badge>
                {status?.model && (
                  <Badge variant="outline">
                    {status.model} {status.version}
                  </Badge>
                )}
              </div>
              
              {status?.error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  {status.error}
                </div>
              )}

              {status?.available && (
                <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
                  Servidor LLM local está rodando e pronto para uso. O modelo Phi-2 está 
                  configurado com conhecimento bíblico especializado.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Teste do LLM Local</CardTitle>
          <CardDescription>
            Envie uma mensagem para testar a resposta do modelo Phi-2 local
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Digite uma mensagem para testar o LLM..."
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={testMutation.isPending || !status?.available}
              />
              <Button 
                onClick={handleTest}
                disabled={testMutation.isPending || !testMessage.trim() || !status?.available}
              >
                {testMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>

            {testMutation.data && (
              <div className="space-y-3">
                <div className="bg-blue-50 p-4 rounded-md">
                  <h4 className="font-medium text-blue-900 mb-2">Resposta do LLM:</h4>
                  <p className="text-blue-800">{testMutation.data.data.response}</p>
                </div>

                {testMutation.data.data.biblical_reference && (
                  <div className="bg-purple-50 p-4 rounded-md">
                    <h4 className="font-medium text-purple-900 mb-2">Referência Bíblica:</h4>
                    <p className="text-purple-800">{testMutation.data.data.biblical_reference}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-gray-50 p-3 rounded-md">
                    <span className="font-medium">Emoção Detectada:</span>
                    <br />
                    <Badge variant="outline" className="mt-1">
                      {testMutation.data.data.emotion_detected}
                    </Badge>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <span className="font-medium">Confiança:</span>
                    <br />
                    <Badge variant="outline" className="mt-1">
                      {Math.round(testMutation.data.data.confidence * 100)}%
                    </Badge>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <span className="font-medium">Modelo:</span>
                    <br />
                    <Badge variant="outline" className="mt-1">
                      {testMutation.data.data.model}
                    </Badge>
                  </div>
                </div>
              </div>
            )}

            {testMutation.error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                Erro: {testMutation.error.message}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Sistema</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div><strong>Modelo:</strong> Phi-2 (2.7B parâmetros)</div>
          <div><strong>Especialização:</strong> Conhecimento bíblico e análise emocional</div>
          <div><strong>Servidor:</strong> Flask local na porta 8080</div>
          <div><strong>Integração:</strong> Fallback automático para AI engine nativo</div>
          <div><strong>Características:</strong> Respostas contextuais, análise de sentimentos, recomendações de versículos</div>
        </CardContent>
      </Card>
    </div>
  );
}