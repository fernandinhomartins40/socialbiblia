import { useState, useMemo } from "react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, ArrowRight, Users, Shield } from "lucide-react";
import { PasswordStrengthIndicator } from "@/components/PasswordStrengthIndicator";
import { PasswordConfirmationIndicator } from "@/components/PasswordConfirmationIndicator";

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export default function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { signUp, isLoading } = useSupabaseAuth();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.username.trim() || !formData.email.trim() || !formData.password.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    // Validação do username
    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      toast({
        title: "Username inválido",
        description: "O username pode conter apenas letras, números e underscore (_).",
        variant: "destructive",
      });
      return;
    }

    // Validação rigorosa de senha conforme backend
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      toast({
        title: "Senha não atende aos critérios",
        description: "A senha deve ter pelo menos 8 caracteres, incluindo: 1 maiúscula, 1 minúscula, 1 número e 1 caractere especial (@$!%*?&).",
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

    try {
      await signUp({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });
      
      // Resetar form
      setFormData({
        firstName: "",
        lastName: "",
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
      
      onSuccess?.();
    } catch (error) {
      // Erro já tratado pelo hook usePlugbaseAuth
    }
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-sm font-semibold text-deep-blue-gray">
                Nome *
              </Label>
              <Input
                id="firstName"
                type="text"
                placeholder="Seu primeiro nome"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                disabled={isLoading}
                className="h-11 text-base rounded-xl border-gray-200 focus:border-divine-gold focus:ring-divine-gold/20"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-sm font-semibold text-deep-blue-gray">
                Sobrenome *
              </Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Seu sobrenome"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                disabled={isLoading}
                className="h-11 text-base rounded-xl border-gray-200 focus:border-divine-gold focus:ring-divine-gold/20"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-semibold text-deep-blue-gray">
                Nome de Usuário *
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Ex: usuario123 (apenas letras, números e _)"
                value={formData.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
                disabled={isLoading}
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
                disabled={isLoading}
                className="h-11 text-base rounded-xl border-gray-200 focus:border-divine-gold focus:ring-divine-gold/20"
                required
              />
            </div>
          </div>
          
          <div className="space-y-5">
            <div className="space-y-3">
              <Label htmlFor="password" className="text-sm font-semibold text-deep-blue-gray">
                Senha *
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Crie uma senha forte"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  disabled={isLoading}
                  className="h-12 text-base rounded-xl border-gray-200 focus:border-divine-gold focus:ring-divine-gold/20 pr-12"
                  required
                  minLength={8}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100 rounded-lg"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                </Button>
              </div>
              
              {/* Indicador de força da senha */}
              <PasswordStrengthIndicator password={formData.password} />
            </div>

            <div className="space-y-3">
              <Label htmlFor="confirmPassword" className="text-sm font-semibold text-deep-blue-gray">
                Confirmar Senha *
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Digite a senha novamente"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  disabled={isLoading}
                  className="h-12 text-base rounded-xl border-gray-200 focus:border-divine-gold focus:ring-divine-gold/20 pr-12"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100 rounded-lg"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                </Button>
              </div>
              
              {/* Indicador de confirmação de senha */}
              <PasswordConfirmationIndicator 
                password={formData.password}
                confirmPassword={formData.confirmPassword}
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 text-base font-semibold group bg-gradient-to-r from-divine-gold to-orange-600 hover:from-divine-gold-light hover:to-orange-500 text-white shadow-medium hover:shadow-strong transition-all duration-300"
            disabled={isLoading}
          >
            {isLoading ? (
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

        {onSwitchToLogin && (
          <div className="mt-8 text-center pt-6 border-t border-gray-100">
            <p className="text-base text-muted-foreground mb-4">
              Já faz parte da família Biblicai?
            </p>
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-spiritual-blue hover:text-spiritual-blue-dark font-semibold text-base hover:underline transition-all duration-200 inline-flex items-center gap-2"
              disabled={isLoading}
            >
              <span>Fazer login</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}