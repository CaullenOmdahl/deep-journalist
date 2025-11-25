"use client";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { LoaderCircle, SquarePlus, Link as LinkIcon, AlignLeft, Info } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/Button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue, 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import useDeepResearch from "@/hooks/useDeepResearch";
import { useGlobalStore } from "@/store/global";
import { useSettingStore } from "@/store/setting";
import { useTaskStore } from "@/store/task";
import { useHistoryStore } from "@/store/history";
import { extractUrlContentFromServer, isPotentialPaywallSite } from "@/utils/url-extractor";

interface ExtractedContent {
  title: string;
  author?: string;
  publishedDate?: string;
  content: string;
  siteName?: string;
  url: string;
  excerpt?: string;
  imageUrl?: string;
  failureReason?: string;
}

const formSchema = z.object({
  inputType: z.enum(["url", "summary"]),
  sourceUrl: z.string().url().optional().or(z.literal("")),
  eventSummary: z.string().min(2).optional(),
  timeframe: z.string().default("week"),
  geo: z.string().default("global"),
});

function Topic() {
  const { t } = useTranslation();
  const { askQuestions } = useDeepResearch();
  const taskStore = useTaskStore();
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"url" | "summary">("summary");
  const [extractedContent, setExtractedContent] = useState<ExtractedContent | null>(null);
  const [extractionError, setExtractionError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      inputType: "summary",
      sourceUrl: "",
      eventSummary: taskStore.question,
      timeframe: "week",
      geo: "global",
    },
  });

  const watchInputType = form.watch("inputType");
  const watchSourceUrl = form.watch("sourceUrl");

  useEffect(() => {
    setActiveTab(watchInputType);
  }, [watchInputType]);

  useEffect(() => {
    if (taskStore.question) {
      form.setValue("eventSummary", taskStore.question);
    }
  }, [taskStore.question, form]);

  // Clear extracted content when URL changes
  useEffect(() => {
    if (watchSourceUrl !== extractedContent?.url) {
      setExtractedContent(null);
      setExtractionError(null);
    }
  }, [watchSourceUrl, extractedContent?.url]);

  async function handleExtractUrl() {
    const url = form.getValues("sourceUrl");
    
    if (!url) {
      form.setError("sourceUrl", { message: "Please enter a valid URL" });
      return;
    }

    setIsExtracting(true);
    setExtractionError(null);
    
    try {
      const content = await extractUrlContentFromServer(url);
      
      if (content.failureReason) {
        setExtractionError(content.failureReason);
        return;
      }
      
      setExtractedContent(content);
      
      // If we successfully extract content, update the event summary with the article content
      if (content.title && content.content) {
        const summary = `${content.title}${content.author ? ` by ${content.author}` : ''}${content.publishedDate ? ` (${content.publishedDate})` : ''}\n\n${content.content}`;
        form.setValue("eventSummary", summary);
      }
      
      toast.success("Article content extracted successfully");
    } catch (error) {
      console.error("Error extracting URL content:", error);
      setExtractionError(error instanceof Error ? error.message : "Failed to extract content");
      toast.error("Failed to extract article content");
    } finally {
      setIsExtracting(false);
    }
  }

  async function handleSubmit(values: z.infer<typeof formSchema>) {
    const { apiKey, accessPassword } = useSettingStore.getState();

    if (apiKey || accessPassword) {
      if (values.inputType === "url" && !extractedContent) {
        toast.error("Please extract the content from the URL before submitting.");
        return;
      }

      const { id, setQuestion } = useTaskStore.getState();
      setIsThinking(true);
      if (id !== "") {
        createNewResearch();
        if (values.inputType === "url") {
          form.setValue("sourceUrl", values.sourceUrl);
        } else {
          form.setValue("eventSummary", values.eventSummary);
        }
      }

      // If URL is selected but no extraction has been done yet, extract first
      if (values.inputType === "url" && !extractedContent && values.sourceUrl) {
        try {
          await handleExtractUrl();
        } catch (error) {
          console.error("Error extracting URL during submit:", error);
        }
      }

      // Set the question based on input type
      let question;
      if (values.inputType === "url") {
        if (extractedContent?.title) {
          question = `Research about: ${extractedContent.title} [URL: ${values.sourceUrl}] [Time: ${values.timeframe}, Region: ${values.geo}]`;
        } else {
          question = `Research about: ${values.sourceUrl} [Time: ${values.timeframe}, Region: ${values.geo}]`;
        }
      } else {
        question = `${values.eventSummary} [Time: ${values.timeframe}, Region: ${values.geo}]`;
      }

      setQuestion(question);

      try {
        await askQuestions();
      } catch (error) {
        console.error("Error in askQuestions():", error);
      } finally {
        setIsThinking(false);
      }
    } else {
      const { setOpenSetting } = useGlobalStore.getState();
      setOpenSetting(true);
    }
  }

  function createNewResearch() {
    const { id, backup, reset } = useTaskStore.getState();
    const { update } = useHistoryStore.getState();
    if (id) update(id, backup());
    reset();
    form.reset({
      inputType: activeTab,
      sourceUrl: "",
      eventSummary: "",
      timeframe: "week",
      geo: "global",
    });
    setExtractedContent(null);
    setExtractionError(null);
  }

  const isPaywallSite = watchSourceUrl ? isPotentialPaywallSite(watchSourceUrl) : false;

  return (
    <section className="p-4 border rounded-md mt-4 print:hidden">
      <div className="flex justify-between items-center border-b mb-2">
        <h3 className="font-semibold text-lg leading-10">
          {t("research.topic.title")}
        </h3>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => createNewResearch()}
            title={t("research.common.newResearch")}
          >
            <SquarePlus />
          </Button>
        </div>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <FormField
            control={form.control}
            name="inputType"
            render={({ field }) => (
              <FormItem>
                <Tabs 
                  value={activeTab} 
                  onValueChange={(value) => {
                    setActiveTab(value as "url" | "summary");
                    field.onChange(value);
                  }}
                  className="mb-4"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="url" className="flex items-center gap-2">
                      <LinkIcon className="h-4 w-4" />
                      Article URL
                    </TabsTrigger>
                    <TabsTrigger value="summary" className="flex items-center gap-2">
                      <AlignLeft className="h-4 w-4" />
                      Event Summary
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </FormItem>
            )}
          />

          {activeTab === "url" ? (
            <FormField
              control={form.control}
              name="sourceUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="mb-2 font-semibold">
                    Article URL
                  </FormLabel>
                  <FormDescription>
                    Enter a URL to an article you want to research
                  </FormDescription>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        placeholder="https://example.com/article"
                        {...field}
                      />
                    </FormControl>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleExtractUrl}
                      disabled={isExtracting || !form.getValues("sourceUrl")}
                    >
                      {isExtracting ? (
                        <>
                          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                          Extracting...
                        </>
                      ) : (
                        "Extract Content"
                      )}
                    </Button>
                  </div>
                  <FormMessage />
                  
                  {isPaywallSite && (
                    <Alert className="mt-2" variant="warning">
                      <Info className="h-4 w-4" />
                      <AlertTitle>Potential Paywall Detected</AlertTitle>
                      <AlertDescription>
                        The URL appears to be from a site that may have a paywall. Content extraction might be limited.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {extractionError && (
                    <Alert className="mt-2" variant="destructive">
                      <Info className="h-4 w-4" />
                      <AlertTitle>Extraction Failed</AlertTitle>
                      <AlertDescription>
                        {extractionError}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {extractedContent && !extractionError && (
                    <div className="mt-4 border rounded-md p-3">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{extractedContent.title}</h4>
                          {extractedContent.siteName && (
                            <Badge variant="outline">
                              {extractedContent.siteName}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-x-4 text-sm text-muted-foreground">
                          {extractedContent.author && (
                            <span>By: {extractedContent.author}</span>
                          )}
                          {extractedContent.publishedDate && (
                            <span>Published: {extractedContent.publishedDate}</span>
                          )}
                        </div>
                        
                        {extractedContent.excerpt && (
                          <p className="text-sm mt-2 italic">
                            "{extractedContent.excerpt}"
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </FormItem>
              )}
            />
          ) : (
            <FormField
              control={form.control}
              name="eventSummary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="mb-2 font-semibold">
                    Event Summary
                  </FormLabel>
                  <FormDescription>
                    Describe the event or topic you want to investigate
                  </FormDescription>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Describe the event or topic to research..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <div className="grid grid-cols-2 gap-4 mt-4">
            <FormField
              control={form.control}
              name="timeframe"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time Frame</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select time frame" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="day">Past 24 hours</SelectItem>
                      <SelectItem value="week">Past week</SelectItem>
                      <SelectItem value="month">Past month</SelectItem>
                      <SelectItem value="year">Past year</SelectItem>
                      <SelectItem value="all">All time</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="geo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Geographical Focus</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select region" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="global">Global</SelectItem>
                      <SelectItem value="local">Local</SelectItem>
                      <SelectItem value="national">National</SelectItem>
                      <SelectItem value="regional">Regional</SelectItem>
                      <SelectItem value="international">International</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end mt-6">
            <Button
              type="submit"
              disabled={isThinking || isExtracting}
              className="min-w-28"
            >
              {isThinking ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  {t("research.common.thinking")}
                </>
              ) : (
                t("research.common.startResearch")
              )}
            </Button>
          </div>
        </form>
      </Form>
    </section>
  );
}

export default Topic;
