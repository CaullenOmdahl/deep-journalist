/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import dynamic from "next/dynamic";
import { useState, useEffect, useLayoutEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  LoaderCircle,
  CircleCheck,
  TextSearch,
  Download,
  Trash,
  FileText,
  Link2,
  Box,
  CalendarDays,
  Search
} from "lucide-react";
import { Crepe } from "@milkdown/crepe";
import { replaceAll, getHTML } from "@milkdown/kit/utils";
import { Button } from "@/components/Button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import useAccurateTimer from "@/hooks/useAccurateTimer";
import useDeepResearch from "@/hooks/useDeepResearch";
import { useTaskStore } from "@/store/task";
import { downloadFile } from "@/utils/file";
import SourceCredibilityIndicator from "./SourceCredibilityIndicator";
import SourcesPanel from "./SourcesPanel";
import SourceValidator from "./SourceValidator";
import TimelineVisualizer from "./TimelineVisualizer";
import { assessDomainReputation } from "@/utils/domain-reputation";
import { extractDomainFromUrl } from "@/utils/url-extractor";
import { cn } from "@/lib/utils";

const MilkdownEditor = dynamic(() => import("@/components/MilkdownEditor"));

const formSchema = z.object({
  suggestion: z.string(),
});

function TaskState({ state }: { state: SearchTask["state"] }) {
  if (state === "completed") {
    return <CircleCheck className="h-5 w-5" />;
  } else if (state === "processing") {
    return <LoaderCircle className="animate-spin h-5 w-5" />;
  } else {
    return <TextSearch className="h-5 w-5" />;
  }
}

function ResearchGoal({
  milkdownEditor,
  goal,
}: {
  milkdownEditor?: Crepe;
  goal: string;
}) {
  const [html, setHtml] = useState<string>("");

  useEffect(() => {
    if (milkdownEditor && goal) {
      replaceAll(goal)(milkdownEditor.editor.ctx);
      const html = getHTML()(milkdownEditor.editor.ctx);
      setHtml(html);
    }
  }, [milkdownEditor, goal]);

  return html !== "" ? (
    <blockquote className="hidden-empty-p">
      <div
        dangerouslySetInnerHTML={{
          __html: html,
        }}
      ></div>
    </blockquote>
  ) : null;
}

function SearchResult() {
  const { t } = useTranslation();
  const taskStore = useTaskStore();
  const { status, runSearchTask, reviewSearchResult, writeFinalReport } =
    useDeepResearch();
  const {
    formattedTime,
    start: accurateTimerStart,
    stop: accurateTimerStop,
  } = useAccurateTimer();
  const [milkdownEditor, setMilkdownEditor] = useState<Crepe>();
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [isWriting, setIsWriting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"search" | "sources" | "timeline">("search");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      suggestion: taskStore.suggestion,
    },
  });

  useEffect(() => {
    form.setValue("suggestion", taskStore.suggestion);
  }, [taskStore.suggestion, form]);

  async function handleWriteFinalReport() {
    try {
      accurateTimerStart();
      setIsWriting(true);
      await writeFinalReport();
    } finally {
      setIsWriting(false);
      accurateTimerStop();
    }
  }

  function getSearchResultContent(item: SearchTask) {
    return [
      `> ${item.researchGoal}\n---`,
      item.learning,
      item.sources?.length > 0
        ? `#### ${t("research.common.sources")}\n\n${item.sources
            .map((source) => {
              const credibility = source.credibilityScore 
                ? ` (Credibility: ${source.credibilityScore}/10)` 
                : '';
              const sourceType = source.sourceType 
                ? ` [${source.sourceType}]` 
                : '';
              return `- [${source.title || source.url}](${source.url})${sourceType}${credibility}`;
            })
            .join("\n")}`
        : "",
    ].join("\n\n");
  }

  async function handleSubmit(values: z.infer<typeof formSchema>) {
    const { setSuggestion, tasks } = useTaskStore.getState();
    const unfinishedTasks = tasks.filter((task) => task.state !== "completed");
    try {
      accurateTimerStart();
      setIsThinking(true);
      if (unfinishedTasks.length > 0) {
        await runSearchTask(unfinishedTasks);
      } else {
        setSuggestion(values.suggestion);
        await reviewSearchResult();
        // Clear previous research suggestions
        setSuggestion("");
      }
    } finally {
      setIsThinking(false);
      accurateTimerStop();
    }
  }

  function handleRemove(query: string) {
    const { removeTask } = useTaskStore.getState();
    removeTask(query);
  }
  
  function handleRemoveSource(id: string) {
    const { tasks, updateTask } = useTaskStore.getState();
    
    // Find which task contains this source
    for (const task of tasks) {
      if (task.sources) {
        const sourceIndex = task.sources.findIndex(source => source.id === id);
        if (sourceIndex >= 0) {
          const updatedSources = [...task.sources];
          updatedSources.splice(sourceIndex, 1);
          updateTask(task.query, { sources: updatedSources });
          break;
        }
      }
    }
  }
  
  function handleUpdateSourceCategory(id: string, category: string) {
    const { tasks, updateTask } = useTaskStore.getState();
    
    // Find which task contains this source
    for (const task of tasks) {
      if (task.sources) {
        const sourceIndex = task.sources.findIndex(source => source.id === id);
        if (sourceIndex >= 0) {
          const updatedSources = [...task.sources];
          updatedSources[sourceIndex] = {
            ...updatedSources[sourceIndex],
            sourceType: category as Source["sourceType"]
          };
          updateTask(task.query, { sources: updatedSources });
          break;
        }
      }
    }
  }

  // Get all sources from all tasks
  const allSources = taskStore.tasks.reduce((acc, task) => {
    console.log("Task with sources:", task.query, "has sources:", task.sources ? task.sources.length : 0);
    
    if (task.sources && task.sources.length > 0) {
      // Enhance sources with missing properties from domain reputation
      const enhancedSources = task.sources.map(source => {
        if (!source.credibilityScore || !source.biasAssessment || !source.sourceType) {
          const domain = extractDomainFromUrl(source.url);
          const assessment = assessDomainReputation(domain);
          
          return {
            ...source,
            credibilityScore: source.credibilityScore || assessment.score,
            biasAssessment: source.biasAssessment || assessment.bias,
            sourceType: source.sourceType || assessment.type
          };
        }
        return source;
      });
      
      return [...acc, ...enhancedSources];
    }
    return acc;
  }, [] as Source[]);
  
  // Add debug logging for sources panel
  console.log("All sources for sources panel:", allSources);
  console.log("Total sources count:", allSources.length);

  useLayoutEffect(() => {
    const crepe = new Crepe({
      defaultValue: "",
      root: document.createDocumentFragment(),
      features: {
        [Crepe.Feature.ImageBlock]: false,
        [Crepe.Feature.BlockEdit]: false,
        [Crepe.Feature.Toolbar]: false,
        [Crepe.Feature.LinkTooltip]: false,
      },
    });

    crepe
      .setReadonly(true)
      .create()
      .then(() => {
        setMilkdownEditor(crepe);
      });

    return () => {
      crepe.destroy();
    };
  }, []);

  return (
    <section className="p-4 border rounded-md mt-4 print:hidden">
      <div className="flex justify-between items-center border-b mb-4">
        <h3 className="font-semibold text-lg leading-10">
          {t("research.searchResult.title")}
        </h3>
        
        <Tabs 
          value={activeTab} 
          onValueChange={(value: string) => setActiveTab(value as "search" | "sources" | "timeline")}
          className="w-[550px]"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="search" className="flex items-center gap-1">
              <Box className="h-4 w-4" />
              Search Results
            </TabsTrigger>
            <TabsTrigger value="sources" className="flex items-center gap-1">
              <Link2 className="h-4 w-4" />
              Sources Panel
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center gap-1">
              <CalendarDays className="h-4 w-4" />
              Timeline
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {taskStore.tasks.length === 0 ? (
        <div>{t("research.searchResult.emptyTip")}</div>
      ) : (
        <div>
          <Tabs value={activeTab}>
            <TabsContent value="search" className="mt-0">
              <Accordion className="mb-4" type="multiple">
                {taskStore.tasks.map((item, idx) => {
                  return (
                    <AccordionItem key={idx} value={item.query}>
                      <AccordionTrigger>
                        <div className="flex">
                          <TaskState state={item.state} />
                          <span className="ml-1">{item.query}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="prose prose-slate dark:prose-invert max-w-full min-h-20">
                        <ResearchGoal
                          milkdownEditor={milkdownEditor}
                          goal={item.researchGoal}
                        />
                        <div className="my-2">
                          <MilkdownEditor
                            value={item.learning}
                            onChange={(value) =>
                              taskStore.updateTask(item.query, { learning: value })
                            }
                          />
                        </div>

                        {item.sources?.length > 0 && (
                          <div className="mt-4">
                            <h4 className="mb-2 text-base font-medium">
                              {t("research.common.sources")}
                            </h4>
                            <div className="space-y-3">
                              {item.sources.map((source, idx) => (
                                <div key={idx} className="border rounded-md overflow-hidden">
                                  <div className="grid grid-cols-[1fr,auto] gap-2">
                                    <div className="p-3">
                                      <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                        <a
                                          href={source.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                                        >
                                          {source.title || source.url}
                                        </a>
                                        {source.sourceType && (
                                          <Badge variant="outline" className="text-xs">
                                            {source.sourceType}
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-3">
                                        {source.publicationDate && (
                                          <span>
                                            Published: {source.publicationDate}
                                          </span>
                                        )}
                                        {source.authorName && (
                                          <span>
                                            Author: {source.authorName}
                                          </span>
                                        )}
                                        {source.publisherName && (
                                          <span>
                                            Publisher: {source.publisherName}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="w-52 border-l">
                                      <SourceValidator 
                                        url={source.url} 
                                        title={source.title}
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="mt-4 flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              downloadFile(
                                getSearchResultContent(item),
                                `${item.query.slice(0, 20)}.md`,
                                "text/markdown;charset=utf-8"
                              )
                            }
                          >
                            <Download className="mr-1 h-4 w-4" />
                            {t("editor.export")}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleRemove(item.query)}
                          >
                            <Trash className="mr-1 h-4 w-4" />
                            {t("research.common.delete")}
                          </Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)}>
                  <FormField
                    control={form.control}
                    name="suggestion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="mb-2 font-semibold">
                          {t("research.searchResult.suggestionLabel")}
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            rows={3}
                            placeholder={t(
                              "research.searchResult.suggestionPlaceholder"
                            )}
                            disabled={isThinking}
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4 max-sm:gap-2 w-full mt-4">
                    <Button type="submit" variant="secondary" disabled={isThinking}>
                      {isThinking ? (
                        <>
                          <LoaderCircle className="animate-spin" />
                          <span>{status}</span>
                          <small className="font-mono">{formattedTime}</small>
                        </>
                      ) : (
                        t("research.common.continueResearch")
                      )}
                    </Button>
                    <Button
                      disabled={isWriting}
                      onClick={() => handleWriteFinalReport()}
                    >
                      {isWriting ? (
                        <>
                          <LoaderCircle className="animate-spin" />
                          <span>{status}</span>
                          <small className="font-mono">{formattedTime}</small>
                        </>
                      ) : (
                        t("research.common.writeReport")
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </TabsContent>
            
            <TabsContent value="sources">
              <div className="space-y-4">
                <SourcesPanel 
                  sources={allSources}
                  onRemoveSource={handleRemoveSource}
                  onUpdateSourceCategory={handleUpdateSourceCategory}
                />
                
                {allSources.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No sources found. Start your research to discover and analyze sources.
                  </div>
                )}
                
                <div className="grid grid-cols-1 gap-4 max-sm:gap-2 w-full mt-4">
                  <Button
                    disabled={isWriting}
                    onClick={() => handleWriteFinalReport()}
                  >
                    {isWriting ? (
                      <>
                        <LoaderCircle className="animate-spin" />
                        <span>{status}</span>
                        <small className="font-mono">{formattedTime}</small>
                      </>
                    ) : (
                      t("research.common.writeReport")
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="timeline">
              <div className="space-y-4">
                <TimelineVisualizer 
                  sources={allSources}
                  mainContent={taskStore.finalReport}
                />
                
                {allSources.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No sources found. Start your research to generate a timeline.
                  </div>
                )}
                
                <div className="grid grid-cols-1 gap-4 max-sm:gap-2 w-full mt-4">
                  <Button
                    disabled={isWriting}
                    onClick={() => handleWriteFinalReport()}
                  >
                    {isWriting ? (
                      <>
                        <LoaderCircle className="animate-spin" />
                        <span>{status}</span>
                        <small className="font-mono">{formattedTime}</small>
                      </>
                    ) : (
                      t("research.common.writeReport")
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </section>
  );
}

export default SearchResult;
