import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

/**
 * Skeleton para cards de cerimônias/cursos
 */
export const CeremonyCardSkeleton = () => (
  <Card className="overflow-hidden animate-pulse">
    <CardHeader className="pb-2">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    </CardHeader>
    <CardContent className="space-y-3">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4 rounded" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4 rounded" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-9 w-full mt-2" />
    </CardContent>
  </Card>
);

/**
 * Skeleton para lista de transações
 */
export const TransactionSkeleton = () => (
  <div className="p-3 rounded-lg border bg-card animate-pulse">
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4 rounded" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-5 w-20" />
    </div>
    <Skeleton className="h-4 w-3/4 mb-2" />
    <div className="flex items-center gap-2">
      <Skeleton className="h-5 w-16 rounded-full" />
      <Skeleton className="h-4 w-12" />
    </div>
  </div>
);

/**
 * Skeleton para tabela
 */
export const TableRowSkeleton = ({ columns = 5 }: { columns?: number }) => (
  <tr className="animate-pulse">
    {Array.from({ length: columns }).map((_, i) => (
      <td key={i} className="p-3">
        <Skeleton className="h-4 w-full" />
      </td>
    ))}
  </tr>
);

/**
 * Skeleton para perfil/avatar
 */
export const ProfileSkeleton = () => (
  <div className="flex items-center gap-3 animate-pulse">
    <Skeleton className="h-10 w-10 rounded-full" />
    <div className="space-y-1.5">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-3 w-16" />
    </div>
  </div>
);

/**
 * Skeleton para cards de estatísticas
 */
export const StatCardSkeleton = () => (
  <Card className="animate-pulse">
    <CardHeader className="pb-2">
      <Skeleton className="h-4 w-20" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-3 w-16 mt-2" />
    </CardContent>
  </Card>
);
