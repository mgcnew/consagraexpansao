import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  isLoading = false,
}) => {
  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className="flex items-center justify-between gap-4 mt-6 pt-4 border-t">
      <div className="text-sm text-muted-foreground">
        Página <span className="font-medium">{currentPage}</span> de{' '}
        <span className="font-medium">{totalPages}</span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevious}
          disabled={currentPage === 1 || isLoading}
          className="gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={currentPage === totalPages || isLoading}
          className="gap-1"
        >
          Próximo
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
