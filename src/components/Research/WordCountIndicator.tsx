"use client";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useTaskStore } from "@/store/task";

interface WordCountIndicatorProps {
  content?: string;
  text?: string;
  className?: string;
  articleType?: "news" | "feature" | "investigative" | "explainer";
}

export default function WordCountIndicator({
  content,
  text,
  className,
  articleType = "news", // Default to news if not provided
}: WordCountIndicatorProps) {
  const [wordCount, setWordCount] = useState(0);
  const [status, setStatus] = useState<"under" | "within" | "over">("under");
  const [percentageComplete, setPercentageComplete] = useState(0);
  
  // Word count limits for each article type
  const articleTypeLimits = {
    news: { min: 500, max: 800, ideal: 650 },
    feature: { min: 800, max: 1500, ideal: 1200 },
    investigative: { min: 1500, max: 2500, ideal: 2000 },
    explainer: { min: 800, max: 1200, ideal: 1000 },
  };

  useEffect(() => {
    // Simple word count (split by spaces, filter out empty strings)
    const contentToCount = content || text; // Use content if provided, otherwise use text
    
    if (!contentToCount) {
      setWordCount(0);
      setStatus("under");
      setPercentageComplete(0);
      return;
    }

    // Better markdown stripping for more accurate word count
    const strippedContent = contentToCount
      .replace(/```[\s\S]*?```/g, "") // Remove code blocks
      .replace(/`.*?`/g, "") // Remove inline code
      .replace(/\[.*?\]\(.*?\)/g, (match) => match.split("](")[0].substring(1)) // Keep link text, remove URLs
      .replace(/^#+\s+/gm, "") // Remove heading markers at start of line
      .replace(/^[*-]\s+/gm, "") // Remove list item markers at start of line
      .replace(/!\[.*?\]\(.*?\)/g, "") // Remove images
      .replace(/\*\*|\*/g, "") // Remove bold/italic markers
      .replace(/~~.*?~~/g, (match) => match.slice(2, -2)) // Remove strikethrough but keep text
      .replace(/>\s.*?\n/g, ""); // Remove blockquotes

    // More accurate word counting that ignores markdown symbols
    const words = strippedContent
      .split(/\s+/)
      .filter(word => word.length > 0 && !/^[*#>-]+$/.test(word));

    const count = words.length;
    setWordCount(count);

    // Find the limits based on article type with fallback
    const type = articleType || "news";
    const limits = articleTypeLimits[type];

    // Determine status
    if (count < limits.min) {
      setStatus("under");
      setPercentageComplete((count / limits.min) * 100);
    } else if (count > limits.max) {
      setStatus("over");
      setPercentageComplete(100);
    } else {
      setStatus("within");
      setPercentageComplete(
        ((count - limits.min) / (limits.max - limits.min)) * 100 + 100
      );
    }
  }, [content, text, articleType]);

  const limits = articleTypeLimits[articleType || "news"];
  const { min, max } = limits;

  return (
    <div className={cn("flex flex-col space-y-1", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Word Count: {wordCount}</span>
        <Badge className={
          status === "within" 
            ? "bg-green-100 text-green-800 border-green-300" 
            : status === "over" 
              ? "bg-orange-100 text-orange-800 border-orange-300"
              : ""
        }>
          {status === "under"
            ? "Under Minimum"
            : status === "within"
              ? "Good Length"
              : "Over Maximum"}
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        <Progress 
          value={percentageComplete} 
          max={200}
          className={
            status === "within" 
              ? "bg-green-200 dark:bg-green-950" 
              : status === "over" 
                ? "bg-orange-200 dark:bg-orange-950"
                : "bg-yellow-200 dark:bg-yellow-950"
          }
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{min} words</span>
        <span>{max} words</span>
      </div>
    </div>
  );
} 