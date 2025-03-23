export interface BaseData {
  type: string;
}

export interface BasicData extends BaseData {
  type: 'basic';
  content: string;
}

export interface LanggraphButtonData extends BaseData {
  type: 'langgraphButton';
  link: string;
}

export interface DifferencesData extends BaseData {
  type: 'differences';
  content: string;
  output: string;
}

export interface QuestionData extends BaseData {
  type: 'question';
  content: string;
}

export interface ChatData extends BaseData {
  type: 'chat';
  content: string;
}

export interface ReportData extends BaseData {
  type: 'report';
  content: string;
  output: string;
  report: string | null;
}

export interface SourcesData extends BaseData {
  type: 'sources';
  content: Source[];
}

export interface BiasData extends BaseData {
  type: 'bias';
  content: BiasAnalysis;
}

export interface FactsData extends BaseData {
  type: 'facts';
  content: FactCheck[];
}

export interface ErrorData extends BaseData {
  type: 'error';
  content: string;
}

export type Data = BasicData | LanggraphButtonData | DifferencesData | QuestionData | ChatData | ReportData | SourcesData | BiasData | FactsData | ErrorData;

export interface ChatBoxSettings {
  report_type: string;
  report_source: string;
  tone: string;
  domains: string[];
  defaultReportType: string;
}

export interface Domain {
  value: string;
}

export interface ResearchHistoryItem {
  id: string;
  question: string;
  answer: string;
  timestamp: number;
  orderedData: Data[];
}

export interface Source {
  url: string;
  title: string;
  type: 'primary' | 'secondary';
  credibility_score: number;
  excerpt?: string;
}

export interface BiasAnalysis {
  bias_score: number;
  neutral_language_score: number;
  perspective_balance: number;
  detected_bias_types: string[];
  suggestions: string[];
}

export interface FactCheck {
  claim: string;
  verified: boolean;
  confidence: number;
  evidence?: string;
  sources?: Source[];
}

export interface ResearchBlock {
  type: 'question' | 'answer' | 'sources' | 'bias' | 'facts' | 'error';
  content: string | Source[] | BiasAnalysis | FactCheck[];
  timestamp: string;
}

export interface AnalysisResponse {
  summary: string;
  sources: Source[];
  bias_analysis: BiasAnalysis;
  fact_checks: FactCheck[];
} 