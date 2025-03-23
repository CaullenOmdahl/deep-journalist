import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ResearchSidebar from '@/components/ResearchSidebar';
import { ResearchBlock, Source, BiasAnalysis, FactCheck } from '@/types/data';

describe('ResearchSidebar Component', () => {
  const mockUrl = 'https://example.com/article';
  const mockOnClear = jest.fn();
  
  const mockSources: Source[] = [
    {
      url: 'https://example.com/source1',
      title: 'Source 1',
      type: 'primary',
      credibility_score: 0.85
    },
    {
      url: 'https://example.com/source2',
      title: 'Source 2',
      type: 'secondary',
      credibility_score: 0.75
    }
  ];

  const mockBiasAnalysis: BiasAnalysis = {
    bias_score: 0.3,
    neutral_language_score: 0.85,
    perspective_balance: 0.8,
    detected_bias_types: ['political'],
    suggestions: ['Consider more viewpoints']
  };

  const mockFactChecks: FactCheck[] = [
    {
      claim: 'Test claim 1',
      verified: true,
      confidence: 0.9,
      evidence: 'Supporting evidence'
    },
    {
      claim: 'Test claim 2',
      verified: false,
      confidence: 0.7,
      evidence: 'Contradicting evidence'
    }
  ];

  const mockBlocks: ResearchBlock[] = [
    {
      type: 'sources',
      content: mockSources,
      timestamp: new Date().toISOString()
    },
    {
      type: 'bias',
      content: mockBiasAnalysis,
      timestamp: new Date().toISOString()
    },
    {
      type: 'facts',
      content: mockFactChecks,
      timestamp: new Date().toISOString()
    }
  ];

  it('displays analysis statistics correctly', () => {
    render(
      <ResearchSidebar
        url={mockUrl}
        blocks={mockBlocks}
        onClear={mockOnClear}
      />
    );
    
    // Check URL display
    expect(screen.getByText(mockUrl)).toBeInTheDocument();
    
    // Check sources count
    expect(screen.getByText('2 sources analyzed')).toBeInTheDocument();
    
    // Check bias analysis status
    expect(screen.getByText('Completed')).toBeInTheDocument();
    
    // Check fact checks count
    expect(screen.getByText('2 claims verified')).toBeInTheDocument();
  });

  it('renders empty state when no blocks are provided', () => {
    render(
      <ResearchSidebar
        url={mockUrl}
        blocks={[]}
        onClear={mockOnClear}
      />
    );
    
    expect(screen.getByText('No sources analyzed yet')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('No facts checked yet')).toBeInTheDocument();
  });

  it('calls onClear when clear button is clicked', () => {
    render(
      <ResearchSidebar
        url={mockUrl}
        blocks={mockBlocks}
        onClear={mockOnClear}
      />
    );
    
    const clearButton = screen.getByRole('button', { name: /clear/i });
    fireEvent.click(clearButton);
    
    expect(mockOnClear).toHaveBeenCalled();
  });

  it('renders the article URL as a link', () => {
    render(
      <ResearchSidebar
        url={mockUrl}
        blocks={mockBlocks}
        onClear={mockOnClear}
      />
    );
    
    const urlLink = screen.getByRole('link', { name: mockUrl });
    expect(urlLink).toBeInTheDocument();
    expect(urlLink).toHaveAttribute('href', mockUrl);
    expect(urlLink).toHaveAttribute('target', '_blank');
    expect(urlLink).toHaveAttribute('rel', 'noopener noreferrer');
  });
}); 