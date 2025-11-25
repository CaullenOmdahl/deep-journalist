"use client";

import { useState, useEffect } from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/Button";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  text: string;
  label?: string;
  successMessage?: string;
  variant?: "default" | "outline" | "ghost" | "link" | "destructive" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showIcon?: boolean;
  iconOnly?: boolean;
}

export function CopyButton({
  text,
  label = "Copy",
  successMessage,
  variant = "outline",
  size = "sm",
  className,
  showIcon = true,
  iconOnly = false,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => {
        setCopied(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [copied]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);

      // Show toast notification
      const message = successMessage || `${label} copied to clipboard`;
      toast.success(message);
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error("Failed to copy to clipboard");
    }
  };

  return (
    <Button
      variant={variant}
      size={iconOnly ? "icon" : size}
      onClick={handleCopy}
      className={cn("gap-2", className)}
    >
      {showIcon && (
        copied ? (
          <Check className="h-4 w-4" />
        ) : (
          <Copy className="h-4 w-4" />
        )
      )}
      {!iconOnly && (copied ? "Copied!" : label)}
    </Button>
  );
}
