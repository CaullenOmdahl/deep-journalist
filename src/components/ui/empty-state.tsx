import * as React from "react";
import { cn } from "@/utils/style";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  variant?: "default" | "compact" | "card";
}

/**
 * EmptyState component for showing helpful messages when content is empty
 *
 * @example
 * <EmptyState
 *   icon={FileSearch}
 *   title="No sources found"
 *   description="Start research to discover sources."
 *   action={{ label: "Start Research", onClick: handleStart }}
 * />
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  variant = "default",
}: EmptyStateProps) {
  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-3 py-4 px-3 text-muted-foreground", className)}>
        {Icon && <Icon className="h-5 w-5 shrink-0" />}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{title}</p>
          {description && (
            <p className="text-xs mt-0.5 truncate">{description}</p>
          )}
        </div>
        {action && (
          <Button variant="outline" size="sm" onClick={action.onClick}>
            {action.label}
          </Button>
        )}
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center p-6 border rounded-lg bg-muted/30",
        className
      )}>
        {Icon && (
          <div className="rounded-full bg-muted p-3 mb-3">
            <Icon className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
        <h3 className="text-sm font-medium text-center">{title}</h3>
        {description && (
          <p className="text-xs text-muted-foreground text-center mt-1 max-w-xs">
            {description}
          </p>
        )}
        {action && (
          <Button variant="outline" size="sm" className="mt-4" onClick={action.onClick}>
            {action.label}
          </Button>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-8 px-4 text-center",
      className
    )}>
      {Icon && (
        <div className="rounded-full bg-muted p-4 mb-4">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
      )}
      <h3 className="text-base font-medium">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mt-2 max-w-md">
          {description}
        </p>
      )}
      {action && (
        <Button variant="outline" className="mt-4" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

export default EmptyState;
