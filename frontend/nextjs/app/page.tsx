"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useWebSocket } from '@/hooks/useWebSocket';
import { useResearchHistory } from '@/hooks/useResearchHistory';
import { startLanggraphResearch } from '../components/Langgraph/Langgraph';
import findDifferences from '../helpers/findDifferences';
import { Data, ChatBoxSettings, QuestionData, ResearchBlock, ReportData, DifferencesData } from '../types/data';
import { preprocessOrderedData } from '../utils/dataProcessing';
import ResearchResults from '../components/ResearchResults';

import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import InputArea from "@/components/ResearchBlocks/elements/InputArea";
import HumanFeedback from "@/components/HumanFeedback";
import LoadingDots from "@/components/LoadingDots";
import ResearchSidebar from "@/components/ResearchSidebar";

interface LanggraphChunk {
  data: {
    report: string | null;
    content: string;
    [key: string]: any;
  };
}

export default function Home() {
  const [promptValue, setPromptValue] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatBoxSettings, setChatBoxSettings] = useState<ChatBoxSettings>({ 
    report_source: 'web', 
    report_type: 'research_report', 
    tone: 'Objective',
    domains: [],
    defaultReportType: 'research_report'
  });
  const [question, setQuestion] = useState("");
  const [orderedData, setOrderedData] = useState<Data[]>([]);
  const [showHumanFeedback, setShowHumanFeedback] = useState(false);
  const [questionForHuman, setQuestionForHuman] = useState<true | false>(false);
  const [allLogs, setAllLogs] = useState<any[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [isStopped, setIsStopped] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [blocks, setBlocks] = useState<ResearchBlock[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');

  const { 
    history, 
    saveResearch, 
    getResearchById, 
    deleteResearch 
  } = useResearchHistory();

  const { socket, initializeWebSocket } = useWebSocket(
    setOrderedData,
    setAnswer,
    setLoading,
    setShowHumanFeedback,
    setQuestionForHuman
  );

  const handleFeedbackSubmit = (feedback: string | null) => {
    if (socket) {
      socket.send(JSON.stringify({ type: 'human_feedback', content: feedback }));
    }
    setShowHumanFeedback(false);
  };

  const handleChat = async (message: string) => {
    if (socket) {
      setShowResult(true);
      setQuestion(message);
      setLoading(true);
      setPromptValue("");
      setAnswer("");

      const questionData: QuestionData = { type: 'question', content: message };
      setOrderedData(prevOrder => [...prevOrder, questionData]);
      
      socket.send(`chat${JSON.stringify({ message })}`);
    }
  };

  const handleDisplayResult = async (newQuestion: string) => {
    setShowResult(true);
    setLoading(true);
    setQuestion(newQuestion);
    setPromptValue("");
    setAnswer("");
    setOrderedData((prevOrder) => [...prevOrder, { type: 'question', content: newQuestion }]);

    const storedConfig = localStorage.getItem('apiVariables');
    const apiVariables = storedConfig ? JSON.parse(storedConfig) : {};
    const langgraphHostUrl = apiVariables.LANGGRAPH_HOST_URL;

    if (chatBoxSettings.report_type === 'multi_agents' && langgraphHostUrl) {
      let { streamResponse, host, thread_id } = await startLanggraphResearch(newQuestion, chatBoxSettings.report_source, langgraphHostUrl);
      const langsmithGuiLink = `https://smith.langchain.com/studio/thread/${thread_id}?baseUrl=${host}`;
      setOrderedData((prevOrder) => [...prevOrder, { type: 'langgraphButton', link: langsmithGuiLink }]);

      let previousChunk: LanggraphChunk | null = null;
      for await (const chunk of streamResponse) {
        const typedChunk = chunk as LanggraphChunk;
        if (typedChunk.data.report != null && typedChunk.data.report != "Full report content here") {
          const reportData: ReportData = {
            type: 'report',
            content: typedChunk.data.content || '',
            output: typedChunk.data.report || '',
            report: typedChunk.data.report
          };
          setOrderedData((prevOrder) => [...prevOrder, reportData]);
          setLoading(false);
        } else if (previousChunk) {
          const differences = findDifferences(previousChunk, typedChunk);
          const differencesData: DifferencesData = {
            type: 'differences',
            content: 'differences',
            output: JSON.stringify(differences)
          };
          setOrderedData((prevOrder) => [...prevOrder, differencesData]);
        }
        previousChunk = typedChunk;
      }
    } else {
      initializeWebSocket(newQuestion, chatBoxSettings);
    }
  };

  const reset = () => {
    // Reset UI states
    setShowResult(false);
    setPromptValue("");
    setIsStopped(false);
    
    // Clear previous research data
    setQuestion("");
    setAnswer("");
    setOrderedData([]);
    setAllLogs([]);

    // Reset feedback states
    setShowHumanFeedback(false);
    setQuestionForHuman(false);
    
    // Clean up connections
    if (socket) {
      socket.close();
    }
    setLoading(false);
  };

  const handleClickSuggestion = (value: string) => {
    setPromptValue(value);
    const element = document.getElementById('input-area');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  /**
   * Handles stopping the current research
   * - Closes WebSocket connection
   * - Stops loading state
   * - Marks research as stopped
   * - Preserves current results
   */
  const handleStopResearch = () => {
    if (socket) {
      socket.close();
    }
    setLoading(false);
    setIsStopped(true);
  };

  /**
   * Handles starting a new research
   * - Clears all previous research data and states
   * - Resets UI to initial state
   * - Closes any existing WebSocket connections
   */
  const handleStartNewResearch = () => {
    reset();
    setSidebarOpen(false);
  };

  // Save completed research to history
  useEffect(() => {
    // Only save when research is complete and not loading
    if (showResult && !loading && answer && question && orderedData.length > 0) {
      // Check if this is a new research (not loaded from history)
      const isNewResearch = !history.some(item => 
        item.question === question && item.answer === answer
      );
      
      if (isNewResearch) {
        saveResearch(question, answer, orderedData);
      }
    }
  }, [showResult, loading, answer, question, orderedData, history, saveResearch]);

  // Handle selecting a research from history
  const handleSelectResearch = (id: string) => {
    const research = getResearchById(id);
    if (research) {
      setShowResult(true);
      setQuestion(research.question);
      setPromptValue("");
      setAnswer(research.answer);
      setOrderedData(research.orderedData);
      setLoading(false);
      setSidebarOpen(false);
    }
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  /**
   * Processes ordered data into logs for display
   * Updates whenever orderedData changes
   */
  useEffect(() => {
    const groupedData = preprocessOrderedData(orderedData);
    const statusReports = ["agent_generated", "starting_research", "planning_research", "error"];
    
    const newLogs = groupedData.reduce((acc: any[], data) => {
      // Process accordion blocks (grouped data)
      if (data.type === 'accordionBlock') {
        const logs = data.items.map((item: any, subIndex: any) => ({
          header: item.content,
          text: item.output,
          metadata: item.metadata,
          key: `${item.type}-${item.content}-${subIndex}`,
        }));
        return [...acc, ...logs];
      } 
      // Process status reports
      else if (statusReports.includes(data.content)) {
        return [...acc, {
          header: data.content,
          text: data.output,
          metadata: data.metadata,
          key: `${data.type}-${data.content}`,
        }];
      }
      return acc;
    }, []);
    
    setAllLogs(newLogs);
  }, [orderedData]);

  const handleScroll = useCallback(() => {
    // Calculate if we're near bottom (within 100px)
    const scrollPosition = window.scrollY + window.innerHeight;
    const nearBottom = scrollPosition >= document.documentElement.scrollHeight - 100;
    
    // Show button if we're not near bottom and page is scrollable
    const isPageScrollable = document.documentElement.scrollHeight > window.innerHeight;
    setShowScrollButton(isPageScrollable && !nearBottom);
  }, []);

  // Add ResizeObserver to watch for content changes
  useEffect(() => {
    const mainContentElement = mainContentRef.current;
    const resizeObserver = new ResizeObserver(() => {
      handleScroll();
    });

    if (mainContentElement) {
      resizeObserver.observe(mainContentElement);
    }

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
    
    return () => {
      if (mainContentElement) {
        resizeObserver.unobserve(mainContentElement);
      }
      resizeObserver.disconnect();
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [handleScroll]);

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth'
    });
  };

  const handleAnalyzeArticle = async (url: string) => {
    setIsAnalyzing(true);
    setCurrentUrl(url);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          include_sources: true,
          check_facts: true,
          detect_bias: true
        }),
      });

      const data = await response.json();
      
      // Transform API response into research blocks
      const newBlocks: ResearchBlock[] = [
        {
          type: 'question',
          content: `Analyzing article: ${url}`,
          timestamp: new Date().toISOString(),
        },
        {
          type: 'answer',
          content: data.summary,
          timestamp: new Date().toISOString(),
        },
        {
          type: 'sources',
          content: data.sources,
          timestamp: new Date().toISOString(),
        },
        {
          type: 'bias',
          content: data.bias_analysis,
          timestamp: new Date().toISOString(),
        },
        {
          type: 'facts',
          content: data.fact_checks,
          timestamp: new Date().toISOString(),
        }
      ];

      setBlocks(newBlocks);
    } catch (error) {
      console.error('Error analyzing article:', error);
      setBlocks([
        {
          type: 'error',
          content: 'Failed to analyze article. Please try again.',
          timestamp: new Date().toISOString(),
        }
      ]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold text-primary mb-4">Deep Journalist</h1>
        <p className="text-xl text-secondary">Transform your articles with AI-powered research and analysis</p>
      </header>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <form className="space-y-6">
          <div>
            <label htmlFor="article" className="block text-sm font-medium text-secondary mb-2">
              Enter your article
            </label>
            <textarea
              id="article"
              name="article"
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Paste your article here..."
            />
          </div>
          <button
            type="submit"
            className="w-full bg-primary text-white py-3 px-6 rounded-md hover:bg-opacity-90 transition-colors"
          >
            Analyze Article
          </button>
        </form>
      </div>
    </div>
  );
}