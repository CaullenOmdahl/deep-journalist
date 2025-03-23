import React, { useState } from 'react';

interface HeroProps {
  promptValue: string;
  setPromptValue: React.Dispatch<React.SetStateAction<string>>;
  handleDisplayResult: (newQuestion: string) => Promise<void>;
  onAnalyze: (url: string) => Promise<void>;
  isAnalyzing: boolean;
}

export default function Hero({ 
  promptValue, 
  setPromptValue, 
  handleDisplayResult, 
  onAnalyze, 
  isAnalyzing 
}: HeroProps) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (url) {
      onAnalyze(url);
    }
  };

  return (
    <div className="relative isolate px-6 pt-14 lg:px-8">
      <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Deep-Journalist
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            AI-powered journalistic research assistant for comprehensive, unbiased news analysis
          </p>
          <form onSubmit={handleSubmit} className="mt-10 flex items-center justify-center gap-x-6">
            <input
              type="url"
              value={url}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
              placeholder="Enter article URL to analyze"
              className="min-w-[400px] rounded-md border-0 px-3.5 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              required
            />
            <button
              type="submit"
              disabled={isAnalyzing || !url}
              className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze Article'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
