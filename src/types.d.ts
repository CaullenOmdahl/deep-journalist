interface Source {
  sourceType: "primary" | "secondary" | "official" | "analysis" | "commentary";
  id: string;
  url: string;
  title?: string;
  credibilityScore?: number;
  publicationDate?: string;
  biasAssessment?: string;
  authorName?: string;
  publisherName?: string;
}

interface SearchTask {
  state: "unprocessed" | "processing" | "completed";
  query: string;
  researchGoal: string;
  learning: string;
  sources: Source[];
}

interface ResearchHistory {
  id: string;
  createdAt: number;
  updatedAt?: number;
  title: string;
  question: string;
  questions: string;
  finalReport: string;
  query: string;
  suggestion: string;
  tasks: SearchTask[];
  sources: Source[];
  feedback: string;
  articleType?: "news" | "feature" | "investigative" | "explainer";
}

interface PartialJson {
  value: JSONValue | undefined;
  state:
    | "undefined-input"
    | "successful-parse"
    | "repaired-parse"
    | "failed-parse";
}
