import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Users, MessageCircle, BookOpen, Sparkles, Shield, Zap, Star, ArrowRight } from "lucide-react";
import AuthModal from "@/components/AuthModal";

export default function Landing() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "register">("login");

  const handleLogin = () => {
    setAuthTab("login");
    setShowAuthModal(true);
  };

  const handleRegister = () => {
    setAuthTab("register");
    setShowAuthModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute top-20 left-10 w-72 h-72 bg-spiritual-blue/10 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-divine-gold/10 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse delay-1000"></div>
        <div className="absolute -bottom-32 left-20 w-72 h-72 bg-hope-green/10 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse delay-500"></div>
      </div>

      {/* Hero Section */}
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="text-center mb-20">
          <div className="flex items-center justify-center mb-8">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-spiritual rounded-2xl flex items-center justify-center shadow-strong rotate-3">
                <Heart className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-divine-gold rounded-full flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            </div>
          </div>
          
          <h1 className="text-7xl md:text-8xl font-black bg-gradient-to-r from-spiritual-blue via-purple-600 to-spiritual-blue bg-clip-text text-transparent mb-6 leading-tight">
            BibliaConnect
          </h1>
          
          <p className="text-2xl text-gray-700 mb-4 max-w-3xl mx-auto font-medium leading-relaxed">
            A rede social cristã que conecta corações através da 
            <span className="text-spiritual-blue font-bold"> Palavra de Deus</span>
          </p>
          
          <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
            Experimente o poder da IA bíblica, encontre sua comunidade de fé e cresça espiritualmente em um ambiente seguro e acolhedor.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              className="btn-primary group text-lg px-10 py-4"
              onClick={handleLogin}
            >
              <span className="mr-2">Entrar Agora</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              className="btn-secondary text-lg px-10 py-4"
              onClick={handleRegister}
            >
              Criar Conta Gratuita
            </Button>
          </div>
          
          <div className="flex items-center justify-center gap-8 mt-12 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-hope-green" />
              <span>100% Seguro</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-spiritual-blue" />
              <span>+10k Membros</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-divine-gold" />
              <span>5.0 Estrelas</span>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          <Card className="card-modern text-center group hover:scale-105 transition-all duration-300">
            <CardContent className="p-8">
              <div className="relative mx-auto mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-spiritual-blue to-spiritual-blue-dark rounded-2xl flex items-center justify-center shadow-medium group-hover:shadow-strong transition-all duration-300 rotate-3 group-hover:rotate-6">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-divine-gold rounded-full flex items-center justify-center">
                  <Zap className="w-3 h-3 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-deep-blue-gray">IA Bíblica Inteligente</h3>
              <p className="text-gray-600 leading-relaxed">
                Nossa IA revolucionária compreende seus sentimentos e encontra passagens bíblicas que falam diretamente ao seu coração, oferecendo conforto e orientação divina.
              </p>
            </CardContent>
          </Card>

          <Card className="card-modern text-center group hover:scale-105 transition-all duration-300">
            <CardContent className="p-8">
              <div className="relative mx-auto mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-divine-gold to-yellow-600 rounded-2xl flex items-center justify-center shadow-medium group-hover:shadow-strong transition-all duration-300 rotate-3 group-hover:rotate-6">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-spiritual-blue rounded-full flex items-center justify-center">
                  <Heart className="w-3 h-3 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-deep-blue-gray">Comunidade Acolhedora</h3>
              <p className="text-gray-600 leading-relaxed">
                Conecte-se com milhares de irmãos em fé, compartilhe experiências autênticas e participe de comunidades temáticas que edificam sua jornada espiritual.
              </p>
            </CardContent>
          </Card>

          <Card className="card-modern text-center group hover:scale-105 transition-all duration-300">
            <CardContent className="p-8">
              <div className="relative mx-auto mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-hope-green to-green-600 rounded-2xl flex items-center justify-center shadow-medium group-hover:shadow-strong transition-all duration-300 rotate-3 group-hover:rotate-6">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-divine-gold rounded-full flex items-center justify-center">
                  <Star className="w-3 h-3 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-deep-blue-gray">Crescimento Espiritual</h3>
              <p className="text-gray-600 leading-relaxed">
                Acompanhe seu progresso na fé, participe de estudos bíblicos profundos e desenvolva uma relação mais íntima com Deus através de ferramentas personalizadas.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Testimonials */}
        <div className="card-modern p-12 mb-20">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-gradient-spiritual text-white px-6 py-2 rounded-full text-sm font-semibold mb-4">
              <Star className="w-4 h-4" />
              <span>Depoimentos Reais</span>
              <Star className="w-4 h-4" />
            </div>
            <h2 className="text-4xl font-bold text-deep-blue-gray mb-4">
              Transformações que Inspiram
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Descubra como o BibliaConnect tem impactado a vida espiritual de milhares de pessoas
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="group">
              <div className="relative bg-gradient-to-br from-spiritual-blue via-blue-600 to-purple-600 rounded-2xl p-8 text-white shadow-strong group-hover:shadow-[0_32px_64px_-12px_rgba(59,130,246,0.5)] transition-all duration-300 transform group-hover:-translate-y-2">
                <div className="absolute top-6 right-6">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
                <div className="mb-6">
                  <Sparkles className="w-8 h-8 text-white/80" />
                </div>
                <blockquote className="text-lg leading-relaxed mb-6 italic">
                  "A IA me ajudou a encontrar exatamente o versículo que precisava em um momento de profunda ansiedade. É incrível como a tecnologia pode servir ao Reino de Deus!"
                </blockquote>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold">AC</span>
                  </div>
                  <div>
                    <p className="font-semibold">Ana Carolina</p>
                    <p className="text-blue-100 text-sm">Psicóloga, São Paulo</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="group">
              <div className="relative bg-gradient-to-br from-divine-gold via-yellow-600 to-orange-500 rounded-2xl p-8 text-white shadow-strong group-hover:shadow-[0_32px_64px_-12px_rgba(251,191,36,0.5)] transition-all duration-300 transform group-hover:-translate-y-2">
                <div className="absolute top-6 right-6">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-white text-white" />
                    ))}
                  </div>
                </div>
                <div className="mb-6">
                  <Heart className="w-8 h-8 text-white/80" />
                </div>
                <blockquote className="text-lg leading-relaxed mb-6 italic">
                  "Encontrei uma comunidade verdadeira aqui. É maravilhoso poder compartilhar minha fé e receber apoio espiritual de irmãos que realmente se importam."
                </blockquote>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold">JS</span>
                  </div>
                  <div>
                    <p className="font-semibold">João Santos</p>
                    <p className="text-orange-100 text-sm">Pastor, Rio de Janeiro</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="relative overflow-hidden bg-gradient-to-br from-spiritual-blue via-blue-600 to-purple-700 rounded-3xl p-12 text-white shadow-strong">
          {/* Background decoration */}
          <div className="absolute inset-0">
            <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full"></div>
            <div className="absolute bottom-10 left-10 w-24 h-24 bg-white/5 rounded-full"></div>
            <div className="absolute top-20 left-20 w-16 h-16 bg-divine-gold/20 rounded-full"></div>
          </div>
          
          <div className="relative z-10 text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-6 py-2 rounded-full text-sm font-semibold mb-6">
              <Sparkles className="w-4 h-4" />
              <span>Junte-se à Revolução Espiritual</span>
              <Sparkles className="w-4 h-4" />
            </div>
            
            <h2 className="text-5xl font-black mb-6 leading-tight">
              Sua Jornada Espiritual 
              <br />
              <span className="text-divine-gold">Começa Agora</span>
            </h2>
            
            <p className="text-xl mb-8 text-blue-100 leading-relaxed max-w-2xl mx-auto">
              Junte-se a mais de <span className="font-bold text-white">10.000 cristãos</span> que já descobriram o poder da comunidade e da IA bíblica para transformar suas vidas espirituais.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Button 
                className="bg-white text-spiritual-blue hover:bg-gray-100 font-bold px-10 py-4 text-lg rounded-xl shadow-medium hover:shadow-strong transition-all duration-300 group"
                onClick={handleRegister}
              >
                <span className="mr-2">Começar Gratuitamente</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                variant="ghost"
                className="text-white hover:bg-white/20 font-medium px-8 py-4 text-lg rounded-xl backdrop-blur-sm border border-white/30"
                onClick={handleLogin}
              >
                Já tenho conta
              </Button>
            </div>
            
            <div className="flex items-center justify-center gap-6 text-sm text-blue-100">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>Sem taxas ocultas</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span>Acesso imediato</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4" />
                <span>Comunidade acolhedora</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultTab={authTab}
      />
    </div>
  );
}
