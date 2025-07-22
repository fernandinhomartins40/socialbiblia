import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import RegisterForm from "@/components/RegisterForm";

export default function Register() {
  const handleRegisterSuccess = () => {
    // Redirecionar para login após registro bem-sucedido
    setTimeout(() => {
      window.location.href = '/login';
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute top-20 left-10 w-72 h-72 bg-divine-gold/10 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-hope-green/10 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-spiritual-blue/10 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse delay-500"></div>
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

      {/* Register Form */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-120px)] px-4 py-8">
        <div className="w-full max-w-lg">
          <RegisterForm 
            onSuccess={handleRegisterSuccess}
            onSwitchToLogin={() => window.location.href = '/login'}
          />
          
          {/* Additional Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 mb-2">
              Já faz parte da família Biblicai?
            </p>
            <Link 
              to="/login"
              className="text-spiritual-blue hover:text-spiritual-blue-dark font-semibold hover:underline"
            >
              Fazer login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}