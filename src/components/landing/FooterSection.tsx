import { Heart } from 'lucide-react';

export const FooterSection = () => (
  <footer className="py-12 border-t bg-muted/30">
    <div className="container mx-auto px-4">
      <div className="max-w-4xl mx-auto">
        {/* Logo e descrição */}
        <div className="text-center mb-8">
          <img 
            src="/logo-full.png" 
            alt="Consciência Divinal" 
            className="h-12 mx-auto mb-4"
            loading="lazy"
          />
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Plataforma completa para gestão de casas xamânicas e cerimônias com medicinas sagradas.
          </p>
        </div>

        {/* Links simplificados */}
        <div className="flex flex-wrap justify-center gap-6 mb-8 text-sm">
          <a href="#recursos" className="text-muted-foreground hover:text-foreground transition-colors">
            Recursos
          </a>
          <a href="#precos" className="text-muted-foreground hover:text-foreground transition-colors">
            Preços
          </a>
          <a href="/termos" className="text-muted-foreground hover:text-foreground transition-colors">
            Termos de Uso
          </a>
          <a href="/privacidade" className="text-muted-foreground hover:text-foreground transition-colors">
            Privacidade
          </a>
        </div>

        {/* Copyright */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Heart className="h-4 w-4 text-red-500 fill-red-500" />
            <span>Feito com amor para a comunidade xamânica</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Consciência Divinal. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  </footer>
);
