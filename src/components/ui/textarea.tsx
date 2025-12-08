import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex w-full rounded-md border border-input bg-background ring-offset-background",
        // Mobile-first: larger touch targets and text
        "min-h-[100px] px-4 py-3 text-base",
        // Desktop: slightly smaller
        "md:min-h-[80px] md:px-3 md:py-2 md:text-sm",
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
});
Textarea.displayName = "Textarea";

export { Textarea };
