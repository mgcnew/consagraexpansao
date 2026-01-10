import { ImgHTMLAttributes, useState } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string;
  alt: string;
  fallback?: string;
  webpSrc?: string;
}

export function OptimizedImage({ 
  src, 
  alt, 
  fallback = '/placeholder.svg',
  webpSrc,
  className,
  ...props 
}: OptimizedImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  if (hasError) {
    return (
      <img 
        src={fallback} 
        alt={alt}
        className={cn("object-cover", className)}
        {...props}
      />
    );
  }

  return (
    <picture>
      {webpSrc && <source srcSet={webpSrc} type="image/webp" />}
      <img 
        src={src} 
        alt={alt}
        loading="lazy"
        onError={handleError}
        onLoad={handleLoad}
        className={cn(
          "object-cover transition-opacity duration-300",
          isLoading && "opacity-0",
          !isLoading && "opacity-100",
          className
        )}
        {...props}
      />
    </picture>
  );
}