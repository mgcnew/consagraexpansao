import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

/**
 * Skeleton animado para área do carrossel de fotos
 * Requirements: 5.3
 */
export function PhotoCarouselSkeleton() {
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <Skeleton className="h-6 w-40" />
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main carousel image skeleton */}
        <div className="relative aspect-video w-full overflow-hidden rounded-lg">
          <Skeleton className="h-full w-full" />
        </div>
        
        {/* Navigation dots skeleton */}
        <div className="flex justify-center gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-2 w-2 rounded-full" />
          ))}
        </div>
        
        {/* Thumbnail strip skeleton */}
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-24 flex-shrink-0 rounded-md" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
