import { Calendar, MapPin, Users, AlertCircle, CalendarDays } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CeremonySkeleton } from "./skeletons/CeremonySkeleton";
import { ROUTES } from "@/constants/routes";
import { formatDateExtensoBR } from "@/lib/date-utils";
import type { CerimoniasComVagas } from "@/hooks/queries/useUpcomingCeremonies";

interface UpcomingCeremoniesSectionProps {
  ceremonies: CerimoniasComVagas[];
  isLoading: boolean;
  error: Error | null;
  hasAnamnese: boolean;
}

/**
 * Seção de próximas cerimônias disponíveis
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */
export function UpcomingCeremoniesSection({
  ceremonies,
  isLoading,
  error,
  hasAnamnese,
}: UpcomingCeremoniesSectionProps) {
  const navigate = useNavigate();

  // Loading state (Req 5.3)
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarDays className="h-5 w-5" />
            Próximas Cerimônias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CeremonySkeleton count={3} />
        </CardContent>
      </Card>
    );
  }

  // Error state (Req 5.4)
  if (error) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarDays className="h-5 w-5" />
            Próximas Cerimônias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mb-2" />
            <p>Erro ao carregar cerimônias</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state (Req 2.4)
  if (!ceremonies || ceremonies.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarDays className="h-5 w-5" />
            Próximas Cerimônias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mb-2" />
            <p className="text-center">
              Não há cerimônias disponíveis no momento.
              <br />
              <span className="text-sm">Novas datas serão anunciadas em breve!</span>
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarDays className="h-5 w-5" />
          Próximas Cerimônias
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Anamnese warning (Req 2.5) */}
        {!hasAnamnese && (
          <Alert className="mb-4 border-amber-500/50 bg-amber-500/10">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
            <AlertDescription className="text-sm">
              Você precisa preencher sua{" "}
              <button
                onClick={() => navigate(ROUTES.ANAMNESE)}
                className="font-medium underline underline-offset-2 hover:text-amber-700 dark:hover:text-amber-400"
              >
                ficha de anamnese
              </button>{" "}
              antes de se inscrever nas cerimônias.
            </AlertDescription>
          </Alert>
        )}

        {/* Ceremony cards (Req 2.2) */}
        <div className="space-y-3">
          {ceremonies.map((ceremony) => (
            <Card
              key={ceremony.id}
              className="overflow-hidden cursor-pointer transition-colors hover:bg-accent/50"
              onClick={() => navigate(`${ROUTES.CERIMONIAS}#${ceremony.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex flex-col gap-3 min-w-0 w-full">
                  {/* Title (Req 2.2) */}
                  <h3 className="font-semibold text-base leading-tight truncate">
                    {ceremony.nome || "Cerimônia"}
                  </h3>

                  {/* Date and location (Req 2.2) */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2 shrink-0">
                      <Calendar className="h-4 w-4 shrink-0" />
                      <span>
                        {formatDateExtensoBR(ceremony.data)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 min-w-0">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span className="truncate">{ceremony.local}</span>
                    </div>
                  </div>

                  {/* Vagas disponíveis and action button (Req 2.2) */}
                  <div className="flex items-center justify-between">
                    <Badge
                      variant={ceremony.vagas_disponiveis > 0 ? "default" : "secondary"}
                      className="flex items-center gap-1"
                    >
                      <Users className="h-3 w-3" />
                      {ceremony.vagas_disponiveis > 0
                        ? `${ceremony.vagas_disponiveis} ${
                            ceremony.vagas_disponiveis === 1 ? "vaga" : "vagas"
                          }`
                        : "Esgotado"}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`${ROUTES.CERIMONIAS}#${ceremony.id}`);
                      }}
                    >
                      Ver detalhes
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
