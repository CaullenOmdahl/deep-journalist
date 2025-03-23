import React from 'react';
import { ResearchBlock, Source, BiasAnalysis, FactCheck, Data, ChatBoxSettings } from '@/types/data';

interface ResearchResultsProps {
  orderedData: Data[];
  answer: string;
  allLogs: any[];
  chatBoxSettings: ChatBoxSettings;
  handleClickSuggestion: (value: string) => void;
}

function SourcesList({ sources }: { sources: Source[] }) {
  return (
    <div className="mt-4 space-y-4">
      <h3 className="text-lg font-semibold">Sources</h3>
      <div className="grid gap-4 md:grid-cols-2">
        {sources.map((source, index) => (
          <div key={index} className="rounded-lg border p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">{source.title}</h4>
              <span className={`rounded-full px-2 py-1 text-xs ${
                source.type === 'primary' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {source.type}
              </span>
            </div>
            <a href={source.url} target="_blank" rel="noopener noreferrer" 
               className="mt-2 block text-sm text-blue-600 hover:underline">
              {source.url}
            </a>
            {source.excerpt && (
              <p className="mt-2 text-sm text-gray-600">{source.excerpt}</p>
            )}
            <div className="mt-2 text-sm text-gray-500">
              Credibility: {(source.credibility_score * 100).toFixed(0)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BiasAnalysisSection({ analysis }: { analysis: BiasAnalysis }) {
  return (
    <div className="mt-4 space-y-4">
      <h3 className="text-lg font-semibold">Bias Analysis</h3>
      <div className="rounded-lg border p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <div className="text-sm text-gray-500">Bias Score</div>
            <div className="text-2xl font-semibold">
              {(analysis.bias_score * 100).toFixed(0)}%
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Neutral Language</div>
            <div className="text-2xl font-semibold">
              {(analysis.neutral_language_score * 100).toFixed(0)}%
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Perspective Balance</div>
            <div className="text-2xl font-semibold">
              {(analysis.perspective_balance * 100).toFixed(0)}%
            </div>
          </div>
        </div>
        {analysis.detected_bias_types.length > 0 && (
          <div className="mt-4">
            <div className="text-sm text-gray-500">Detected Bias Types</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {analysis.detected_bias_types.map((type, index) => (
                <span key={index} className="rounded-full bg-yellow-100 px-2 py-1 text-xs text-yellow-800">
                  {type}
                </span>
              ))}
            </div>
          </div>
        )}
        {analysis.suggestions.length > 0 && (
          <div className="mt-4">
            <div className="text-sm text-gray-500">Suggestions</div>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
              {analysis.suggestions.map((suggestion, index) => (
                <li key={index}>{suggestion}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function FactCheckSection({ factChecks }: { factChecks: FactCheck[] }) {
  return (
    <div className="mt-4 space-y-4">
      <h3 className="text-lg font-semibold">Fact Checks</h3>
      <div className="space-y-4">
        {factChecks.map((check, index) => (
          <div key={index} className="rounded-lg border p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="font-medium">{check.claim}</div>
              <span className={`rounded-full px-2 py-1 text-xs ${
                check.verified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {check.verified ? 'Verified' : 'Unverified'}
              </span>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              Confidence: {(check.confidence * 100).toFixed(0)}%
            </div>
            {check.evidence && (
              <div className="mt-2 text-sm">
                <div className="font-medium">Evidence:</div>
                <p className="text-gray-600">{check.evidence}</p>
              </div>
            )}
            {check.sources && check.sources.length > 0 && (
              <div className="mt-2">
                <div className="text-sm font-medium">Supporting Sources:</div>
                <ul className="mt-1 list-inside list-disc space-y-1 text-sm">
                  {check.sources.map((source, idx) => (
                    <li key={idx}>
                      <a href={source.url} target="_blank" rel="noopener noreferrer" 
                         className="text-blue-600 hover:underline">
                        {source.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ResearchResults({ orderedData, answer, allLogs, chatBoxSettings, handleClickSuggestion }: ResearchResultsProps) {
  if (!orderedData.length) return null;

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4">
      {orderedData.map((data, index) => {
        switch (data.type) {
          case 'question':
            return (
              <div key={index} className="rounded-lg bg-gray-50 p-4">
                <h2 className="text-xl font-semibold">{data.content}</h2>
              </div>
            );
          case 'basic':
            return (
              <div key={index} className="prose max-w-none">
                <p className="text-gray-600">{data.content}</p>
              </div>
            );
          case 'report':
            return (
              <div key={index} className="prose max-w-none">
                <p className="text-gray-600">{data.output}</p>
              </div>
            );
          case 'differences':
            return (
              <div key={index} className="prose max-w-none">
                <pre className="text-gray-600">{data.output}</pre>
              </div>
            );
          case 'langgraphButton':
            return (
              <div key={index} className="prose max-w-none">
                <a href={data.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  View in Langsmith
                </a>
              </div>
            );
          case 'chat':
            return (
              <div key={index} className="prose max-w-none">
                <p className="text-gray-600">{data.content}</p>
              </div>
            );
          case 'sources':
            return (
              <SourcesList key={index} sources={data.content as Source[]} />
            );
          case 'bias':
            return (
              <BiasAnalysisSection key={index} analysis={data.content as BiasAnalysis} />
            );
          case 'facts':
            return (
              <FactCheckSection key={index} factChecks={data.content as FactCheck[]} />
            );
          case 'error':
            return (
              <div key={index} className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
                {data.content as string}
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
} 