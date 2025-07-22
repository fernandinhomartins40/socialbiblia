import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Users, MessageCircle, BookOpen } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-spiritual-blue rounded-full flex items-center justify-center">
              <Heart className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-deep-blue-gray mb-4">
            BibliaConnect
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Uma rede social cristã que conecta pessoas através da palavra de Deus, 
            oferecendo suporte espiritual através de inteligência artificial.
          </p>
          <div className="space-x-4">
            <Button 
              className="bg-spiritual-blue hover:bg-blue-600 text-white px-8 py-3 text-lg"
              onClick={handleLogin}
            >
              Entrar
            </Button>
            <Button 
              variant="outline"
              className="border-spiritual-blue text-spiritual-blue hover:bg-spiritual-blue hover:text-white px-8 py-3 text-lg"
              onClick={handleRegister}
            >
              Criar Conta
            </Button>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-spiritual-blue rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">IA Bíblica</h3>
              <p className="text-gray-600">
                Nossa IA correlaciona seus sentimentos com passagens bíblicas relevantes, 
                oferecendo conforto e orientação espiritual.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-divine-gold rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Comunidade</h3>
              <p className="text-gray-600">
                Conecte-se com irmãos em fé, compartilhe experiências e 
                participe de comunidades temáticas.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-hope-green rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Crescimento</h3>
              <p className="text-gray-600">
                Acompanhe seu progresso espiritual, participe de estudos bíblicos 
                e cresça em sua jornada de fé.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Testimonials */}
        <div className="bg-white rounded-2xl p-8 mb-16">
          <h2 className="text-3xl font-bold text-center text-deep-blue-gray mb-8">
            O que nossa comunidade diz
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="text-center">
              <div className="bg-gradient-to-r from-spiritual-blue to-blue-600 rounded-lg p-6 text-white mb-4">
                <p className="italic">
                  "A IA me ajudou a encontrar exatamente o versículo que precisava 
                  em um momento de ansiedade. Incrível como a tecnologia pode servir ao Reino!"
                </p>
              </div>
              <p className="font-semibold">Ana Carolina</p>
            </div>
            <div className="text-center">
              <div className="bg-gradient-to-r from-divine-gold to-yellow-600 rounded-lg p-6 text-white mb-4">
                <p className="italic">
                  "Encontrei uma comunidade verdadeira aqui. É maravilhoso poder 
                  compartilhar minha fé e receber apoio espiritual."
                </p>
              </div>
              <p className="font-semibold">João Santos</p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center bg-gradient-to-r from-spiritual-blue to-blue-600 rounded-2xl p-8 text-white">
          <h2 className="text-3xl font-bold mb-4">
            Comece sua jornada espiritual hoje
          </h2>
          <p className="text-xl mb-6">
            Junte-se a milhares de cristãos que já encontraram apoio e comunidade aqui.
          </p>
          <Button 
            className="bg-white text-spiritual-blue hover:bg-gray-100 px-8 py-3 text-lg"
            onClick={handleRegister}
          >
            Criar Conta Gratuita
          </Button>
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
