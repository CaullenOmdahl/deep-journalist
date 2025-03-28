"use client";
import { CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export type VerificationStatus = 'verified' | 'refuted' | 'unverified' | 'disputed' | 'inconclusive';

interface ClaimVerificationStatusProps {
  status: VerificationStatus;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  details?: string;
  className?: string;
}

export default function ClaimVerificationStatus({
  status,
  size = "md",
  showText = false,
  details,
  className,
}: ClaimVerificationStatusProps) {
  let icon;
  let color;
  let statusText;
  
  switch (status) {
    case 'verified':
      icon = <CheckCircle className={cn(
        "text-green-600",
        size === "sm" ? "h-4 w-4" : size === "lg" ? "h-6 w-6" : "h-5 w-5"
      )} />;
      color = "text-green-600";
      statusText = "Verified";
      break;
    case 'refuted':
      icon = <XCircle className={cn(
        "text-red-600",
        size === "sm" ? "h-4 w-4" : size === "lg" ? "h-6 w-6" : "h-5 w-5"
      )} />;
      color = "text-red-600";
      statusText = "Refuted";
      break;
    case 'disputed':
      icon = <AlertTriangle className={cn(
        "text-orange-500",
        size === "sm" ? "h-4 w-4" : size === "lg" ? "h-6 w-6" : "h-5 w-5"
      )} />;
      color = "text-orange-500";
      statusText = "Disputed";
      break;
    case 'inconclusive':
      icon = <Info className={cn(
        "text-blue-500",
        size === "sm" ? "h-4 w-4" : size === "lg" ? "h-6 w-6" : "h-5 w-5"
      )} />;
      color = "text-blue-500";
      statusText = "Inconclusive";
      break;
    case 'unverified':
    default:
      icon = <Info className={cn(
        "text-gray-500",
        size === "sm" ? "h-4 w-4" : size === "lg" ? "h-6 w-6" : "h-5 w-5"
      )} />;
      color = "text-gray-500";
      statusText = "Unverified";
      break;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("flex items-center gap-1", className)}>
            {icon}
            {showText && <span className={cn("text-sm font-medium", color)}>{statusText}</span>}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="max-w-xs">
            <p className={cn("font-medium", color)}>{statusText}</p>
            {details && <p className="text-sm mt-1 text-muted-foreground">{details}</p>}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
} 