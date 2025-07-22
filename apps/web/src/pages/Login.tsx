import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import LoginForm from "@/components/LoginForm";

export default function Login() {
  const handleLoginSuccess = () => {
    // Recarregar para atualizar estado de autenticação
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute top-20 left-10 w-72 h-72 bg-spiritual-blue/10 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-divine-gold/10 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 p-6">
        <Link to="/">
          <Button variant="ghost" className="gap-2 hover:bg-white/20">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
        </Link>
      </div>

      {/* Login Form */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-120px)] px-4">
        <div className="w-full max-w-md">
          <LoginForm 
            onSuccess={handleLoginSuccess}
            onSwitchToRegister={() => window.location.href = '/registro'}
          />
          
          {/* Additional Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 mb-2">
              Primeira vez no Biblicai?
            </p>
            <Link 
              to="/registro"
              className="text-spiritual-blue hover:text-spiritual-blue-dark font-semibold hover:underline"
            >
              Criar conta gratuita
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}