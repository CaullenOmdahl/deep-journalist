import { useState } from "react";
import { streamText, smoothStream } from "ai";
import { parsePartialJson } from "@ai-sdk/ui-utils";
import { useTranslation } from "react-i18next";
import Plimit from "p-limit";
import { toast } from "sonner";
import { useModelProvider } from "@/hooks/useAiProvider";
import { useTaskStore } from "@/store/task";
import { useHistoryStore } from "@/store/history";
import { useSettingStore } from "@/store/setting";
import { useGlobalStore } from "@/store/global";
import logger from "@/utils/logger"; // Import the new logger
import {
  getSystemPrompt,
  getOutputGuidelinesPrompt,
  generateQuestionsPrompt,
  generateSerpQueriesPrompt,
  generateJournalisticQueriesPrompt,
  processSearchResultPrompt,
  processJournalisticSearchResultPrompt,
  reviewSerpQueriesPrompt,
  writeFinalReportPrompt,
  writeJournalisticArticlePrompt,
  getSERPQuerySchema,
  getSourceSchema,
} from "@/utils/deep-research";
import { parseError } from "@/utils/error";
import { pick, flat } from "radash";
import rateLimiter from "@/utils/rate-limiter";

function getResponseLanguagePrompt(lang: string) {
  return `**Respond in ${lang}**`;
}

function removeJsonMarkdown(text: string) {
  text = text.trim();
  if (text.startsWith("```json")) {
    text = text.slice(7);
  } else if (text.startsWith("json")) {
    text = text.slice(4);
  } else if (text.startsWith("```")) {
    text = text.slice(3);
  }
  if (text.endsWith("```")) {
    text = text.slice(0, -3);
  }
  return text.trim();
}

function handleError(error: unknown) {
  const errorMessage = parseError(error);
  toast.error(errorMessage);
}

// Check if error is a rate limit error
function isRateLimitError(error: unknown): boolean {
  if (!error) return false;
  
  if (typeof error === 'object') {
    const err = error as any;
    
    // Check for common rate limit indicators
    if (err.code === 429 || err.status === 429) return true;
    if (err.code === 503 || err.status === 503) return true;
    
    if (err.error && typeof err.error === 'object') {
      if (err.error.code === 429 || err.error.status === 429) return true;
      if (err.error.code === 503 || err.error.status === 503) return true;
    }
    
    // Check message content
    const message = err.message || err.error?.message || '';
    if (typeof message === 'string') {
      if (
        message.includes('rate limit') || 
        message.includes('too many requests') ||
        message.includes('overloaded') ||
        message.includes('quota exceeded')
      ) {
        return true;
      }
    }
  }
  
  return false;
}

function useDeepResearch() {
  const { t } = useTranslation();
  const taskStore = useTaskStore();
  const { createProvider } = useModelProvider();
  const [status, setStatus] = useState<string>("");

  // Check for model cooldown and display message if needed
  const checkModelCooldown = (model: string): boolean => {
    if (rateLimiter.isInCooldown(model)) {
      const remainingSeconds = rateLimiter.getCooldownTimeRemaining(model);
      toast.error(
        `Model ${model} is cooling down. Please wait ${remainingSeconds} seconds before trying again.`
      );
      return true;
    }
    return false;
  };

  // Check for API key and provide appropriate guidance
  function checkApiConfiguration(): boolean {
    const { apiKey, accessPassword } = useSettingStore.getState();
    
    if (!apiKey && !accessPassword) {
      logger.error("Missing API key - opening settings dialog");
      toast.error("Please add your Google Gemini API key in settings to start research", { duration: 5000 });
      const { setOpenSetting } = useGlobalStore.getState();
      setOpenSetting(true);
      return false;
    }
    
    return true;
  }

  async function askQuestions() {
    logger.info("askQuestions() function called");
    
    // Check if API key is configured
    if (!checkApiConfiguration()) {
      return;
    }
    
    const { thinkingModel, language } = useSettingStore.getState();
    logger.info("Settings retrieved - thinkingModel:", thinkingModel, "language:", language);
    
    const { question } = useTaskStore.getState();
    logger.info("Question from taskStore:", question);
    
    // Check if model is in cooldown
    if (checkModelCooldown(thinkingModel)) {
      logger.error("Model is in cooldown period, aborting askQuestions");
      return;
    }
    
    setStatus(t("research.common.thinking"));
    const provider = createProvider("google");
    logger.info("AI provider created for model:", thinkingModel);
    
    try {
      logger.info("Tracking request to model:", thinkingModel);
      // Track the request
      rateLimiter.trackRequest(thinkingModel);
      
      logger.info("Preparing to stream text with prompt based on question:", question);
      const result = streamText({
        model: provider(thinkingModel),
        system: getSystemPrompt(),
        prompt: [
          generateQuestionsPrompt(question),
          getResponseLanguagePrompt(language),
        ].join("\n\n"),
        experimental_transform: smoothStream(),
        onError: (error) => {
          logger.error("Error in streamText during askQuestions:", error);
          if (isRateLimitError(error)) {
            logger.info("Rate limit error detected, handling rate limit");
            rateLimiter.handleRateLimitError(thinkingModel, error);
          } else {
            handleError(error);
          }
        },
      });
      
      let content = "";
      logger.info("Setting question in taskStore");
      taskStore.setQuestion(question);
      
      logger.info("Starting to process text stream");
      for await (const textPart of result.textStream) {
        content += textPart;
        taskStore.updateQuestions(content);
      }
      logger.info("Finished processing text stream, final content length:", content.length);
      
    } catch (error) {
      logger.error("Error in askQuestions:", error);
      if (isRateLimitError(error)) {
        rateLimiter.handleRateLimitError(thinkingModel, error);
      } else {
        handleError(error);
      }
    }
  }

  async function runSearchTask(queries: SearchTask[]) {
    const { language } = useSettingStore.getState();
    setStatus(t("research.common.research"));
    const plimit = Plimit(1);
    const searchModel = "gemini-2.0-flash-exp";
    
    logger.info("Starting search tasks for queries:", queries.map(q => q.query));
    
    for await (const item of queries) {
      await plimit(async () => {
        // Check if model is in cooldown
        if (checkModelCooldown(searchModel)) {
          taskStore.updateTask(item.query, { state: "unprocessed", learning: "Rate limit exceeded. Try again later." });
          return "";
        }
        
        let content = "";
        const sources: Source[] = [];
        taskStore.updateTask(item.query, { state: "processing" });
        const provider = createProvider("google");
        
        try {
          // Track the request
          rateLimiter.trackRequest(searchModel);
          
          logger.info(`Processing search task: ${item.query}`);
          
          const searchResult = streamText({
            model: provider(searchModel, { useSearchGrounding: true }),
            system: getSystemPrompt(),
            prompt: [
              processJournalisticSearchResultPrompt(item.query, item.researchGoal),
              getResponseLanguagePrompt(language),
            ].join("\n\n"),
            experimental_transform: smoothStream(),
            onError: (error: unknown) => {
              if (isRateLimitError(error)) {
                rateLimiter.handleRateLimitError(searchModel, error);
                taskStore.updateTask(item.query, { state: "unprocessed", learning: "Rate limit exceeded. Will retry automatically." });
              } else {
                handleError(error);
                taskStore.updateTask(item.query, { state: "unprocessed" });
              }
            },
          });
          
          const sourceSchema = getSourceSchema();
          let sourcesData = [];
          
          for await (const part of searchResult.fullStream) {
            if (part.type === "text-delta") {
              content += part.textDelta;
              taskStore.updateTask(item.query, { learning: content });
            } else if (part.type === "reasoning") {
              logger.info("reasoning", part.textDelta);
            } else if (part.type === "source") {
              // Process source with enhanced metadata
              logger.info("Received source:", part.source);
              
              if (!part.source.url) {
                logger.warn("Received source without URL, skipping:", part.source);
                continue;
              }
              
              const enhancedSource: Source = {
                ...part.source,
                sourceType: part.source.sourceType || "secondary", // Default type
                id: `source-${Date.now()}-${sources.length + 1}`
              };
              logger.info("Enhanced source created:", enhancedSource);
              sources.push(enhancedSource);
              logger.info("Sources array now has", sources.length, "sources");
              
              // Parse JSON data from content to extract source metadata if available
              try {
                const sourceData = parsePartialJson(removeJsonMarkdown(content));
                logger.info("Parsed source data:", sourceData);
                if (sourceData.state === "successful-parse" && sourceData.value) {
                  sourcesData = sourceData.value;
                  // Match source metadata with URL
                  const matchingSourceData = sourcesData.find((s: any) => s.url === enhancedSource.url);
                  logger.info("Matching source data found:", matchingSourceData);
                  if (matchingSourceData) {
                    enhancedSource.sourceType = matchingSourceData.sourceType || "secondary";
                    enhancedSource.credibilityScore = matchingSourceData.credibilityScore;
                    enhancedSource.biasAssessment = matchingSourceData.biasAssessment;
                    enhancedSource.publicationDate = matchingSourceData.publicationDate;
                    enhancedSource.authorName = matchingSourceData.authorName;
                    enhancedSource.publisherName = matchingSourceData.publisherName;
                    logger.info("Updated enhanced source with metadata:", enhancedSource);
                  }
                }
              } catch (e) {
                logger.error("Error parsing source metadata:", e);
              }
            }
          }
          
          logger.info(`Task complete: ${item.query}. Found ${sources.length} sources.`);
          
          // Make sure all sources have titles
          const processedSources = sources.map(source => {
            if (!source.title) {
              source.title = source.url;
            }
            return source;
          });
          
          logger.info("Processed sources ready for update:", processedSources);
          taskStore.updateTask(item.query, { state: "completed", sources: processedSources });
          logger.info("Task updated with sources:", item.query);
        } catch (error) {
          if (isRateLimitError(error)) {
            rateLimiter.handleRateLimitError(searchModel, error);
            taskStore.updateTask(item.query, { 
              state: "unprocessed", 
              learning: content || "Rate limit exceeded. Will retry automatically." 
            });
          } else {
            handleError(error);
            taskStore.updateTask(item.query, { state: "unprocessed" });
          }
        }
        
        return content;
      });
    }
    
    logger.info("All search tasks completed");
  }

  async function reviewSearchResult() {
    const { thinkingModel, language } = useSettingStore.getState();
    const { query, tasks, suggestion } = useTaskStore.getState();
    
    // Check if model is in cooldown
    if (checkModelCooldown(thinkingModel)) {
      return;
    }
    
    setStatus(t("research.common.research"));
    const learnings = tasks.map((item) => item.learning);
    const provider = createProvider("google");
    
    try {
      // Track the request
      rateLimiter.trackRequest(thinkingModel);
      
      const result = streamText({
        model: provider(thinkingModel),
        system: getSystemPrompt(),
        prompt: [
          reviewSerpQueriesPrompt(query, learnings, suggestion),
          getResponseLanguagePrompt(language),
        ].join("\n\n"),
        experimental_transform: smoothStream(),
        onError: (error) => {
          if (isRateLimitError(error)) {
            rateLimiter.handleRateLimitError(thinkingModel, error);
          } else {
            handleError(error);
          }
        },
      });

      const querySchema = getSERPQuerySchema();
      let content = "";
      let queries = [];
      for await (const textPart of result.textStream) {
        content += textPart;
        const data: PartialJson = parsePartialJson(removeJsonMarkdown(content));
        if (
          querySchema.safeParse(data.value) &&
          data.state === "successful-parse"
        ) {
          if (data.value) {
            queries = data.value.map(
              (item: { query: string; researchGoal: string }) => ({
                state: "unprocessed",
                learning: "",
                ...pick(item, ["query", "researchGoal"]),
              })
            );
          }
        }
      }
      if (queries.length > 0) {
        taskStore.update([...tasks, ...queries]);
        await runSearchTask(queries);
      }
    } catch (error) {
      if (isRateLimitError(error)) {
        rateLimiter.handleRateLimitError(thinkingModel, error);
      } else {
        handleError(error);
      }
    }
  }

  async function writeFinalReport() {
    const { thinkingModel, language } = useSettingStore.getState();
    const { query, tasks, setId, setTitle, setSources, articleType = "news", finalReport } =
      useTaskStore.getState();
    const { save } = useHistoryStore.getState();
    
    // Check if model is in cooldown
    if (checkModelCooldown(thinkingModel)) {
      return;
    }
    
    let retryCount = 0;
    const maxRetries = 3;
    let content = "";

    // Validate required data
    if (!query) {
      toast.error("No research query found. Please start with a research topic.");
      return;
    }

    if (!tasks || tasks.length === 0) {
      toast.error("No research tasks found. Please conduct some research first.");
      return;
    }

    if (!thinkingModel) {
      toast.error("No AI model selected. Please check your settings.");
      return;
    }

    logger.info("Starting report generation with tasks:", tasks.length);
    
    while (retryCount < maxRetries) {
      try {
        setStatus(t("research.common.writing"));
        const learnings = tasks.map((item) => item.learning);
        const provider = createProvider("google");
        
        // Check if we have an existing template in the finalReport
        // A template would typically start with # [HEADLINE] or similar placeholder format
        const hasTemplate = finalReport && (
          finalReport.includes("[HEADLINE]") || 
          finalReport.includes("[TITLE]") || 
          finalReport.includes("[LEAD") ||
          finalReport.includes("# ") && finalReport.includes("[]")
        );
        
        logger.info("Report generation parameters:", {
          model: thinkingModel,
          articleType,
          tasksCount: tasks.length,
          learningsLength: learnings.join("").length,
          hasTemplate,
          query: query
        });

        // Track the request
        rateLimiter.trackRequest(thinkingModel);

        // Create a prompt that incorporates any existing template
        let prompt;
        if (hasTemplate) {
          prompt = [
            `Based on the following topic, research, and template, write a journalistic ${articleType} article:\n<query>${query}</query>`,
            `Here are all the findings from research:\n<learnings>\n${learnings.join("\n\n")}\n</learnings>`,
            `Use the following article template and REPLACE all placeholders with appropriate content:\n<template>\n${finalReport}\n</template>`,
            `Follow AP Style guidelines and journalistic principles. Ensure the article flows naturally.`,
            getResponseLanguagePrompt(language),
          ].join("\n\n");
        } else {
          prompt = [
            writeJournalisticArticlePrompt(query, learnings, articleType),
            getResponseLanguagePrompt(language),
          ].join("\n\n");
        }

        logger.info("Sending report generation prompt to model");
        
        const result = streamText({
          model: provider(thinkingModel),
          system: [getSystemPrompt(), getOutputGuidelinesPrompt()].join("\n\n"),
          prompt: prompt,
          experimental_transform: smoothStream(),
          onError: (error) => {
            logger.error("Stream error in report generation:", error);
            if (isRateLimitError(error)) {
              rateLimiter.handleRateLimitError(thinkingModel, error);
              toast.error(`Rate limit exceeded. Please try again later.`);
            } else {
              const errorMessage = parseError(error);
              toast.error(`Error generating report: ${errorMessage}`);
            }
          },
        });

        logger.info("Streaming started, awaiting responses...");
        
        // Add a fallback timeout for the generation
        const timeout = setTimeout(() => {
          if (!content) {
            logger.warn("Report generation timed out after 60s with no content");
            // Add minimal report content to avoid complete failure
            const fallbackContent = `# ${query}\n\nUnable to generate a complete report at this time. Please try again later.`;
            content = fallbackContent;
            taskStore.updateFinalReport(fallbackContent);
          }
        }, 60000);
        
        for await (const textPart of result.textStream) {
          content += textPart;
          taskStore.updateFinalReport(content);
          logger.info("Received content chunk, current length:", content.length);
        }
        
        clearTimeout(timeout);
        
        logger.info("Stream completed successfully, final content length:", content.length);

        // If we got here, the stream completed successfully
        break;
      } catch (error) {
        logger.error(`Report generation attempt ${retryCount + 1} failed:`, error);
        
        if (isRateLimitError(error)) {
          rateLimiter.handleRateLimitError(thinkingModel, error);
          // For rate limit errors, we should wait for the cooldown period
          const cooldownTime = rateLimiter.getCooldownTimeRemaining(thinkingModel);
          
          toast.warning(`Rate limit hit. Waiting ${cooldownTime} seconds before retry...`);
          // Wait for the cooldown period before retrying
          await new Promise(resolve => setTimeout(resolve, cooldownTime * 1000));
        }
        
        retryCount++;
        
        if (retryCount === maxRetries) {
          const errorMessage = parseError(error);
          toast.error(`Failed to generate report after ${maxRetries} attempts: ${errorMessage}`);
          
          // Add a fallback report to avoid complete failure
          const fallbackContent = `# ${query}\n\nUnable to generate a full report after multiple attempts.\n\nPlease try again later or check your API settings.`;
          content = fallbackContent;
          taskStore.updateFinalReport(fallbackContent);
        }
        
        toast.warning(`Retrying report generation (attempt ${retryCount + 1}/${maxRetries})...`);
        
        // Only apply exponential backoff for non-rate limit errors
        if (!isRateLimitError(error)) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        }
      }
    }

    if (!content) {
      logger.error("No content was generated after all attempts");
      toast.error("No content was generated. Please try again.");
      
      // Set minimal fallback content
      const fallbackContent = `# ${query}\n\nNo content was generated. Please try again.`;
      taskStore.updateFinalReport(fallbackContent);
      return;
    }

    try {
      // Process the final content
      const title = content
        .split("\n\n")[0]
        .replaceAll("#", "")
        .replaceAll("**", "")
        .trim();
      
      logger.info("Setting report title:", title);
      setTitle(title);
      
      const sources = flat(
        tasks.map((item) => (item.sources ? item.sources : []))
      );
      
      logger.info("Setting sources count:", sources.length);
      setSources(sources);
      
      const id = save(taskStore.backup());
      logger.info("Saving report with ID:", id);
      setId(id);
      
      toast.success("Report generated successfully!");
      return content;
    } catch (error) {
      logger.error("Error processing report:", error);
      const errorMessage = parseError(error);
      toast.error(`Error saving report: ${errorMessage}`);
      throw error;
    }
  }

  async function deepResearch() {
    const { thinkingModel, language } = useSettingStore.getState();
    const { query } = useTaskStore.getState();
    
    // Check if model is in cooldown
    if (checkModelCooldown(thinkingModel)) {
      return;
    }
    
    setStatus(t("research.common.thinking"));
    try {
      let queries = [];
      const provider = createProvider("google");
      
      // Extract input type from query
      const inputType = query.includes("Research about: http") ? "url" : "summary";
      
      // Track the request
      rateLimiter.trackRequest(thinkingModel);
      
      const result = streamText({
        model: provider(thinkingModel),
        system: getSystemPrompt(),
        prompt: [
          generateJournalisticQueriesPrompt(query, inputType),
          getResponseLanguagePrompt(language),
        ].join("\n\n"),
        experimental_transform: smoothStream(),
        onError: (error) => {
          if (isRateLimitError(error)) {
            rateLimiter.handleRateLimitError(thinkingModel, error);
          } else {
            handleError(error);
          }
        },
      });

      const querySchema = getSERPQuerySchema();
      let content = "";
      for await (const textPart of result.textStream) {
        content += textPart;
        const data: PartialJson = parsePartialJson(removeJsonMarkdown(content));
        if (querySchema.safeParse(data.value)) {
          if (
            data.state === "repaired-parse" ||
            data.state === "successful-parse"
          ) {
            if (data.value) {
              queries = data.value.map(
                (item: { query: string; researchGoal: string }) => ({
                  state: "unprocessed",
                  learning: "",
                  ...pick(item, ["query", "researchGoal"]),
                })
              );
              taskStore.update(queries);
            }
          }
        }
      }
      await runSearchTask(queries);
    } catch (error) {
      if (isRateLimitError(error)) {
        rateLimiter.handleRateLimitError(thinkingModel, error);
      } else {
        logger.error(error);
      }
    }
  }

  return {
    status,
    deepResearch,
    askQuestions,
    runSearchTask,
    reviewSearchResult,
    writeFinalReport,
  };
}

export default useDeepResearch;
