"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FileText,
  Layout,
  List,
  Info,
  AlertCircle,
  HelpCircle,
  MessageSquare,
  Copy,
  CheckCircle,
  ExternalLink
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/Button";
import { useToast } from "@/components/ui/use-toast";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ArticleStructureEditorProps {
  onApplyTemplate: (template: string) => void;
}

interface TemplateSection {
  name: string;
  description: string;
  example: string;
  tips: string[];
}

interface ArticleTemplate {
  id: string;
  name: string;
  description: string;
  wordCountRange: string;
  sections: TemplateSection[];
  bestPractices: string[];
  examples: {
    title: string;
    url: string;
    publication?: string;
  }[];
  fullTemplate: string;
}

export default function ArticleStructureEditor({ onApplyTemplate }: ArticleStructureEditorProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("news");
  const [customTemplate, setCustomTemplate] = useState<string>("");
  const [showCustomEditor, setShowCustomEditor] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  
  const templates: ArticleTemplate[] = [
    {
      id: "news",
      name: "News Article",
      description: "A straightforward, factual account of current events. Focus on answering who, what, when, where, why, and how.",
      wordCountRange: "500-800 words",
      sections: [
        {
          name: "Headline",
          description: "Clear, concise summary of the main point using active voice.",
          example: "Senate Passes Historic Climate Bill with Bipartisan Support",
          tips: [
            "Keep it under 10 words when possible",
            "Use present tense for immediate events",
            "Avoid clickbait or sensationalism"
          ]
        },
        {
          name: "Lead/Intro",
          description: "First paragraph that captures the most important information.",
          example: "The U.S. Senate passed the most significant climate legislation in the nation's history on Tuesday, with surprising support from both Democrats and Republicans.",
          tips: [
            "Answer the key questions (who, what, when, where, why, how)",
            "Make it compelling but factual",
            "Keep it under 35 words"
          ]
        },
        {
          name: "Context/Background",
          description: "Provide essential information that readers need to understand the story.",
          example: "The bill, which allocates $500 billion toward renewable energy infrastructure, comes after months of negotiation and represents a major shift in climate policy.",
          tips: [
            "Explain why this story matters now",
            "Give relevant history briefly",
            "Avoid unnecessary details"
          ]
        },
        {
          name: "Key Points",
          description: "Present the main facts in order of importance (inverted pyramid).",
          example: "The legislation includes tax incentives for solar panel installation, funding for electric vehicle charging stations, and new emissions standards for factories.",
          tips: [
            "Use short paragraphs (1-3 sentences each)",
            "Include compelling quotes from relevant sources",
            "Present conflicting viewpoints fairly"
          ]
        },
        {
          name: "Quotes",
          description: "Include direct statements from relevant parties.",
          example: "\"This represents a turning point in how America addresses climate change,\" said Senator James Wilson, who co-sponsored the bill.",
          tips: [
            "Use quotes that add insight, not just repeat facts",
            "Balance quotes from different perspectives",
            "Verify the accuracy of all quotes"
          ]
        },
        {
          name: "Additional Context",
          description: "Include supporting details, reactions, or analysis.",
          example: "Environmental groups have praised the bill, while some industry leaders have expressed concerns about implementation costs.",
          tips: [
            "Include diverse perspectives",
            "Keep it balanced and neutral",
            "Add depth without overwhelming readers"
          ]
        },
        {
          name: "Conclusion",
          description: "Wrap up with forward-looking information or next steps.",
          example: "The bill now moves to the House, where it is expected to face a vote next week.",
          tips: [
            "Don't introduce new critical information",
            "Consider what happens next",
            "End with impact or significance"
          ]
        }
      ],
      bestPractices: [
        "Use clear, concise language and short paragraphs",
        "Follow the inverted pyramid structure (most important info first)",
        "Maintain neutrality and present facts without opinion",
        "Include multiple sources with diverse perspectives",
        "Prioritize accuracy over speed",
        "Use active voice when possible"
      ],
      examples: [
        {
          title: "How to Write a News Article: 12 Steps",
          url: "https://www.wikihow.com/Write-a-News-Article",
        },
        {
          title: "Sample News Articles",
          url: "https://www.examples.com/business/news-article.html",
        }
      ],
      fullTemplate: `# [HEADLINE]

[LEAD PARAGRAPH - Who, what, when, where, why, how]

## Key Facts

- [Key fact 1]
- [Key fact 2]
- [Key fact 3]

[CONTEXT/BACKGROUND PARAGRAPH]

"[QUOTE from relevant source]," said [Name, title/role].

[ADDITIONAL DETAILS PARAGRAPH]

[OPPOSING OR ALTERNATIVE VIEWPOINT PARAGRAPH]

"[QUOTE from different perspective]," said [Name, title/role].

[CONCLUSION - What happens next or why it matters]

---
**Sources:** [List sources]`
    },
    {
      id: "feature",
      name: "Feature Article",
      description: "An in-depth exploration of a topic, person, or trend with more narrative elements than a news story.",
      wordCountRange: "800-1,500 words",
      sections: [
        {
          name: "Headline",
          description: "Creative and compelling, can be more evocative than news headlines.",
          example: "The Hidden Heroes: Inside the Lives of Emergency Dispatchers",
          tips: [
            "Can be more creative than news headlines",
            "Consider using a colon for a two-part headline",
            "Capture the essence of the story's appeal"
          ]
        },
        {
          name: "Hook/Lede",
          description: "Creative opening that draws readers in, often using scene-setting, anecdote, or surprising fact.",
          example: "At 3:17 a.m., while most of the city sleeps, Maria Sanchez's voice is the first thing people hear on the worst day of their lives.",
          tips: [
            "Start with a compelling scene, anecdote, or character",
            "Create an emotional connection quickly",
            "Make readers curious to learn more"
          ]
        },
        {
          name: "Nut Graph",
          description: "Paragraph that explains what the story is about and why it matters.",
          example: "Emergency dispatchers like Sanchez are the unseen first responders who handle over 240 million 911 calls annually in the U.S., yet they remain among the most overlooked components of emergency services.",
          tips: [
            "Should appear within the first few paragraphs",
            "Explain the significance of the story",
            "Transition from the hook to the body"
          ]
        },
        {
          name: "Background/Context",
          description: "History, trends, or relevant information that readers need to understand the topic.",
          example: "The profession began in the 1960s with the introduction of the 911 system but has evolved dramatically with technology and increasing emergency complexity.",
          tips: [
            "Provide enough context without overwhelming readers",
            "Include surprising or little-known facts",
            "Explain relevant terminology"
          ]
        },
        {
          name: "Main Narrative",
          description: "The body of the article that develops the story through scenes, characters, and information.",
          example: "\"Time slows down when you're taking a call about a child who's not breathing,\" Sanchez says, recalling a particularly difficult call from last December...",
          tips: [
            "Use compelling quotes and detailed scenes",
            "Alternate between narrative and information",
            "Maintain a clear theme throughout"
          ]
        },
        {
          name: "Supporting Evidence",
          description: "Facts, statistics, expert opinions, and research that support your narrative.",
          example: "A 2022 study from the University of Washington found that 24% of emergency dispatchers develop symptoms of PTSD within their first year on the job.",
          tips: [
            "Include diverse sources and perspectives",
            "Present data in accessible ways",
            "Connect evidence back to your main narrative"
          ]
        },
        {
          name: "Conclusion",
          description: "Brings closure to the story, often circling back to the opening or looking toward the future.",
          example: "As the sun rises, Sanchez's shift ends. She'll go home to sleep while the city wakes, invisible to the thousands whose emergencies she managed throughout the night.",
          tips: [
            "Circle back to the beginning for a satisfying structure",
            "End with a powerful quote or image",
            "Leave readers with something to think about"
          ]
        }
      ],
      bestPractices: [
        "Use narrative techniques (character, scene, dialogue) to tell the story",
        "Balance storytelling with factual information",
        "Develop a clear theme or central question",
        "Use descriptive language that engages the senses",
        "Include diverse perspectives and voices",
        "Edit ruthlessly - cut anything that doesn't serve the story"
      ],
      examples: [
        {
          title: "Snow Fall: The Avalanche at Tunnel Creek",
          url: "https://www.nytimes.com/projects/2012/snow-fall/",
          publication: "The New York Times"
        },
        {
          title: "The Really Big One",
          url: "https://www.newyorker.com/magazine/2015/07/20/the-really-big-one",
          publication: "The New Yorker"
        }
      ],
      fullTemplate: `# [CREATIVE HEADLINE]

[HOOK - Compelling anecdote, scene, or surprising fact]

[NUT GRAPH - What this story is about and why it matters]

[BACKGROUND/CONTEXT PARAGRAPH]

## [Subheading for first main section]

[NARRATIVE PARAGRAPH with detail, scene-setting]

"[COMPELLING QUOTE]," said [Name, title/role].

[SUPPORTING FACTS, STATISTICS, EXPERT INFORMATION]

## [Subheading for second main section]

[CONTINUE NARRATIVE with new angle or aspect of story]

[INCLUDE DIFFERENT PERSPECTIVE OR VIEWPOINT]

"[QUOTE from different source]," [Name, title/role] explained.

[ADDITIONAL CONTEXT OR DEVELOPMENT]

## [Subheading for final section]

[BEGIN WRAPPING UP NARRATIVE]

[CIRCLE BACK TO OPENING ANECDOTE OR CHARACTER]

[CLOSING PARAGRAPH with lasting image or forward-looking thought]

---
**Sources:** [List sources]`
    },
    {
      id: "investigative",
      name: "Investigative Report",
      description: "In-depth reporting that uncovers information not readily apparent, often involving systematic research and multiple sources.",
      wordCountRange: "1,500-2,500+ words",
      sections: [
        {
          name: "Headline",
          description: "Clear statement of the investigation's findings or focus.",
          example: "Toxic Emissions from Local Factory Linked to Rising Cancer Rates",
          tips: [
            "Be direct about the main finding",
            "Avoid sensationalizing but don't bury the lede",
            "Consider a two-part headline for complex topics"
          ]
        },
        {
          name: "Executive Summary/Key Findings",
          description: "Brief overview of the main discoveries and why they matter.",
          example: "A six-month investigation by our newspaper has found that emissions from the Westside Chemical Plant contain levels of benzene five times higher than reported to regulators, coinciding with a 40% increase in leukemia cases in surrounding neighborhoods.",
          tips: [
            "Summarize the most important findings upfront",
            "Establish the significance and scope of the investigation",
            "Preview the evidence to come"
          ]
        },
        {
          name: "Introduction/Narrative Hook",
          description: "Human element that illustrates the impact of the issue being investigated.",
          example: "Maria Gonzalez watched three neighbors on her street receive cancer diagnoses within six months. \"Something's wrong in this neighborhood,\" she said. \"And nobody's listening.\"",
          tips: [
            "Use a compelling human story to illustrate the stakes",
            "Connect the individual case to the broader investigation",
            "Build emotional investment before diving into complex details"
          ]
        },
        {
          name: "Methodology",
          description: "Explanation of how the investigation was conducted.",
          example: "To test air quality near the plant, we installed EPA-approved monitors at 12 locations over a four-month period. We also reviewed five years of hospital admission data and interviewed 27 residents, 5 former plant employees, and 8 medical experts.",
          tips: [
            "Be transparent about methods and limitations",
            "Establish credibility through rigorous processes",
            "Explain technical aspects in accessible language"
          ]
        },
        {
          name: "Findings/Evidence",
          description: "Detailed presentation of the investigation's discoveries, organized logically.",
          example: "Our testing revealed benzene levels averaging 5.2 ppm at residential locations within one mile of the plant, compared to the 1.1 ppm reported in the company's mandatory disclosures to the EPA.",
          tips: [
            "Present evidence in a logical progression",
            "Use data visualization for complex information",
            "Connect dots clearly for readers"
          ]
        },
        {
          name: "Human Impact",
          description: "Stories and examples that illustrate the real-world effects.",
          example: "The Jensen family moved into their home just 800 yards from the plant in 2015. Since then, both children have developed respiratory conditions requiring hospitalization, and their medical bills now exceed $40,000 annually.",
          tips: [
            "Include diverse perspectives from affected people",
            "Use specific details rather than generalizations",
            "Balance emotional impact with factual reporting"
          ]
        },
        {
          name: "Institutional Response",
          description: "How authorities, companies, or organizations have responded to the issues.",
          example: "When presented with our findings, Westside Chemical spokesperson James Smith denied any connection to health issues, stating that the company \"meets or exceeds all regulatory requirements.\" Internal emails obtained through FOIA requests, however, show executives discussing the need to \"manage the emissions data carefully.\"",
          tips: [
            "Always seek comment from all parties implicated",
            "Present responses fairly even if contradicted by evidence",
            "Document any refusals to comment or participate"
          ]
        },
        {
          name: "Conclusion/Implications",
          description: "Synthesis of findings and what they mean for the future.",
          example: "With regulatory oversight failing and community health risks mounting, the situation at Westside Chemical represents a systemic failure that extends beyond one company or neighborhood.",
          tips: [
            "Avoid opinion while still drawing clear conclusions",
            "Identify broader patterns or systemic issues",
            "Consider what needs to happen next"
          ]
        }
      ],
      bestPractices: [
        "Verify every fact with multiple sources when possible",
        "Document your methodology thoroughly",
        "Provide context for complex issues",
        "Balance statistical evidence with human stories",
        "Present contrary evidence fairly",
        "Be transparent about limitations in your investigation",
        "Protect vulnerable sources appropriately"
      ],
      examples: [
        {
          title: "Dollars for Docs",
          url: "https://projects.propublica.org/docdollars/",
          publication: "ProPublica"
        },
        {
          title: "Poisoned Ground",
          url: "https://www.usatoday.com/pages/interactives/poisoned-ground/",
          publication: "USA Today"
        }
      ],
      fullTemplate: `# [HEADLINE STATING KEY FINDING]

## Executive Summary

[BRIEF OVERVIEW OF INVESTIGATION AND KEY FINDINGS]

[NARRATIVE HOOK - HUMAN STORY ILLUSTRATING THE ISSUE]

### Investigation Methodology

[EXPLANATION OF HOW INVESTIGATION WAS CONDUCTED AND SOURCES USED]

## Key Findings

1. [FIRST MAJOR FINDING WITH SUPPORTING EVIDENCE]

2. [SECOND MAJOR FINDING WITH SUPPORTING EVIDENCE]

3. [THIRD MAJOR FINDING WITH SUPPORTING EVIDENCE]

## The Human Cost

[STORIES OF THOSE AFFECTED BY THE ISSUE]

"[QUOTE FROM AFFECTED PERSON]," said [Name].

## Institutional Response

[HOW RELEVANT AUTHORITIES OR ORGANIZATIONS HAVE RESPONDED]

"[QUOTE FROM OFFICIAL OR REPRESENTATIVE]," said [Name, title].

[EVIDENCE THAT CONTRADICTS OR SUPPORTS OFFICIAL RESPONSE]

## Systemic Issues

[BROADER CONTEXT AND PATTERNS REVEALED BY INVESTIGATION]

## Conclusion

[SYNTHESIS OF FINDINGS AND IMPLICATIONS]

---
**Investigation Team:** [Names]
**Sources:** [List key sources]
**Documents:** [Reference key documents]`
    },
    {
      id: "explainer",
      name: "Explainer",
      description: "A piece that breaks down complex topics into understandable components, answering key questions for readers.",
      wordCountRange: "800-1,200 words",
      sections: [
        {
          name: "Headline",
          description: "Clear statement of what's being explained, often in question format.",
          example: "What Is Quantum Computing and Why Does It Matter?",
          tips: [
            "Be direct about the topic being explained",
            "Consider using a question format",
            "Avoid jargon in the headline"
          ]
        },
        {
          name: "Introduction",
          description: "Brief overview of the topic and why readers should care.",
          example: "Quantum computing might sound like science fiction, but this emerging technology could revolutionize everything from medicine to cybersecurity within the next decade.",
          tips: [
            "Establish relevance quickly",
            "Address reader's likely knowledge level",
            "Preview key points to come"
          ]
        },
        {
          name: "Core Concept Definition",
          description: "Clear explanation of the fundamental idea being explained.",
          example: "Unlike traditional computers that use bits (0s and 1s), quantum computers use quantum bits or 'qubits' that can exist in multiple states simultaneously, allowing them to process complex problems differently.",
          tips: [
            "Use plain language for complex concepts",
            "Define all technical terms",
            "Use analogies for abstract concepts"
          ]
        },
        {
          name: "Historical Context",
          description: "Brief background on how the topic developed.",
          example: "The concept of quantum computing was first proposed by physicist Richard Feynman in 1982, but practical development only began in earnest in the late 1990s.",
          tips: [
            "Keep historical context brief and relevant",
            "Focus on pivotal developments",
            "Connect past to present understanding"
          ]
        },
        {
          name: "Key Components",
          description: "Breakdown of the main elements that readers need to understand.",
          example: "Three principles make quantum computing possible: superposition (existing in multiple states), entanglement (particles linked across distance), and interference (manipulating probabilities).",
          tips: [
            "Break complex topics into digestible parts",
            "Use numbered lists or subheadings",
            "Explain each component clearly before moving on"
          ]
        },
        {
          name: "Real-World Applications",
          description: "Examples of how the concept applies in practical terms.",
          example: "In pharmaceuticals, quantum computers could simulate molecular structures to develop new medicines in days rather than years. In finance, they could optimize trading strategies across countless variables simultaneously.",
          tips: [
            "Use concrete examples relevant to readers",
            "Connect abstract concepts to daily life",
            "Include diverse applications across fields"
          ]
        },
        {
          name: "Common Misconceptions",
          description: "Clarification of frequently misunderstood aspects.",
          example: "Contrary to popular belief, quantum computers won't replace regular computers for most tasks. They excel at specific problems like factoring large numbers, but are inefficient for everyday computing needs.",
          tips: [
            "Address widespread misunderstandings directly",
            "Explain the origin of misconceptions when relevant",
            "Provide the correct information clearly"
          ]
        },
        {
          name: "Future Implications",
          description: "How the topic might develop or impact society going forward.",
          example: "As quantum computers grow more powerful, they could break current encryption methods, necessitating new cybersecurity approaches. This has prompted governments worldwide to invest in 'quantum-safe' encryption standards.",
          tips: [
            "Distinguish between near-term and long-term implications",
            "Acknowledge uncertainty where appropriate",
            "Include diverse expert perspectives"
          ]
        }
      ],
      bestPractices: [
        "Start with what readers already know and build from there",
        "Use plain language whenever possible",
        "Define all technical terms when first used",
        "Use helpful metaphors and analogies",
        "Include visualizations for complex concepts",
        "Break information into digestible chunks",
        "Answer the questions readers are most likely to have"
      ],
      examples: [
        {
          title: "The Coronavirus, Explained",
          url: "https://www.vox.com/coronavirus-covid19",
          publication: "Vox"
        },
        {
          title: "What is climate change? A really simple guide",
          url: "https://www.bbc.com/news/science-environment-24021772",
          publication: "BBC"
        }
      ],
      fullTemplate: `# [CLEAR QUESTION OR STATEMENT HEADLINE]

[INTRODUCTION - Why this topic matters and brief overview]

## What is [Topic]?

[CORE DEFINITION in plain language]

[ANALOGY or COMPARISON to something familiar]

## Brief History

[RELEVANT HISTORICAL CONTEXT in 1-2 paragraphs]

## Key Components of [Topic]

### 1. [First Key Component]
[EXPLANATION with examples]

### 2. [Second Key Component]
[EXPLANATION with examples]

### 3. [Third Key Component]
[EXPLANATION with examples]

## How [Topic] Works in Real Life

[PRACTICAL APPLICATIONS and examples]

[VISUAL REPRESENTATION or diagram would appear here]

## Common Misconceptions

1. **Myth:** [Common misconception]
   **Reality:** [Accurate explanation]

2. **Myth:** [Common misconception]
   **Reality:** [Accurate explanation]

## Why [Topic] Matters

[RELEVANCE to readers' lives]

[FUTURE IMPLICATIONS and developments]

## Further Reading

[RESOURCES for more information]

---
**Expert Contributors:** [Names and credentials]`
    }
  ];
  
  // Find currently selected template
  const selectedTemplate = templates.find(template => template.id === selectedTemplateId) || templates[0];
  
  // Handle applying a template to the main editor
  const handleApplyTemplate = () => {
    if (showCustomEditor && customTemplate) {
      onApplyTemplate(customTemplate);
      toast({
        title: "Custom template applied",
        description: "Your custom template has been applied to the editor."
      });
    } else {
      onApplyTemplate(selectedTemplate.fullTemplate);
      toast({
        title: "Template applied",
        description: `The ${selectedTemplate.name} template has been applied to the editor.`
      });
    }
  };
  
  // Copy section example to clipboard
  const handleCopySection = (text: string, sectionName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionName);
    
    toast({
      title: "Copied to clipboard",
      description: `${sectionName} example copied to clipboard.`
    });
    
    setTimeout(() => {
      setCopiedSection(null);
    }, 2000);
  };
  
  // Handle copying the full template
  const handleCopyFullTemplate = () => {
    navigator.clipboard.writeText(selectedTemplate.fullTemplate);
    
    toast({
      title: "Full template copied",
      description: `The ${selectedTemplate.name} template has been copied to clipboard.`
    });
  };
  
  return (
    <Card className="w-full mt-4">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Layout className="h-5 w-5 text-muted-foreground" />
          Article Structure Editor
        </CardTitle>
        <CardDescription>
          Templates and guidelines for different journalistic formats.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="templates" className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="templates">Article Templates</TabsTrigger>
            <TabsTrigger value="custom">Custom Template</TabsTrigger>
          </TabsList>
          
          <TabsContent value="templates" className="space-y-4">
            <div className="flex items-center gap-2 mt-4">
              <Label htmlFor="template-select" className="min-w-[120px]">
                Select Format:
              </Label>
              <Select
                value={selectedTemplateId}
                onValueChange={setSelectedTemplateId}
              >
                <SelectTrigger id="template-select" className="w-full">
                  <SelectValue placeholder="Select a format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Article Types</SelectLabel>
                    {templates.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name} ({template.wordCountRange})
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            
            <div className="border rounded-md p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{selectedTemplate.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedTemplate.description}
                  </p>
                  <p className="text-xs mt-1">
                    Recommended length: <strong>{selectedTemplate.wordCountRange}</strong>
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={handleCopyFullTemplate}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy Template
                  </Button>
                  <Button
                    size="sm"
                    className="gap-1"
                    onClick={handleApplyTemplate}
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Apply Template
                  </Button>
                </div>
              </div>
              
              <Accordion type="single" collapsible className="w-full mt-4">
                <AccordionItem value="sections">
                  <AccordionTrigger>
                    <span className="flex items-center gap-2">
                      <List className="h-4 w-4" />
                      Article Sections
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 mt-2">
                      {selectedTemplate.sections.map((section, index) => (
                        <div key={index} className="border rounded-md p-3">
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium text-sm">{section.name}</h4>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => handleCopySection(section.example, section.name)}
                                  >
                                    {copiedSection === section.name ? (
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                    ) : (
                                      <Copy className="h-4 w-4" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  Copy example to clipboard
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mt-1">
                            {section.description}
                          </p>
                          
                          <div className="mt-2 bg-muted p-2 rounded-md text-sm">
                            <strong>Example:</strong> {section.example}
                          </div>
                          
                          <div className="mt-2">
                            <h5 className="text-xs font-medium flex items-center gap-1">
                              <HelpCircle className="h-3 w-3" />
                              Tips:
                            </h5>
                            <ul className="mt-1 text-xs space-y-1">
                              {section.tips.map((tip, tipIndex) => (
                                <li key={tipIndex} className="flex items-start gap-1">
                                  <span className="text-muted-foreground pt-0.5">•</span>
                                  <span>{tip}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="best-practices">
                  <AccordionTrigger>
                    <span className="flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Best Practices
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-2 mt-2">
                      {selectedTemplate.bestPractices.map((practice, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-muted-foreground pt-1">•</span>
                          <span>{practice}</span>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="examples">
                  <AccordionTrigger>
                    <span className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4" />
                      Example Articles
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-2 mt-2">
                      {selectedTemplate.examples.map((example, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <ExternalLink className="h-4 w-4 mt-0.5 text-muted-foreground" />
                          <div>
                            <a 
                              href={example.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              {example.title}
                            </a>
                            {example.publication && (
                              <span className="text-sm text-muted-foreground ml-1">
                                ({example.publication})
                              </span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="full-template">
                  <AccordionTrigger>
                    <span className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Full Template
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="border rounded-md p-3 mt-2">
                      <pre className="whitespace-pre-wrap text-sm font-mono overflow-auto max-h-[400px]">
                        {selectedTemplate.fullTemplate}
                      </pre>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </TabsContent>
          
          <TabsContent value="custom" className="space-y-4">
            <div className="border rounded-md p-4">
              <h3 className="text-md font-semibold mb-2">Create Custom Template</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Design your own article structure using Markdown formatting.
              </p>
              
              <Textarea
                value={customTemplate}
                onChange={(e) => setCustomTemplate(e.target.value)}
                placeholder="# [HEADLINE]

[Introduction paragraph]

## Key Points

- [Point 1]
- [Point 2]
- [Point 3]

## Section 1

[Content for section 1]

## Section 2

[Content for section 2]

---
**Sources:** [List sources]"
                className="min-h-[300px] font-mono text-sm"
              />
              
              <div className="flex justify-end mt-4">
                <Button
                  onClick={handleApplyTemplate}
                  disabled={!customTemplate.trim()}
                  className="gap-1"
                >
                  <FileText className="h-4 w-4" />
                  Apply Custom Template
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="border-t pt-4 flex justify-between">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
          <p className="text-xs text-muted-foreground">
            These templates are starting points. Adapt them to fit your specific story and publication's style.
          </p>
        </div>
      </CardFooter>
    </Card>
  );
} 