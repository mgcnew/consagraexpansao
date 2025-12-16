import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface MaterialSkeletonProps {
  featured?: boolean;
}

/**
 * Skeleton otimizado para cards de material
 * Usa CSS animations ao invés de JS para melhor performance
 */
const MaterialSkeleton: React.FC<MaterialSkeletonProps> = ({ featured }) => {
  return (
    <Card className={featured ? 'md:col-span-1' : ''}>
      {/* Imagem placeholder */}
      <Skeleton className="h-48 w-full rounded-t-lg rounded-b-none" />
      
      <CardContent className="p-4 space-y-3">
        {/* Título */}
        <Skeleton className="h-5 w-3/4" />
        
        {/* Resumo - 3 linhas */}
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-12" />
          </div>
          <Skeleton className="h-4 w-4" />
        </div>
      </CardContent>
    </Card>
  );
};

export default memo(MaterialSkeleton);
