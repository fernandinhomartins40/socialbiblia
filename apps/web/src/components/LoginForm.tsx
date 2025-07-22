import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, Heart, Sparkles, ArrowRight } from "lucide-react";

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
}

export default function LoginForm({ onSuccess, onSwitchToRegister }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      return await apiClient.login(data);
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Login realizado com sucesso!",
          description: "Bem-vindo(a) de volta!",
        });
        // Recarregar a página para atualizar o estado de autenticação
        window.location.reload();
        onSuccess?.();
      } else {
        throw new Error(data.message || "Erro no login");
      }
    },
    onError: (error: Error) => {
      console.error("Login error:", error);
      toast({
        title: "Erro no login",
        description: error.message || "Email ou senha incorretos. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }
    loginMutation.mutate({ email: email.trim(), password });
  };

  return (
    <Card className="w-full card-modern overflow-hidden bg-white dark:bg-gray-900 border-0 shadow-none">
      {/* Background Decoration */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-spiritual-blue via-blue-600 to-purple-700 opacity-5"></div>
      
      <CardHeader className="text-center relative z-10 pb-8">
        <div className="flex items-center justify-center mb-6">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-spiritual rounded-2xl flex items-center justify-center shadow-strong">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-divine-gold rounded-full flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
          </div>
        </div>
        
        <CardTitle className="text-3xl font-black bg-gradient-to-r from-spiritual-blue to-purple-600 bg-clip-text text-transparent mb-3">
          Bem-vindo de volta!
        </CardTitle>
        <p className="text-muted-foreground text-lg">
          Entre na sua conta e continue sua jornada espiritual
        </p>
      </CardHeader>
      <CardContent className="px-8 pb-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="email" className="text-sm font-semibold text-deep-blue-gray">
              Endereço de Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Digite seu email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loginMutation.isPending}
              className="h-12 text-base rounded-xl border-gray-200 focus:border-spiritual-blue focus:ring-spiritual-blue/20"
              required
            />
          </div>
          
          <div className="space-y-3">
            <Label htmlFor="password" className="text-sm font-semibold text-deep-blue-gray">
              Senha
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loginMutation.isPending}
                className="h-12 text-base rounded-xl border-gray-200 focus:border-spiritual-blue focus:ring-spiritual-blue/20 pr-12"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100 rounded-lg"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loginMutation.isPending}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-500" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-500" />
                )}
              </Button>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full btn-primary h-12 text-base font-semibold group"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? (
              <>
                <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                Entrando na sua conta...
              </>
            ) : (
              <>
                <span className="mr-2">Entrar na minha conta</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>
        </form>

        <div className="mt-8 text-center pt-6 border-t border-gray-100">
          <p className="text-base text-muted-foreground mb-4">
            Primeira vez no Biblicai?
          </p>
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="text-spiritual-blue hover:text-spiritual-blue-dark font-semibold text-base hover:underline transition-all duration-200 inline-flex items-center gap-2"
            disabled={loginMutation.isPending}
          >
            <span>Criar conta gratuita</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}