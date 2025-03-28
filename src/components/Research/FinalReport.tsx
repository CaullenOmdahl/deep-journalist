"use client";
import dynamic from "next/dynamic";
import { useTranslation } from "react-i18next";
import { Download, FileText, Signature, FileEdit, AlertCircle, MessageSquare, AlertTriangle, Scale, Radar, Layout, X } from "lucide-react";
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
                  <Button 
                    disabled={isRewriting} 
                    onClick={handleRewriteArticle}
                  >
                    {isRewriting ? (
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <FileEdit className="mr-2 h-4 w-4" />
                    )}
                    {isRewriting ? "Rewriting..." : "Rewrite as this type"}
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                {t("editor.export")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
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
          />
        </div>

        <WordCountIndicator 
          content={taskStore.finalReport.replace(/#+\s/g, "").replace(/[*-]\s/g, "")} 
          articleType={taskStore.articleType || 'news'} 
        />

        <BiasDetector 
          content={taskStore.finalReport}
          onNeutralize={handleBiasNeutralize}
        />

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
