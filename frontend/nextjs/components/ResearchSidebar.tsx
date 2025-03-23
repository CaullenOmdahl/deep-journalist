import React from 'react';
import { ResearchHistoryItem } from '@/types/data';

interface ResearchSidebarProps {
  history: ResearchHistoryItem[];
  onSelectResearch: (id: string) => void;
  onNewResearch: () => void;
  onDeleteResearch: (id: string) => void;
  isOpen: boolean;
  toggleSidebar: () => void;
}

export default function ResearchSidebar({ 
  history, 
  onSelectResearch, 
  onNewResearch, 
  onDeleteResearch, 
  isOpen, 
  toggleSidebar 
}: ResearchSidebarProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 flex w-96 flex-col bg-white shadow-xl">
      <div className="flex h-16 items-center justify-between px-4 border-b">
        <h2 className="text-lg font-semibold">Research History</h2>
        <button
          onClick={toggleSidebar}
          className="rounded-md p-2 hover:bg-gray-100"
        >
          <span className="sr-only">Close sidebar</span>
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <button
          onClick={onNewResearch}
          className="mb-4 w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
        >
          New Research
        </button>
        <div className="space-y-4">
          {history.map((item) => (
            <div key={item.id} className="rounded-lg border p-4">
              <div className="flex justify-between">
                <h3 className="font-medium">{item.question}</h3>
                <button
                  onClick={() => onDeleteResearch(item.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-600 line-clamp-2">{item.answer}</p>
              <button
                onClick={() => onSelectResearch(item.id)}
                className="mt-2 text-sm text-indigo-600 hover:text-indigo-800"
              >
                View Research
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 