import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';

export const FooterSection = memo(() => (
  <footer className="bg-card border-t py-10">
    <div className="container mx-auto px-4">
      <div className="grid md:grid-cols-3 gap-8 mb-8">
        <div>
          <img 
            src="/logo-full.png" 
            alt="Consciência Divinal" 
            className="h-10 w-auto mb-4"
            loading="lazy"
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
            <li>Relatórios Financeiros</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-4">Legal</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/termos" className="hover:text-foreground transition-colors">Termos de Uso</Link></li>
            <li><Link to="/privacidade" className="hover:text-foreground transition-colors">Privacidade</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Heart className="h-4 w-4 text-red-500" />
          Feito com amor para a comunidade xamânica
        </p>
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Consciência Divinal
        </p>
      </div>
    </div>
  </footer>
));

FooterSection.displayName = 'FooterSection';
