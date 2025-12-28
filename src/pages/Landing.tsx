import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Search, MapPin, Star, Users, Shield, Heart, LogOut, LayoutDashboard } from 'lucide-react';
import { ROUTES } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';

const Landing = () => {
  const { user, isAdmin, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img 
            src="/logo-topbar.png" 
            alt="Ahoo" 
            className="h-10 w-auto"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <span className="text-2xl font-bold text-primary">Ahoo</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to={ROUTES.BUSCAR_CASAS}>
            <Button variant="ghost">Encontrar Casas</Button>
          </Link>
          {user ? (
            <div className="flex items-center gap-2">
              {isAdmin && (
                <Link to="/portal">
                  <Button variant="outline" size="sm">
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Portal Admin
                  </Button>
                </Link>
              )}
              <Link to="/app">
                <Button variant="outline" size="sm">Minha Área</Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={() => signOut()}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Link to={ROUTES.AUTH}>
              <Button>Entrar</Button>
            </Link>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          Encontre sua{' '}
          <span className="text-primary">Casa de Consagração</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Conectamos você às melhores casas xamânicas do Brasil. 
          Descubra, inscreva-se e viva experiências transformadoras.
        </p>
        
        {/* Search Box */}
        <div className="max-w-xl mx-auto mb-12">
          <Link to={ROUTES.BUSCAR_CASAS}>
            <div className="flex items-center gap-2 p-4 bg-card rounded-lg border shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
              <Search className="h-5 w-5 text-muted-foreground" />
              <span className="text-muted-foreground">Buscar casas por cidade ou estado...</span>
              <Button className="ml-auto">Buscar</Button>
            </div>
          </Link>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-primary">50+</div>
            <div className="text-muted-foreground">Casas Parceiras</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary">1000+</div>
            <div className="text-muted-foreground">Consagradores</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary">500+</div>
            <div className="text-muted-foreground">Cerimônias Realizadas</div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          Por que usar o Ahoo?
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Encontre Casas Próximas</h3>
              <p className="text-muted-foreground">
                Descubra casas de consagração na sua região com base na sua localização.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Avaliações Reais</h3>
              <p className="text-muted-foreground">
                Veja avaliações de outros consagradores e escolha com confiança.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Pagamento Seguro</h3>
              <p className="text-muted-foreground">
                Pague com segurança via Pix ou cartão. Sua transação protegida.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How it Works */}
      <section className="bg-muted py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Como Funciona
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '1', title: 'Cadastre-se', desc: 'Crie sua conta gratuita em segundos' },
              { step: '2', title: 'Encontre', desc: 'Busque casas próximas a você' },
              { step: '3', title: 'Escolha', desc: 'Veja cerimônias disponíveis' },
              { step: '4', title: 'Participe', desc: 'Inscreva-se e viva a experiência' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  {item.step}
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA for Houses */}
      <section className="container mx-auto px-4 py-20 text-center">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="pt-6">
            <Users className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">
              Você tem uma Casa de Consagração?
            </h2>
            <p className="text-muted-foreground mb-6">
              Cadastre sua casa no Ahoo e alcance milhares de consagradores em busca de experiências transformadoras.
            </p>
            <Link to={ROUTES.AUTH}>
              <Button size="lg">Cadastrar Minha Casa</Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              <span className="text-muted-foreground">
                Feito com amor para a comunidade xamânica
              </span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link to="/termos" className="hover:text-foreground">Termos de Uso</Link>
              <Link to="/privacidade" className="hover:text-foreground">Privacidade</Link>
              <Link to="/contato" className="hover:text-foreground">Contato</Link>
            </div>
          </div>
          <div className="text-center text-sm text-muted-foreground mt-8">
            © {new Date().getFullYear()} Ahoo. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
