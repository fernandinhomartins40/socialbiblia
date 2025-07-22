import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, ArrowRight, Users, Shield } from "lucide-react";

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export default function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();

  const registerMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; password: string; phone?: string }) => {
      return await apiClient.register(data);
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Conta criada com sucesso!",
          description: "Verifique seu email para ativar sua conta.",
        });
        // Resetar form
        setFormData({
          name: "",
          email: "",
          phone: "",
          password: "",
          confirmPassword: "",
        });
        onSuccess?.();
        // Switch para login após registro
        setTimeout(() => {
          onSwitchToLogin?.();
        }, 2000);
      } else {
        throw new Error(data.message || "Erro no registro");
      }
    },
    onError: (error: Error) => {
      console.error("Register error:", error);
      toast({
        title: "Erro no registro",
        description: error.message || "Não foi possível criar a conta. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Senhas não conferem",
        description: "As senhas digitadas não são iguais.",
        variant: "destructive",
      });
      return;
    }

    const registerData = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      password: formData.password,
      ...(formData.phone.trim() && { phone: formData.phone.trim() }),
    };

    registerMutation.mutate(registerData);
  };

  return (
    <Card className="w-full card-modern overflow-hidden bg-white dark:bg-gray-900 border-0 shadow-none">
      {/* Background Decoration */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-divine-gold via-orange-500 to-red-500 opacity-5"></div>
      
      <CardHeader className="text-center relative z-10 pb-8">
        <div className="flex items-center justify-center mb-6">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-br from-divine-gold to-orange-600 rounded-2xl flex items-center justify-center shadow-strong">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-hope-green rounded-full flex items-center justify-center">
              <Shield className="w-3 h-3 text-white" />
            </div>
          </div>
        </div>
        
        <CardTitle className="text-3xl font-black bg-gradient-to-r from-divine-gold via-orange-600 to-red-500 bg-clip-text text-transparent mb-3">
          Junte-se à Comunidade
        </CardTitle>
        <p className="text-muted-foreground text-lg">
          Crie sua conta e inicie sua jornada espiritual conosco
        </p>
      </CardHeader>
      <CardContent className="px-8 pb-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold text-deep-blue-gray">
                Nome Completo *
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Digite seu nome completo"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                disabled={registerMutation.isPending}
                className="h-11 text-base rounded-xl border-gray-200 focus:border-divine-gold focus:ring-divine-gold/20"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-deep-blue-gray">
                Endereço de Email *
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Digite seu melhor email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                disabled={registerMutation.isPending}
                className="h-11 text-base rounded-xl border-gray-200 focus:border-divine-gold focus:ring-divine-gold/20"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-semibold text-deep-blue-gray">
                Telefone (opcional)
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(11) 99999-9999"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                disabled={registerMutation.isPending}
                className="h-11 text-base rounded-xl border-gray-200 focus:border-divine-gold focus:ring-divine-gold/20"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold text-deep-blue-gray">
                Senha *
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  disabled={registerMutation.isPending}
                  className="h-11 text-base rounded-xl border-gray-200 focus:border-divine-gold focus:ring-divine-gold/20 pr-11"
                  required
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-gray-100 rounded-lg"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={registerMutation.isPending}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-semibold text-deep-blue-gray">
                Confirmar Senha *
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Digite novamente"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  disabled={registerMutation.isPending}
                  className="h-11 text-base rounded-xl border-gray-200 focus:border-divine-gold focus:ring-divine-gold/20 pr-11"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-gray-100 rounded-lg"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={registerMutation.isPending}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 text-base font-semibold group bg-gradient-to-r from-divine-gold to-orange-600 hover:from-divine-gold-light hover:to-orange-500 text-white shadow-medium hover:shadow-strong transition-all duration-300"
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? (
              <>
                <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                Criando sua conta...
              </>
            ) : (
              <>
                <Users className="mr-2 h-5 w-5" />
                <span className="mr-2">Criar Minha Conta</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>
        </form>

        <div className="mt-8 text-center pt-6 border-t border-gray-100">
          <p className="text-base text-muted-foreground mb-4">
            Já faz parte da família Biblicai?
          </p>
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-spiritual-blue hover:text-spiritual-blue-dark font-semibold text-base hover:underline transition-all duration-200 inline-flex items-center gap-2"
            disabled={registerMutation.isPending}
          >
            <span>Fazer login</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}