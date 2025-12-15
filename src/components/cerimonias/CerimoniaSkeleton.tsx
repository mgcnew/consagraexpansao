import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface CerimoniaSkeletonProps {
  count?: number;
}

const CerimoniaSkeletonCard: React.FC = () => (
  <Card className="border-border/50 bg-card overflow-hidden flex flex-col">
    {/* Imagem */}
    <Skeleton className="h-44 w-full rounded-none" />

    <CardHeader className="pb-2 pt-4 space-y-2">
      <Skeleton className="h-5 w-20" />
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-4 w-24" />
    </CardHeader>

    <CardContent className="space-y-4 flex-grow">
      <div className="flex items-start gap-3">
        <Skeleton className="w-5 h-5 rounded-full shrink-0" />
        <Skeleton className="h-4 w-full" />
      </div>
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-10 w-full rounded-lg" />
    </CardContent>

    <CardFooter className="pt-4 border-t border-border/50 bg-muted/30">
      <Skeleton className="h-10 w-full" />
    </CardFooter>
  </Card>
);

const CerimoniaSkeleton: React.FC<CerimoniaSkeletonProps> = ({ count = 6 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <CerimoniaSkeletonCard key={i} />
    ))}
  </div>
);

export default CerimoniaSkeleton;
