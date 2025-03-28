"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  BarChart2,
  Check,
  ChevronDown,
  Edit,
  ExternalLink,
  Eye,
  Info,
  LineChart,
  Shield,
  ThumbsUp,
  X,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/Button";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  detectBias,
  BiasedPhrase,
  BiasDetectionResult,
  generateHighlightedHTML,
  neutralizeBias,
  BiasType,
  PoliticalLeaning
} from "@/utils/bias-detection";

interface BiasDetectorProps {
  text: string;
  onNeutralize?: (neutralizedText: string) => void;
  readonly?: boolean;
}

export default function BiasDetector({ text, onNeutralize, readonly = false }: BiasDetectorProps) {
  const { t } = useTranslation();
  const [biasResult, setBiasResult] = useState<BiasDetectionResult | null>(null);
  const [highlightedHtml, setHighlightedHtml] = useState<string>("");
  const [phraseSelections, setPhraseSelections] = useState<Record<string, string>>({});
  const [isOpen, setIsOpen] = useState(false);

  // Analyze text for bias
  useEffect(() => {
    if (text) {
      const result = detectBias(text);
      setBiasResult(result);
      setHighlightedHtml(generateHighlightedHTML(text, result.biasedPhrases));
      
      // Reset phrase selections when text changes
      setPhraseSelections({});
    }
  }, [text]);

  // Get severity color for UI elements
  const getSeverityColor = (severity: 'high' | 'medium' | 'low' | 'none') => {
    switch (severity) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-orange-400';
      case 'low': return 'bg-yellow-300';
      case 'none': return 'bg-green-500';
    }
  };

  // Get severity icon
  const getSeverityIcon = (severity: 'high' | 'medium' | 'low' | 'none') => {
    switch (severity) {
      case 'high': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'medium': return <AlertTriangle className="h-5 w-5 text-orange-400" />;
      case 'low': return <Info className="h-5 w-5 text-yellow-500" />;
      case 'none': return <ThumbsUp className="h-5 w-5 text-green-500" />;
    }
  };

  // Get color for bias type
  const getBiasTypeColor = (type: BiasType) => {
    switch (type) {
      case 'political': return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      case 'loaded-language': return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'labeling': return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
      case 'false-equivalence': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'passive-construction': return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'framing': return 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200';
      case 'subjective-qualifier': return 'bg-pink-100 text-pink-800 hover:bg-pink-200';
      case 'generalization': return 'bg-green-100 text-green-800 hover:bg-green-200';
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  // Get color for political leaning
  const getLeaningColor = (leaning: PoliticalLeaning) => {
    switch (leaning) {
      case 'left': return 'bg-blue-100 text-blue-800';
      case 'right': return 'bg-red-100 text-red-800';
      case 'center': return 'bg-green-100 text-green-800';
      case 'unknown': return 'bg-gray-100 text-gray-800';
    }
  };

  // Group biased phrases by type for better organization
  const getPhrasesByType = useCallback(() => {
    if (!biasResult) return {};
    
    return biasResult.biasedPhrases.reduce((grouped, phrase) => {
      if (!grouped[phrase.type]) {
        grouped[phrase.type] = [];
      }
      grouped[phrase.type].push(phrase);
      return grouped;
    }, {} as Record<BiasType, BiasedPhrase[]>);
  }, [biasResult]);

  // Handle neutralize button click
  const handleNeutralize = useCallback(() => {
    if (!biasResult || !onNeutralize) return;
    
    // Prepare phrases to neutralize
    const phrasesToNeutralize = Object.entries(phraseSelections)
      .filter(([key, selection]) => selection !== 'keep') // Filter out items marked 'keep'
      .map(([key, selection]) => {
        const [index, _] = key.split('-');
        const phraseIndex = parseInt(index);
        const phrase = biasResult.biasedPhrases[phraseIndex];
        
        // If selection is 'remove', we'll replace with empty string
        const replacement = selection === 'remove' ? '' : selection;
        
        return {
          original: phrase.text,
          replacement,
          startIndex: phrase.startIndex,
          endIndex: phrase.endIndex
        };
      });
    
    // Apply neutralization
    const neutralizedText = neutralizeBias(text, phrasesToNeutralize);
    onNeutralize(neutralizedText);
  }, [biasResult, phraseSelections, text, onNeutralize]);

  // Handle selecting a replacement option
  const handleReplacementSelect = (phraseIndex: number, replacement: string) => {
    setPhraseSelections(prev => ({
      ...prev,
      [`${phraseIndex}-${replacement}`]: replacement
    }));
  };

  // Calculate how many phrases have replacements selected
  const getSelectedCount = () => {
    return Object.keys(phraseSelections).length;
  };

  // Format bias score as a percentage
  const formatScore = (score: number) => {
    return `${Math.round(score)}%`;
  };

  // If there's no text or no bias result, don't render
  if (!text || !biasResult) return null;

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="w-full rounded-md border shadow-sm"
    >
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          {getSeverityIcon(biasResult.severity)}
          <div>
            <h4 className="text-sm font-semibold">
              Bias Detection {biasResult.severity !== 'none' ? `(${biasResult.severity.toUpperCase()})` : '(NONE)'}
            </h4>
            <p className="text-sm text-muted-foreground">
              {biasResult.biasedPhrases.length > 0
                ? `${biasResult.biasedPhrases.length} potentially biased phrases detected`
                : "No bias detected in the text"}
            </p>
          </div>
        </div>
        
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm">
            {isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
            <span className="ml-2">{isOpen ? "Hide Details" : "Show Details"}</span>
          </Button>
        </CollapsibleTrigger>
      </div>
      
      <CollapsibleContent>
        <div className="px-4 pb-4 space-y-4">
          {biasResult.biasedPhrases.length > 0 ? (
            <Tabs defaultValue="overview">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="highlighted">Highlighted Text</TabsTrigger>
                <TabsTrigger value="neutralize">Neutralize</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div>
                      <div className="mb-1 flex justify-between text-xs">
                        <span>Bias Score</span>
                        <span className="font-medium">{formatScore(biasResult.biasScore)}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div 
                          className={getSeverityColor(biasResult.severity)} 
                          style={{ width: `${biasResult.biasScore}%` }}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <div className="mb-1 flex justify-between text-xs">
                        <span>Perspective Balance</span>
                        <span className="font-medium">{formatScore(biasResult.balanceScore)}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div 
                          className="bg-blue-500" 
                          style={{ width: `${biasResult.balanceScore}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs font-medium">Political Leaning:</span>
                      <Badge className={getLeaningColor(biasResult.politicalLeaning)}>
                        {biasResult.politicalLeaning.charAt(0).toUpperCase() + biasResult.politicalLeaning.slice(1)}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Suggestions</h4>
                    <ul className="text-xs space-y-1 list-disc pl-4">
                      {biasResult.suggestions.map((suggestion, i) => (
                        <li key={i}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Detected Bias Types</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(getPhrasesByType()).map((type) => (
                      <Badge key={type} className={getBiasTypeColor(type as BiasType)} variant="outline">
                        {type.replace('-', ' ')}
                        <span className="ml-1 text-xs">({getPhrasesByType()[type as BiasType].length})</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="highlighted" className="pt-4">
                <div className="p-4 border rounded-md bg-muted/50 whitespace-pre-wrap max-h-60 overflow-y-auto">
                  <div dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
                </div>
                
                <div className="mt-3 flex flex-wrap gap-2">
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-red-200 border border-red-400"></span>
                    <span className="text-xs">High Severity</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-orange-200 border border-orange-400"></span>
                    <span className="text-xs">Medium Severity</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-yellow-200 border border-yellow-400"></span>
                    <span className="text-xs">Low Severity</span>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="neutralize" className="pt-4">
                <div className="space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      Select replacements for biased phrases. Choose "Keep" to leave the original text unchanged.
                    </AlertDescription>
                  </Alert>
                  
                  <Accordion type="multiple" className="w-full">
                    {Object.entries(getPhrasesByType()).map(([type, phrases]) => (
                      <AccordionItem key={type} value={type} className="border-b">
                        <AccordionTrigger className="text-sm">
                          <span className="flex items-center gap-2">
                            <Badge className={getBiasTypeColor(type as BiasType)} variant="outline">
                              {type.replace('-', ' ')}
                            </Badge>
                            <span>{phrases.length} phrases</span>
                          </span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-3">
                            {phrases.map((phrase, idx) => {
                              const globalIdx = biasResult.biasedPhrases.findIndex(
                                p => p.startIndex === phrase.startIndex && p.text === phrase.text
                              );
                              return (
                                <div key={`${globalIdx}-${phrase.text}`} className="border rounded-md p-3">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <div className="font-medium text-sm mb-1">{phrase.text}</div>
                                      <p className="text-xs text-muted-foreground">{phrase.explanation}</p>
                                    </div>
                                    <Badge variant="outline" className={
                                      phrase.severity === 'high' ? 'bg-red-100 text-red-800' : 
                                      phrase.severity === 'medium' ? 'bg-orange-100 text-orange-800' : 
                                      'bg-yellow-100 text-yellow-800'
                                    }>
                                      {phrase.severity.toUpperCase()}
                                    </Badge>
                                  </div>
                                  
                                  <div className="mt-2">
                                    <div className="text-xs font-medium mb-1">Alternatives:</div>
                                    <div className="flex flex-wrap gap-2">
                                      <Badge 
                                        variant={phraseSelections[`${globalIdx}-keep`] === 'keep' ? 'default' : 'outline'}
                                        className="cursor-pointer hover:bg-accent"
                                        onClick={() => handleReplacementSelect(globalIdx, 'keep')}
                                      >
                                        {phraseSelections[`${globalIdx}-keep`] === 'keep' && (
                                          <Check className="mr-1 h-3 w-3" />
                                        )}
                                        Keep Original
                                      </Badge>
                                      
                                      {phrase.suggestions.map((suggestion, i) => (
                                        <Badge 
                                          key={i}
                                          variant={phraseSelections[`${globalIdx}-${suggestion}`] === suggestion ? 'default' : 'outline'}
                                          className="cursor-pointer hover:bg-accent"
                                          onClick={() => handleReplacementSelect(globalIdx, suggestion)}
                                        >
                                          {phraseSelections[`${globalIdx}-${suggestion}`] === suggestion && (
                                            <Check className="mr-1 h-3 w-3" />
                                          )}
                                          {suggestion === '[remove]' ? 'Remove' : suggestion}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                  
                  {!readonly && onNeutralize && (
                    <div className="flex justify-end mt-4">
                      <Button 
                        disabled={getSelectedCount() === 0}
                        onClick={handleNeutralize}
                        className="flex items-center gap-2"
                        size="sm"
                      >
                        <Edit className="h-4 w-4" />
                        Apply Changes
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <Alert className="bg-green-50 border-green-200">
              <ThumbsUp className="h-4 w-4 text-green-500" />
              <AlertTitle>No bias detected</AlertTitle>
              <AlertDescription>
                The text appears to be neutral and balanced. Good job maintaining journalistic integrity!
              </AlertDescription>
            </Alert>
          )}
          
          <div className="pt-4 border-t">
            <a 
              href="https://www.spj.org/ethicscode.asp" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:underline flex items-center"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Learn more about journalistic standards
            </a>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
} 