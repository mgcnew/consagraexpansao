import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Base styles
          "flex w-full rounded-md border border-input bg-background ring-offset-background",
          // Mobile-first: larger touch targets (min 44px height recommended by Apple/Google)
          "h-12 px-4 py-3 text-base",
          // Desktop: slightly smaller
          "md:h-10 md:px-3 md:py-2 md:text-sm",
          // File input styles
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          // Placeholder and focus styles
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          // Disabled state
          "disabled:cursor-not-allowed disabled:opacity-50",
          // Touch-friendly: prevent zoom on iOS
          "touch-manipulation",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
