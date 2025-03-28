"use client";
import dynamic from "next/dynamic";
import { useTranslation } from "react-i18next";
import { Download, FileText, Signature, FileEdit, AlertCircle, MessageSquare, AlertTriangle, Scale, Radar, Layout, X, Globe, Check, Twitter, Facebook, Linkedin, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { useTaskStore } from "@/store/task";
import { getSystemPrompt } from "@/utils/deep-research";
import { downloadFile } from "@/utils/file";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue, 
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import useDeepResearch from "@/hooks/useDeepResearch";
import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import ClaimVerificationStatus, { VerificationStatus } from "./ClaimVerificationStatus";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import WordCountIndicator from "./WordCountIndicator";
import ContentWarningDialog, { ContentWarning } from "./ContentWarningDialog";
import BiasDetector from "./BiasDetector";
import JournalisticMetricsPanel from "./JournalisticMetricsPanel";
import CitationManager from "./CitationManager";
import StoryTracker from "./StoryTracker";
import ArticleStructureEditor from "./ArticleStructureEditor";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const MilkdownEditor = dynamic(() => import("@/components/MilkdownEditor"));
const Artifact = dynamic(() => import("@/components/Artifact"));

interface Claim {
  id: string;
  text: string;
  status: VerificationStatus;
  details?: string;
}

function FinalReport() {
  const { t } = useTranslation();
  const taskStore = useTaskStore();
  const { writeFinalReport } = useDeepResearch();
  const [isRewriting, setIsRewriting] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState<string>("en");
  const [claims, setClaims] = useState<Claim[]>([]);
  const [claimText, setClaimText] = useState('');
  const [claimStatus, setClaimStatus] = useState<VerificationStatus>('unverified');
  const [claimDetails, setClaimDetails] = useState('');
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [contentWarnings, setContentWarnings] = useState<ContentWarning[]>([]);
  const [neutralizedText, setNeutralizedText] = useState<string>('');

  const articleTypeLabels = {
    news: {
      label: "News Article",
      description: "500-800 words, focused reporting on current events"
    },
    feature: {
      label: "Feature Article",
      description: "800-1,500 words, in-depth coverage with human interest"
    },
    investigative: {
      label: "Investigative Report",
      description: "1,500-2,500 words, thorough analysis of complex topics"
    },
    explainer: {
      label: "Explainer",
      description: "800-1,200 words, contextual information about a topic"
    }
  };

  // Languages for translation
  const languages = [
    { code: "en", name: "English" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "it", name: "Italian" },
    { code: "pt", name: "Portuguese" },
    { code: "ru", name: "Russian" },
    { code: "zh", name: "Chinese" },
    { code: "ja", name: "Japanese" },
    { code: "ar", name: "Arabic" },
    { code: "hi", name: "Hindi" }
  ];

  function getFinalReportContent() {
    const { finalReport, sources } = useTaskStore.getState();

    return [
      finalReport,
      sources.length > 0
        ? [
            "\n\n---",
            `## ${t("research.finalReport.researchedInfor", {
              total: sources.length,
            })}`,
            `${sources
              .map(
                (source, idx) =>
                  `${idx + 1}. [${source.title || source.url}](${source.url})`
              )
              .join("\n")}`,
          ].join("\n\n")
        : "",
      claims.length > 0
        ? [
            "\n\n---",
            "## Verified Claims",
            `${claims
              .map(
                (claim) => 
                  `- **${claim.text}**: ${claim.status}${claim.details ? ` - _${claim.details}_` : ''}`
              )
              .join("\n")}`,
          ].join("\n\n")
        : "",
    ].join("\n\n");
  }

  const handleAddClaim = () => {
    if (!claimText.trim()) return;
    
    const newClaim = {
      id: Date.now().toString(),
      text: claimText,
      status: claimStatus,
      details: claimDetails
    };
    
    setClaims([...claims, newClaim]);
    resetClaimForm();
    setIsDialogOpen(false);
  };

  const handleUpdateClaim = () => {
    if (!selectedClaimId || !claimText.trim()) return;
    
    setClaims(claims.map(claim => 
      claim.id === selectedClaimId 
        ? { ...claim, text: claimText, status: claimStatus, details: claimDetails }
        : claim
    ));
    
    resetClaimForm();
    setSelectedClaimId(null);
    setIsDialogOpen(false);
  };

  const handleDeleteClaim = (id: string) => {
    setClaims(claims.filter(claim => claim.id !== id));
  };

  const resetClaimForm = () => {
    setClaimText('');
    setClaimStatus('unverified');
    setClaimDetails('');
  };

  const editClaim = (claim: Claim) => {
    setClaimText(claim.text);
    setClaimStatus(claim.status);
    setClaimDetails(claim.details || '');
    setSelectedClaimId(claim.id);
    setIsDialogOpen(true);
  };

  async function handleDownloadPDF() {
    const originalTitle = document.title;
    document.title = taskStore.title;
    window.print();
    document.title = originalTitle;
  }

  async function handleRewriteArticle() {
    try {
      setIsRewriting(true);
      await writeFinalReport();
    } finally {
      setIsRewriting(false);
    }
  }

  function handleArticleTypeChange(value: "news" | "feature" | "investigative" | "explainer") {
    taskStore.setArticleType(value);
  }

  const handleAddContentWarning = (warning: ContentWarning) => {
    setContentWarnings([...contentWarnings, warning]);
  };

  const handleRemoveContentWarning = (id: string) => {
    setContentWarnings(contentWarnings.filter((warning) => warning.id !== id));
  };

  const handleBiasNeutralize = (neutralizedText: string) => {
    setNeutralizedText(neutralizedText);
    taskStore.updateFinalReport(neutralizedText);
  };

  const handleApplyTemplate = (template: string) => {
    taskStore.updateFinalReport(template);
    toast({
      title: "Template Applied",
      description: "Click 'Rewrite as this type' to generate content based on this template."
    });
  };

  async function handleTranslateContent() {
    if (!taskStore.finalReport.trim()) {
      toast.error("No content to translate");
      return;
    }
    
    try {
      setIsTranslating(true);
      
      // Create a provider for the Google AI API
      const provider = createProvider("google");
      const translationModel = "gemini-2.0-flash-exp";
      
      toast.info(`Translating to ${languages.find(l => l.code === targetLanguage)?.name}...`);
      
      const result = await streamText({
        model: provider(translationModel),
        system: "You are a professional translator. Translate the provided content while preserving all formatting, headlines, and paragraph structure. Keep markdown syntax intact. Do not add any additional text or explanations.",
        prompt: `Translate the following article to ${languages.find(l => l.code === targetLanguage)?.name}. Preserve all markdown formatting:\n\n${taskStore.finalReport}`,
        experimental_transform: smoothStream(),
        onError: (error) => {
          console.error("Translation error:", error);
          toast.error("Translation failed. Please try again later.");
        },
      });
      
      let translatedContent = "";
      
      for await (const textPart of result.textStream) {
        translatedContent += textPart;
        // You could update a preview state here if needed
      }
      
      // Update the report with the translated content
      taskStore.updateFinalReport(translatedContent);
      toast.success(`Translation to ${languages.find(l => l.code === targetLanguage)?.name} completed`);
      
    } catch (error) {
      console.error("Translation error:", error);
      toast.error("Translation failed. Please try again later.");
    } finally {
      setIsTranslating(false);
    }
  }
  
  function getSocialMediaContent(platform: 'facebook' | 'twitter' | 'linkedin' | 'whatsapp'): string {
    const { title } = taskStore;
    const content = taskStore.finalReport;
    
    // Extract first paragraph for summary
    const paragraphs = content.split('\n\n');
    let firstPara = "";
    for (const para of paragraphs) {
      if (!para.startsWith('#') && para.trim().length > 20) {
        firstPara = para;
        break;
      }
    }
    
    // Extract title without markdown
    const cleanTitle = title.replace(/^#\s+/, '').replace(/\*\*/g, '');
    
    switch (platform) {
      case 'twitter':
        // Twitter has 280 char limit
        return `${cleanTitle}\n\n${firstPara.substring(0, Math.min(firstPara.length, 200))}${firstPara.length > 200 ? '...' : ''}\n\n#journalism #research`;
        
      case 'facebook':
        // Facebook allows longer posts but still needs conciseness
        // Extract first 3 paragraphs that aren't headers
        const fbParagraphs = paragraphs.filter(p => !p.startsWith('#') && p.trim().length > 0).slice(0, 3);
        return `${cleanTitle}\n\n${fbParagraphs.join('\n\n')}${paragraphs.length > 3 ? '\n\n(See full article for more...)' : ''}`;
        
      case 'linkedin':
        // LinkedIn allows professional longer-form content
        // Include title, intro paragraph, and bullet points if available
        const bulletPoints = content.match(/[*-]\s.+/g) || [];
        const bulletSection = bulletPoints.length > 0 
          ? `\n\nKey points:\n${bulletPoints.slice(0, 5).join('\n')}${bulletPoints.length > 5 ? '\n...' : ''}` 
          : '';
          
        return `${cleanTitle}\n\n${firstPara}${bulletSection}\n\n#journalism #research #professional`;
        
      case 'whatsapp':
        // WhatsApp needs more compact content
        return `*${cleanTitle}*\n\n${firstPara.substring(0, Math.min(firstPara.length, 300))}${firstPara.length > 300 ? '...' : ''}\n\n_Generated with Deep Journalist_`;
        
      default:
        return content;
    }
  }

  return (
    <section className="p-4 border rounded-md mt-4 print:border-none">
      <div className="flex justify-between items-center border-b mb-2 print:hidden">
        <h3 className="font-semibold text-lg leading-10">
          {t("research.finalReport.title")}
        </h3>
        <div className="flex items-center gap-2">
          <button 
            className="px-2 py-1 text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-900 border border-yellow-300 rounded"
            onClick={() => {
              const sampleReport = `# AI in Modern Journalism: Transforming How We Report and Consume News

This comprehensive review explores the rapidly evolving landscape of artificial intelligence in journalism and its profound impact on content creation, editorial processes, and the media industry as a whole.

## The Current State of AI in Newsrooms

The integration of artificial intelligence in newsrooms has accelerated dramatically in recent years. Major news organizations including Bloomberg, Associated Press, and The Washington Post have implemented sophisticated AI systems for various journalistic functions. These systems assist with data analysis, content generation, and even identifying trending stories before they go viral.

Journalists today are increasingly working alongside AI tools that can:
- Generate basic news reports from structured data
- Transcribe and analyze interviews efficiently
- Identify patterns across large datasets
- Create personalized news experiences for readers
- Flag potentially misleading information

According to a 2023 survey by the Reuters Institute, approximately 37% of news organizations now use some form of AI in their content production pipeline. This percentage represents a significant increase from just 14% in 2018.

## Ethical Concerns and Challenges

Despite the advantages, the rise of AI in journalism raises significant ethical questions. Critics worry about the potential for bias in AI-generated content, as machine learning systems often inherit biases present in their training data.

### Transparency Issues

There's also ongoing debate about disclosure requirements. Should readers be informed when content is partially or fully generated by AI? Some organizations have established clear policies:

* The Associated Press labels automated content
* The Guardian discloses AI assistance in data-heavy stories
* Reuters maintains a human editor review process for all AI outputs

"Transparency about AI use is not just an ethical consideration but increasingly a matter of maintaining reader trust," notes Professor Emily Chen, media ethics researcher at Columbia University.

### Job Displacement Concerns

Many journalists fear job displacement as AI systems become more capable. However, industry experts point to a transformation rather than wholesale replacement:

"AI excels at routine, formulaic reporting, freeing human journalists to focus on investigative work, analysis, and storytelling," explains Dr. Maria Rodriguez, media technology researcher at Columbia University.

## The Future of AI-Human Collaboration

The most promising developments appear to be in human-AI collaboration models. These hybrid approaches leverage AI for data processing and initial drafts while relying on human journalists for judgment, context, and ethical decision-making.

Several innovative models are emerging:
1. AI research assistants that gather information from diverse sources
2. Co-writing systems where journalists refine AI-generated drafts
3. Automated fact-checking tools that support human verification
4. Multilingual translation systems allowing global news accessibility

## Economic Implications for Media Organizations

The economic case for AI in journalism is compelling. Smaller newsrooms with limited resources can now produce more content at lower costs. Local news outlets, which have been especially hard-hit by revenue challenges, may find particular value in automating routine coverage of municipal meetings, sports events, and financial reports.

A case study of five regional newspapers implementing AI systems showed an average productivity increase of 27% while maintaining human editorial oversight.

## Conclusion

As AI continues to evolve, journalism will likely transform in ways we cannot fully predict. The fundamental skills of critical thinking, ethical judgment, and storytelling will remain distinctly human advantages. The most successful media organizations will be those that thoughtfully integrate AI capabilities while preserving the core values that make journalism essential to society.

The coming decade will be defined not by whether AI replaces journalists, but by how effectively humans and machines collaborate to create more informative, accessible, and trustworthy news.`;
              
              taskStore.updateFinalReport(sampleReport);
              
              setTimeout(() => {
                console.log("Debug content added, length:", sampleReport.length);
                console.log("First 50 chars:", sampleReport.substring(0, 50));
              }, 100);
            }}
          >
            Debug: Add Sample Content
          </button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1">
                <FileEdit className="h-4 w-4" />
                {articleTypeLabels[taskStore.articleType || 'news'].label}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Article Type</h4>
                  <p className="text-sm text-muted-foreground">
                    Select the type of article you want to write
                  </p>
                </div>
                <div className="grid gap-2">
                  <Select 
                    defaultValue={taskStore.articleType || 'news'} 
                    onValueChange={(value) => handleArticleTypeChange(value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="news">
                        <div className="flex flex-col">
                          <span>News Article</span>
                          <span className="text-xs text-muted-foreground">
                            {articleTypeLabels.news.description}
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="feature">
                        <div className="flex flex-col">
                          <span>Feature Article</span>
                          <span className="text-xs text-muted-foreground">
                            {articleTypeLabels.feature.description}
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="investigative">
                        <div className="flex flex-col">
                          <span>Investigative Report</span>
                          <span className="text-xs text-muted-foreground">
                            {articleTypeLabels.investigative.description}
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="explainer">
                        <div className="flex flex-col">
                          <span>Explainer</span>
                          <span className="text-xs text-muted-foreground">
                            {articleTypeLabels.explainer.description}
                          </span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          className="w-full" 
                          size="lg"
                          disabled={isRewriting} 
                          onClick={handleRewriteArticle}
                        >
                          {isRewriting ? (
                            <>
                              <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
                              Generating Article...
                            </>
                          ) : (
                            <>
                              <FileText className="mr-2 h-5 w-5" />
                              Write Article
                            </>
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Generate a journalistic article based on your sources and research</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={isTranslating}>
                <Globe className="mr-2 h-4 w-4" />
                {isTranslating ? "Translating..." : "Translate"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Select language</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {languages.map(lang => (
                <DropdownMenuItem 
                  key={lang.code}
                  onClick={() => {
                    setTargetLanguage(lang.code);
                    if (lang.code !== "en") {
                      handleTranslateContent();
                    } else {
                      toast.info("Already in English");
                    }
                  }}
                >
                  <span>{lang.name}</span>
                  {lang.code === targetLanguage && (
                    <Check className="ml-2 h-4 w-4" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                {t("editor.export")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Document Formats</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() =>
                  downloadFile(
                    getFinalReportContent(),
                    `${taskStore.title}.md`,
                    "text/markdown;charset=utf-8"
                  )
                }
              >
                <FileText className="mr-2 h-4 w-4" />
                <span>Markdown (.md)</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownloadPDF}>
                <Signature className="mr-2 h-4 w-4" />
                <span>Print / Save as PDF</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Social Media</DropdownMenuLabel>
              
              <DropdownMenuItem 
                onClick={() => {
                  const content = getSocialMediaContent('twitter');
                  navigator.clipboard.writeText(content);
                  toast.success("Twitter post copied to clipboard");
                }}
              >
                <Twitter className="mr-2 h-4 w-4" />
                <span>X/Twitter</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={() => {
                  const content = getSocialMediaContent('facebook');
                  navigator.clipboard.writeText(content);
                  toast.success("Facebook post copied to clipboard");
                }}
              >
                <Facebook className="mr-2 h-4 w-4" />
                <span>Facebook</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={() => {
                  const content = getSocialMediaContent('linkedin');
                  navigator.clipboard.writeText(content);
                  toast.success("LinkedIn post copied to clipboard");
                }}
              >
                <Linkedin className="mr-2 h-4 w-4" />
                <span>LinkedIn</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={() => {
                  const content = getSocialMediaContent('whatsapp');
                  navigator.clipboard.writeText(content);
                  toast.success("WhatsApp message copied to clipboard");
                }}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                <span>WhatsApp</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Export Options</DropdownMenuLabel>
              
              <DropdownMenuItem 
                onClick={() => {
                  const allFormats = {
                    twitter: getSocialMediaContent('twitter'),
                    facebook: getSocialMediaContent('facebook'),
                    linkedin: getSocialMediaContent('linkedin'),
                    whatsapp: getSocialMediaContent('whatsapp'),
                    full: taskStore.finalReport
                  };
                  
                  const formattedContent = `# Social Media Export for "${taskStore.title}"\n\n## Twitter/X Post\n\`\`\`\n${allFormats.twitter}\n\`\`\`\n\n## Facebook Post\n\`\`\`\n${allFormats.facebook}\n\`\`\`\n\n## LinkedIn Post\n\`\`\`\n${allFormats.linkedin}\n\`\`\`\n\n## WhatsApp Message\n\`\`\`\n${allFormats.whatsapp}\n\`\`\`\n\n## Full Article\n\`\`\`\n${allFormats.full}\n\`\`\`\n`;
                  
                  downloadFile(
                    formattedContent,
                    `${taskStore.title}_social_media_kit.md`,
                    "text/markdown;charset=utf-8"
                  );
                  
                  toast.success("Social Media Kit downloaded");
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                <span>Download Social Media Kit</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="space-y-3 mb-4 print:hidden">
        <div className="flex flex-wrap gap-2 items-center">
          {contentWarnings.length > 0 && (
            <>
              <Badge variant="outline" className="bg-yellow-50 border-yellow-200 text-yellow-800">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Content Warnings:
              </Badge>
              {contentWarnings.map((warning) => (
                <Badge 
                  key={warning.id} 
                  variant="outline" 
                  className="bg-yellow-50 flex items-center gap-1 pl-2 border-yellow-200"
                >
                  {warning.type}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-4 w-4 ml-1 hover:bg-yellow-100"
                    onClick={() => handleRemoveContentWarning(warning.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </>
          )}
          <ContentWarningDialog 
            contentWarnings={contentWarnings} 
            onAdd={handleAddContentWarning}
            onRemove={handleRemoveContentWarning}
          >
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{t("editor.add-warning")}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Add a content warning for sensitive or potentially triggering material</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </ContentWarningDialog>
        </div>

        <WordCountIndicator 
          content={taskStore.finalReport.replace(/#+\s/g, "").replace(/[*-]\s/g, "")} 
          articleType={taskStore.articleType || 'news'} 
        />

        <BiasDetector 
          content={taskStore.finalReport}
          onNeutralize={handleBiasNeutralize}
        >
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  <Scale className="h-4 w-4" />
                  <span>{t("editor.detect-bias")}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Detect and neutralize potential bias in your article</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </BiasDetector>

        {taskStore.finalReport && taskStore.sources.length > 0 && (
          <JournalisticMetricsPanel 
            content={taskStore.finalReport}
            sources={taskStore.sources}
          />
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="mb-2">
              <MessageSquare className="mr-2 h-4 w-4" />
              {selectedClaimId ? "Edit Claim" : "Add Verified Claim"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedClaimId ? "Edit Claim" : "Add Verified Claim"}</DialogTitle>
              <DialogDescription>
                Add factual claims that you've verified during your research.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="claim">Claim</Label>
                <Textarea
                  id="claim"
                  value={claimText}
                  onChange={(e) => setClaimText(e.target.value)}
                  placeholder="Enter the factual claim"
                  className="h-24"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="status">Verification Status</Label>
                <Select 
                  value={claimStatus} 
                  onValueChange={(value) => setClaimStatus(value as VerificationStatus)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Verification status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="unverified">Unverified</SelectItem>
                    <SelectItem value="disputed">Disputed</SelectItem>
                    <SelectItem value="false">False</SelectItem>
                    <SelectItem value="needs-context">Needs Context</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="details">Supporting Details (Optional)</Label>
                <Textarea
                  id="details"
                  value={claimDetails}
                  onChange={(e) => setClaimDetails(e.target.value)}
                  placeholder="Add supporting evidence or context"
                  className="h-24"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                resetClaimForm();
                setSelectedClaimId(null);
                setIsDialogOpen(false);
              }}>
                Cancel
              </Button>
              <Button onClick={selectedClaimId ? handleUpdateClaim : handleAddClaim}>
                {selectedClaimId ? "Update" : "Add"} Claim
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {claims.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Verified Claims</h4>
            <div className="space-y-2">
              {claims.map((claim) => (
                <div key={claim.id} className="flex items-start gap-2 p-2 border rounded">
                  <ClaimVerificationStatus status={claim.status} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{claim.text}</p>
                    {claim.details && (
                      <p className="text-xs text-muted-foreground mt-1">{claim.details}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6" 
                      onClick={() => editClaim(claim)}
                    >
                      <FileEdit className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 text-destructive hover:text-destructive" 
                      onClick={() => handleDeleteClaim(claim.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="print:hidden">
        <WordCountIndicator 
          content={taskStore.finalReport.replace(/#+\s/g, "").replace(/[*-]\s/g, "")} 
          articleType={taskStore.articleType} 
        />
        
        <ContentWarningDialog 
          contentWarnings={contentWarnings} 
          onAdd={handleAddContentWarning}
          onRemove={handleRemoveContentWarning}
        />
        
        <BiasDetector 
          content={taskStore.finalReport}
          onNeutralize={handleBiasNeutralize}
        />
        
        {taskStore.sources.length > 0 && (
          <CitationManager sources={taskStore.sources} />
        )}
        
        <ArticleStructureEditor onApplyTemplate={handleApplyTemplate} />
        
        <JournalisticMetricsPanel content={taskStore.finalReport} sources={taskStore.sources} />
        
        <StoryTracker finalReport={taskStore.finalReport} />
      </div>

      {taskStore.finalReport ? (
        <>
          <div className="article-content prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg max-w-none">
            {taskStore.finalReport.split("\n").map((line, index) => {
              // Handle headers
              if (line.startsWith("# ")) {
                return <h1 key={index} className="text-xl font-bold mt-4 mb-2">{line.substring(2)}</h1>;
              } else if (line.startsWith("## ")) {
                return <h2 key={index} className="text-lg font-bold mt-3 mb-2">{line.substring(3)}</h2>;
              } else if (line.startsWith("### ")) {
                return <h3 key={index} className="text-md font-bold mt-3 mb-1">{line.substring(4)}</h3>;
              }
              
              // Handle lists
              else if (line.startsWith("- ")) {
                // Instead of individual list items, group them in a ul
                return <div key={index} className="flex ml-4"><span className="mr-2">•</span>{line.substring(2)}</div>;
              } else if (line.startsWith("* ")) {
                return <div key={index} className="flex ml-4"><span className="mr-2">•</span>{line.substring(2)}</div>;
              } else if (line.trim() === "") {
                return <div key={index} className="h-4"></div>; // More visible line break
              }
              
              // Default paragraph
              else {
                return <p key={index} className="my-2">{line}</p>;
              }
            })}
          </div>
          <Separator className="mt-4 print:hidden" />
          <div className="pt-3 print:hidden">
            <h3 className="font-semibold mb-3">
              {t("research.finalReport.researchedInfor", {
                total: taskStore.sources.length,
              })}
            </h3>
            {taskStore.sources.length === 0 ? (
              <div>No source...</div>
            ) : (
              <div>
                <ol>
                  {taskStore.sources.map((source, idx) => (
                    <li key={idx} className="mb-1 flex gap-1">
                      <a
                        href={source.url}
                        className="text-blue-500 hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {source.title || source.url}
                      </a>
                      {source.credibilityScore && (
                        <span className="text-xs text-muted-foreground">
                          (Credibility: {source.credibilityScore}/10)
                        </span>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
          {taskStore.sources.length > 0 && (
            <CitationManager sources={taskStore.sources} />
          )}
        </>
      ) : (
        <div className="h-60 flex flex-col gap-2 items-center justify-center text-center text-muted-foreground max-w-lg mx-auto">
          <AlertCircle className="h-10 w-10 text-muted" />
          <div>
            <h4 className="text-lg font-semibold">
              {t("research.finalReport.emptyTitle")}
            </h4>
            <p className="text-sm">{t("research.finalReport.emptyTip")}</p>
          </div>
        </div>
      )}
    </section>
  );
}

export default FinalReport;
