import { useState, useEffect } from "react";
import { useSettingStore } from "@/store/setting";
import rateLimiter from "@/utils/rate-limiter";
import { Info, AlertCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function RateLimitStatus() {
  const { thinkingModel } = useSettingStore();
  const [cooldownTime, setCooldownTime] = useState<number>(0);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // Update the cooldown time every second
  useEffect(() => {
    const updateCooldownTime = () => {
      if (thinkingModel) {
        const remaining = rateLimiter.getCooldownTimeRemaining(thinkingModel);
        setCooldownTime(remaining);
      }
    };

    updateCooldownTime();
    const interval = setInterval(() => {
      updateCooldownTime();
      // Force a refresh every minute to update rate limit tracking data
      if (Date.now() % 60000 < 1000) {
        setRefreshKey(prev => prev + 1);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [thinkingModel, refreshKey]);

  // If no cooldown is active, don't show anything
  if (cooldownTime <= 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 px-3 py-2 rounded-md animate-pulse">
      <AlertCircle className="h-4 w-4" />
      <span className="text-sm font-medium">
        Rate limit cooldown: {Math.ceil(cooldownTime)} seconds
      </span>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-4 w-4 cursor-help" />
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs">
              The AI model is currently cooling down due to rate limits.
              Your request will be processed automatically when the cooldown ends.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
} 