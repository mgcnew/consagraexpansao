import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SectionErrorProps {
  message?: string;
  onRetry?: () => void;
}

/**
 * Generic error component for dashboard sections
 * Requirements: 5.4 - Isolated error handling per section
 */
export function SectionError({ 
  message = "Erro ao carregar dados", 
  onRetry 
}: SectionErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
      <AlertCircle className="h-12 w-12 mb-2" />
      <p className="text-center mb-4">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Tentar novamente
        </Button>
      )}
    </div>
  );
}

export default SectionError;
