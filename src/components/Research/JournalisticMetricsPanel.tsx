"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertCircle,
  AlertTriangle,
  BarChart3,
  Check,
  ChevronDown,
  Info,
  ThumbsUp,
  Award
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/Button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { SearchTask } from "@/types";
import { evaluateJournalisticMetrics, MetricsResult, JournalisticIssue, MetricCategory, IssueSeverity } from "@/utils/journalistic-metrics";

interface JournalisticMetricsPanelProps {
  content: string;
  sources: SearchTask[];
}

export default function JournalisticMetricsPanel({ content, sources }: JournalisticMetricsPanelProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [metrics, setMetrics] = useState<MetricsResult | null>(null);
  
  useEffect(() => {
    if (content && sources) {
      const result = evaluateJournalisticMetrics(content, sources);
      setMetrics(result);
    }
  }, [content, sources]);
  
  if (!metrics) return null;
  
  const getCategoryIcon = (category: MetricCategory) => {
    switch(category) {
      case 'accuracy': return <Check className="h-4 w-4" />;
      case 'fairness': return <BarChart3 className="h-4 w-4" />;
      case 'source-diversity': return <BarChart3 className="h-4 w-4" />;
      case 'context': return <Info className="h-4 w-4" />;
      case 'transparency': return <Info className="h-4 w-4" />;
      case 'clarity': return <Check className="h-4 w-4" />;
      case 'public-interest': return <Award className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };
  
  const getCategoryLabel = (category: MetricCategory) => {
    switch(category) {
      case 'accuracy': return 'Accuracy';
      case 'fairness': return 'Fairness';
      case 'source-diversity': return 'Source Diversity';
      case 'context': return 'Context & Completeness';
      case 'transparency': return 'Transparency';
      case 'clarity': return 'Clarity';
      case 'public-interest': return 'Public Interest';
      default: return category;
    }
  };
  
  const getComplianceBadge = (compliance: string) => {
    switch(compliance) {
      case 'excellent':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-300">
            Excellent
          </Badge>
        );
      case 'good':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-300">
            Good
          </Badge>
        );
      case 'average':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
            Average
          </Badge>
        );
      case 'needs-improvement':
        return (
          <Badge className="bg-orange-100 text-orange-800 border-orange-300">
            Needs Improvement
          </Badge>
        );
      case 'poor':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-300">
            Poor
          </Badge>
        );
      default:
        return null;
    }
  };
  
  const getSeverityIcon = (severity: IssueSeverity) => {
    switch(severity) {
      case 'high':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'low':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };
  
  const getScoreColor = (score: number) => {
    if (score >= 90) return "bg-green-500";
    if (score >= 80) return "bg-blue-500";
    if (score >= 70) return "bg-yellow-500";
    if (score >= 50) return "bg-orange-500";
    return "bg-red-500";
  };
  
  return (
    <Card className="shadow-sm w-full mt-4">
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="w-full"
      >
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            {metrics.complianceLevel === 'excellent' || metrics.complianceLevel === 'good' ? (
              <ThumbsUp className="h-5 w-5 text-green-500" />
            ) : metrics.complianceLevel === 'average' ? (
              <Info className="h-5 w-5 text-yellow-500" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-orange-500" />
            )}
            <div>
              <h4 className="text-sm font-semibold flex items-center gap-2">
                Journalistic Standards Compliance 
                {getComplianceBadge(metrics.complianceLevel)}
              </h4>
              <p className="text-sm text-muted-foreground">
                Overall score: {Math.round(metrics.overallScore)}/100
              </p>
            </div>
          </div>
          
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm">
              {isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <BarChart3 className="h-4 w-4" />
              )}
              <span className="ml-2">{isOpen ? "Hide Details" : "Show Metrics"}</span>
            </Button>
          </CollapsibleTrigger>
        </div>
        
        <CollapsibleContent>
          <CardContent className="grid gap-4 px-6">
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Category Scores</h4>
              
              <div className="space-y-2">
                {Object.entries(metrics.categoryScores).map(([category, score]) => (
                  <div key={category} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(category as MetricCategory)}
                        <span className="text-sm">{getCategoryLabel(category as MetricCategory)}</span>
                      </div>
                      <span className="text-sm font-medium">{Math.round(score)}/100</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div 
                        className={getScoreColor(score)}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {metrics.issues.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Issues to Address</h4>
                
                <Accordion type="single" collapsible className="w-full">
                  {metrics.issues.map((issue, index) => (
                    <AccordionItem key={index} value={`issue-${index}`}>
                      <AccordionTrigger className="text-sm hover:no-underline py-2">
                        <div className="flex items-center gap-2">
                          {getSeverityIcon(issue.severity)}
                          <span className="font-medium">{issue.description}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pl-6 text-sm">
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Badge variant="outline" className="capitalize">
                              {getCategoryLabel(issue.category)}
                            </Badge>
                            <Badge variant="outline" className="capitalize">
                              {issue.severity} severity
                            </Badge>
                          </div>
                          <div className="space-y-1 mt-2">
                            <span className="font-medium">Recommendations:</span>
                            <ul className="list-disc pl-5 space-y-1">
                              {issue.recommendations.map((rec, recIndex) => (
                                <li key={recIndex}>{rec}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}
            
            {metrics.strengths.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Strengths</h4>
                <div className="space-y-2 text-sm">
                  {metrics.strengths.map((strength, index) => (
                    <div key={index} className="flex items-start gap-2 p-2 border rounded-md bg-green-50">
                      <ThumbsUp className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>{strength}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="border-t px-6 py-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" className="text-xs">
                    <Info className="mr-2 h-3 w-3" />
                    About These Metrics
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  <p>
                    These metrics evaluate your article against journalistic
                    standards including accuracy, fairness, source diversity,
                    context, transparency, clarity, and public interest. Scores are
                    between 0-100 with recommendations for improvement.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardFooter>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
} 