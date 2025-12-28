import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Leaf, 
  Users, 
  Calendar, 
  ShoppingBag, 
  BookOpen, 
  Shield,
  Heart,
  Sparkles,
  Check,
  ArrowRight,
  LogOut,
  LayoutDashboard,
  MessageSquareQuote,
  Image,
  CreditCard,
  BarChart3,
  Bell
} from 'lucide-react';
import { ROUTES } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import { ModeToggle } from '@/components/mode-toggle';

const Landing = () => {
  const { user, isAdmin, signOut } = useAuth();

  // Buscar planos ativos
  const { data: plans } = useQuery({
    queryKey: ['public-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('house_plans')
        .select('*')
        .eq('active', true)
        .order('price_monthly', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const formatPrice = (cents: number) => {
    return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const features = [
    {
      icon: Calendar,
      title: 'Gestão de Cerimônias',
      description: 'Agende cerimônias, controle vagas, lista de espera e receba inscrições online com pagamento integrado.'
    },
    {
      icon: Users,
      title: 'Fichas de Anamnese',
      description: 'Colete informações importantes dos consagradores de forma digital e segura antes das cerimônias.'
    },
    {
      icon: ShoppingBag,
      title: 'Loja Virtual',
      description: 'Venda rapés, medicinas, artesanatos e produtos sagrados com checkout integrado.'
    },
    {
      icon: BookOpen,
      title: 'Cursos e Eventos',
      description: 'Ofereça formações, workshops e retiros com inscrições e pagamentos automatizados.'
    },
    {
      icon: MessageSquareQuote,
      title: 'Partilhas e Depoimentos',
      description: 'Espaço para consagradores compartilharem suas experiências e integrações.'
    },
    {
      icon: Image,
      title: 'Galeria de Fotos',
      description: 'Compartilhe momentos especiais das cerimônias com sua comunidade.'
    },
    {
      icon: CreditCard,
      title: 'Pagamentos Integrados',
      description: 'Receba via Pix e cartão de crédito. Dinheiro direto na sua conta.'
    },
    {
      icon: Bell,
      title: 'Notificações',
      description: 'Mantenha sua comunidade informada com notificações push e lembretes.'
    },
    {
      icon: BarChart3,
      title: 'Relatórios Financeiros',
      description: 'Acompanhe receitas, despesas e tenha controle total do seu fluxo de caixa.'
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/logo-full.png" 
              alt="Consciência Divinal" 
              className="h-10 w-auto"
              onError={(e) => {
                e.currentTarget.src = '/logo-topbar.png';
              }}
            />
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#recursos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Recursos
            </a>
            <a href="#precos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Preços
            </a>
            <a href="#contato" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Contato
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <ModeToggle />
            {user ? (
              <>
                {isAdmin && (
                  <Link to="/portal">
                    <Button variant="ghost" size="sm">
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      Portal
                    </Button>
                  </Link>
                )}
                <Link to="/app">
                  <Button size="sm">Acessar Sistema</Button>
                </Link>
                <Button variant="ghost" size="icon" onClick={() => signOut()}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Link to={ROUTES.AUTH}>
                <Button>Entrar</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        {/* Background decorativo */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="outline" className="mb-6 px-4 py-2 text-sm border-primary/30">
              <Sparkles className="h-4 w-4 mr-2 text-amber-500" />
              Sistema completo para casas de consagração
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Gerencie sua{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-amber-500">
                Casa Xamânica
              </span>
              {' '}com sabedoria
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Plataforma completa para gestão de cerimônias, consagradores, loja virtual e muito mais. 
              Foque no que importa: a cura e expansão da consciência.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={ROUTES.AUTH}>
                <Button size="lg" className="gap-2 px-8">
                  Começar Gratuitamente
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#recursos">
                <Button size="lg" variant="outline" className="px-8">
                  Conhecer Recursos
                </Button>
              </a>
            </div>

            {/* Social proof */}
            <div className="mt-16 flex flex-wrap justify-center gap-8 text-center">
              <div className="px-6">
                <div className="text-3xl font-bold text-primary">100+</div>
                <div className="text-sm text-muted-foreground">Casas Ativas</div>
              </div>
              <div className="px-6 border-l border-border">
                <div className="text-3xl font-bold text-primary">5.000+</div>
                <div className="text-sm text-muted-foreground">Consagradores</div>
              </div>
              <div className="px-6 border-l border-border">
                <div className="text-3xl font-bold text-primary">10.000+</div>
                <div className="text-sm text-muted-foreground">Cerimônias</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="recursos" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              <Leaf className="h-4 w-4 mr-2 text-green-500" />
              Recursos
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Tudo que sua casa precisa
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Ferramentas pensadas especialmente para o trabalho sagrado com medicinas ancestrais.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="precos" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              <Heart className="h-4 w-4 mr-2 text-red-500" />
              Preços Acessíveis
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Invista no crescimento da sua casa
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Planos flexíveis que cabem no seu orçamento. Comece gratuitamente e evolua conforme sua necessidade.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans && plans.length > 0 ? (
              plans.map((plan, index) => (
                <Card 
                  key={plan.id} 
                  className={`relative overflow-hidden ${
                    index === 1 
                      ? 'border-primary shadow-xl shadow-primary/10 scale-105' 
                      : 'border-border/50'
                  }`}
                >
                  {index === 1 && (
                    <div className="absolute top-0 left-0 right-0 bg-primary text-primary-foreground text-center text-xs py-1 font-medium">
                      Mais Popular
                    </div>
                  )}
                  <CardHeader className={`text-center ${index === 1 ? 'pt-8' : ''}`}>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">{formatPrice(plan.price_monthly)}</span>
                      <span className="text-muted-foreground">/mês</span>
                    </div>
                    {plan.description && (
                      <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 shrink-0" />
                        <span>Gestão completa de cerimônias</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 shrink-0" />
                        <span>Loja virtual integrada</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 shrink-0" />
                        <span>Fichas de anamnese digitais</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 shrink-0" />
                        <span>Pagamentos via Pix e cartão</span>
                      </div>
                      {plan.features?.map((feature, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500 shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 border-t border-border/50 space-y-1 text-xs text-muted-foreground">
                      <p>Taxa sobre cerimônias: {plan.commission_cerimonias}%</p>
                      <p>Taxa sobre vendas: {plan.commission_loja}%</p>
                    </div>

                    <Link to={ROUTES.AUTH} className="block pt-2">
                      <Button 
                        className="w-full" 
                        variant={index === 1 ? 'default' : 'outline'}
                      >
                        Começar Agora
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="col-span-full max-w-md mx-auto border-primary shadow-xl shadow-primary/10">
                <CardHeader className="text-center">
                  <Badge className="w-fit mx-auto mb-2">Lançamento</Badge>
                  <CardTitle className="text-xl">Plano Essencial</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">R$ 49,90</span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Tudo que você precisa para começar
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Gestão completa de cerimônias</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Loja virtual integrada</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Fichas de anamnese digitais</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Cursos e eventos</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Pagamentos via Pix e cartão</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Suporte por WhatsApp</span>
                    </div>
                  </div>
                  <Link to={ROUTES.AUTH} className="block pt-4">
                    <Button className="w-full">Começar Agora</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4">
          <Card className="max-w-3xl mx-auto border-primary/20 bg-card/80 backdrop-blur-sm">
            <CardContent className="py-12 text-center">
              <Leaf className="h-16 w-16 text-primary mx-auto mb-6" />
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Pronto para transformar sua casa?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Junte-se a centenas de casas que já utilizam nossa plataforma para 
                organizar cerimônias e expandir seu trabalho sagrado.
              </p>
              <Link to={ROUTES.AUTH}>
                <Button size="lg" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Criar Minha Conta Grátis
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer id="contato" className="bg-card border-t py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <img 
                src="/logo-full.png" 
                alt="Consciência Divinal" 
                className="h-12 w-auto mb-4"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <p className="text-sm text-muted-foreground">
                Plataforma completa para gestão de casas xamânicas e cerimônias com medicinas sagradas.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Recursos</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Gestão de Cerimônias</li>
                <li>Loja Virtual</li>
                <li>Cursos e Eventos</li>
                <li>Relatórios</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Central de Ajuda</li>
                <li>WhatsApp</li>
                <li>Email</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/termos" className="hover:text-foreground">Termos de Uso</Link></li>
                <li><Link to="/privacidade" className="hover:text-foreground">Privacidade</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Heart className="h-4 w-4 text-red-500" />
              Feito com amor para a comunidade xamânica
            </p>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Consciência Divinal. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
