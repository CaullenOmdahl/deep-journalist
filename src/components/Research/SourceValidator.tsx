"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, Check, ExternalLink, Info, Shield, ShieldAlert, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/Button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { assessDomainReputation } from "@/utils/domain-reputation";

interface SourceValidatorProps {
  url: string;
  title?: string;
  onValidated?: (score: number) => void;
}

const sourceTypeLabels = {
  primary: "Primary Source",
  secondary: "Secondary Source",
  official: "Official Source",
  analysis: "Analysis",
  commentary: "Commentary"
};

const biasLabels = {
  'left': "Left-Leaning",
  'center-left': "Center-Left",
  'center': "Neutral/Balanced",
  'center-right': "Center-Right",
  'right': "Right-Leaning",
  'unknown': "Unknown Bias"
};

export default function SourceValidator({ url, title, onValidated }: SourceValidatorProps) {
  const { t } = useTranslation();
  const [reputation, setReputation] = useState<{
    score: number;
    type: string;
    factualReporting: string;
    bias: string;
    description: string;
  } | null>(null);

  useEffect(() => {
    if (url) {
      const result = assessDomainReputation(url);
      setReputation(result);
      
      if (onValidated && result) {
        onValidated(result.score);
      }
    }
  }, [url, onValidated]);

  if (!url) {
    return null;
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return "bg-green-500";
    if (score >= 6) return "bg-blue-500";
    if (score >= 4) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getScoreIcon = (score: number) => {
    if (score >= 8) return <ShieldCheck className="h-5 w-5 text-green-500" />;
    if (score >= 6) return <Shield className="h-5 w-5 text-blue-500" />;
    if (score >= 4) return <Shield className="h-5 w-5 text-yellow-500" />;
    return <ShieldAlert className="h-5 w-5 text-red-500" />;
  };

  const getBiasLabel = (bias: string) => {
    return biasLabels[bias as keyof typeof biasLabels] || "Unknown Bias";
  };

  const getFactualReportingBadge = (level: string) => {
    const colors: Record<string, string> = {
      'very high': 'bg-green-100 text-green-800 hover:bg-green-200',
      'high': 'bg-green-100 text-green-800 hover:bg-green-200',
      'mostly factual': 'bg-blue-100 text-blue-800 hover:bg-blue-200',
      'mixed': 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
      'low': 'bg-orange-100 text-orange-800 hover:bg-orange-200',
      'very low': 'bg-red-100 text-red-800 hover:bg-red-200',
      'unknown': 'bg-gray-100 text-gray-800 hover:bg-gray-200'
    };
    
    return (
      <Badge className={colors[level] || colors.unknown} variant="outline">
        {level.charAt(0).toUpperCase() + level.slice(1)} Factual Reporting
      </Badge>
    );
  };

  return (
    <Card className="w-full shadow-sm border-l-4" style={{ borderLeftColor: reputation ? `var(--${getScoreColor(reputation.score).replace('bg-', '')})` : 'transparent' }}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base font-medium">
            Source Validation
          </CardTitle>
          {reputation && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    {getScoreIcon(reputation.score)}
                    <span className="text-sm font-medium">{reputation.score}/10</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Credibility Score: {reputation.score}/10</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <CardDescription>
          {title || url}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        {reputation ? (
          <div className="space-y-3">
            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span>Credibility Score</span>
                <span className="font-medium">{reputation.score}/10</span>
              </div>
              <Progress value={reputation.score * 10} className="h-2" />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                {sourceTypeLabels[reputation.type as keyof typeof sourceTypeLabels] || reputation.type}
              </Badge>
              
              <Badge variant="outline">
                {getBiasLabel(reputation.bias)}
              </Badge>
              
              {getFactualReportingBadge(reputation.factualReporting)}
            </div>
            
            {reputation.description && (
              <Alert variant="outline" className="py-2">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  {reputation.description}
                </AlertDescription>
              </Alert>
            )}
          </div>
        ) : (
          <div className="flex justify-center py-4">
            <span className="text-sm text-muted-foreground">Validating source...</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-2">
        <div className="flex justify-between w-full text-xs text-muted-foreground">
          <span>
            <a 
              href={url.startsWith('http') ? url : `https://${url}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              View Source
            </a>
          </span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="xs" className="h-6 px-2">
                <Info className="h-3 w-3 mr-1" />
                How We Validate
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-2">
                <h4 className="font-medium">Source Validation Methodology</h4>
                <p className="text-sm text-muted-foreground">
                  Our validation system assesses sources based on:
                </p>
                <ul className="text-xs space-y-1 list-disc pl-4">
                  <li>Known reputation of news outlets</li>
                  <li>Factual reporting history</li>
                  <li>Political bias assessment</li>
                  <li>Source type classification</li>
                  <li>Domain analysis (.gov, .edu, etc.)</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-2">
                  This assessment helps journalists evaluate the reliability of their sources. Always verify information across multiple credible sources.
                </p>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </CardFooter>
    </Card>
  );
}