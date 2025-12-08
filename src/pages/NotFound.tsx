import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, AlertTriangle, ArrowLeft } from "lucide-react";
import { ROUTES } from "@/constants";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen py-4 md:py-6 px-2 md:px-4 flex items-center justify-center">
      <div className="container max-w-lg mx-auto">
        <Card className="border-primary/20 animate-fade-in">
          <CardContent className="pt-8 pb-8 px-6 text-center">
            {/* Icon */}
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 md:w-12 md:h-12 text-primary" />
            </div>

            {/* Title */}
            <h1 className="font-display text-6xl md:text-7xl font-medium text-primary mb-4">
              404
            </h1>

            {/* Message */}
            <h2 className="font-display text-xl md:text-2xl font-medium text-foreground mb-2">
              Página não encontrada
            </h2>
            <p className="text-muted-foreground font-body mb-8 max-w-sm mx-auto">
              A página que você está procurando não existe ou foi movida para outro endereço.
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => navigate(-1)}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
              <Button
                onClick={() => navigate(ROUTES.HOME)}
                className="gap-2"
              >
                <Home className="w-4 h-4" />
                Ir para o Início
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quote */}
        <p className="text-center text-sm text-muted-foreground mt-6 font-body animate-fade-in" style={{ animationDelay: '200ms' }}>
          Todos os caminhos levam ao centro. Encontre o seu.
        </p>
      </div>
    </div>
  );
};

export default NotFound;
