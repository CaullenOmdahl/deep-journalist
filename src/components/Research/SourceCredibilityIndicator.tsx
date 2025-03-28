"use client";
import { AlertTriangle, CheckCircle, HelpCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SourceCredibilityIndicatorProps {
  score?: number;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export default function SourceCredibilityIndicator({
  score,
  size = "md",
  showText = false,
  className,
}: SourceCredibilityIndicatorProps) {
  if (score === undefined) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn("flex items-center", className)}>
              <HelpCircle className={cn(
                "text-muted-foreground",
                size === "sm" ? "h-4 w-4" : size === "lg" ? "h-6 w-6" : "h-5 w-5"
              )} />
              {showText && <span className="ml-1 text-muted-foreground text-sm">Unknown</span>}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Credibility not assessed</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  let icon;
  let color;
  let credibilityText;
  
  if (score >= 8) {
    icon = <CheckCircle className={cn(
      "text-green-500",
      size === "sm" ? "h-4 w-4" : size === "lg" ? "h-6 w-6" : "h-5 w-5"
    )} />;
    color = "text-green-500";
    credibilityText = "High credibility";
  } else if (score >= 5) {
    icon = <CheckCircle className={cn(
      "text-yellow-500",
      size === "sm" ? "h-4 w-4" : size === "lg" ? "h-6 w-6" : "h-5 w-5"
    )} />;
    color = "text-yellow-500";
    credibilityText = "Medium credibility";
  } else if (score >= 1) {
    icon = <AlertTriangle className={cn(
      "text-orange-500",
      size === "sm" ? "h-4 w-4" : size === "lg" ? "h-6 w-6" : "h-5 w-5"
    )} />;
    color = "text-orange-500";
    credibilityText = "Low credibility";
  } else {
    icon = <XCircle className={cn(
      "text-red-500",
      size === "sm" ? "h-4 w-4" : size === "lg" ? "h-6 w-6" : "h-5 w-5"
    )} />;
    color = "text-red-500";
    credibilityText = "Not credible";
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("flex items-center", className)}>
            {icon}
            {showText && (
              <span className={cn("ml-1 text-sm", color)}>
                {score}/10
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{credibilityText} ({score}/10)</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
} 