import React from 'react';
import { render, screen } from '@testing-library/react';
import ResearchResults from '@/components/ResearchResults';
import { ResearchBlock, Source, BiasAnalysis, FactCheck } from '@/types/data';

describe('ResearchResults Component', () => {
  const mockSources: Source[] = [
    {
      url: 'https://example.com/source1',
      title: 'Source 1',
      type: 'primary',
      credibility_score: 0.85,
      excerpt: 'Test excerpt 1'
    },
    {
      url: 'https://example.com/source2',
      title: 'Source 2',
      type: 'secondary',
      credibility_score: 0.75,
      excerpt: 'Test excerpt 2'
    }
  ];

  const mockBiasAnalysis: BiasAnalysis = {
    bias_score: 0.3,
    neutral_language_score: 0.85,
    perspective_balance: 0.8,
    detected_bias_types: ['political', 'source'],
    suggestions: ['Consider including more diverse viewpoints']
  };

  const mockFactChecks: FactCheck[] = [
    {
      claim: 'Test claim 1',
      verified: true,
      confidence: 0.9,
      evidence: 'Supporting evidence 1',
      sources: mockSources
    },
    {
      claim: 'Test claim 2',
      verified: false,
      confidence: 0.7,
      evidence: 'Contradicting evidence',
      sources: mockSources
    }
  ];

  const mockBlocks: ResearchBlock[] = [
    {
      type: 'question',
      content: 'What is the main topic?',
      timestamp: new Date().toISOString()
    },
    {
      type: 'answer',
      content: 'The main topic is testing.',
      timestamp: new Date().toISOString()
    },
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

  it('renders all research blocks correctly', () => {
    render(<ResearchResults blocks={mockBlocks} />);
    
    // Check question and answer blocks
    expect(screen.getByText('What is the main topic?')).toBeInTheDocument();
    expect(screen.getByText('The main topic is testing.')).toBeInTheDocument();
    
    // Check sources
    mockSources.forEach(source => {
      expect(screen.getByRole('heading', { name: source.title })).toBeInTheDocument();
      expect(screen.getByText(source.excerpt as string)).toBeInTheDocument();
    });
    
    // Check bias analysis
    expect(screen.getByText('Bias Score')).toBeInTheDocument();
    expect(screen.getByText('Neutral Language')).toBeInTheDocument();
    expect(screen.getByText('Perspective Balance')).toBeInTheDocument();
    mockBiasAnalysis.detected_bias_types.forEach(type => {
      const elements = screen.getAllByText(new RegExp(type, 'i'));
      expect(elements.length).toBeGreaterThan(0);
    });
    
    // Check fact checks
    mockFactChecks.forEach(check => {
      expect(screen.getByText(check.claim)).toBeInTheDocument();
      expect(screen.getByText(check.evidence as string)).toBeInTheDocument();
    });
  });

  it('renders nothing when no blocks are provided', () => {
    const { container } = render(<ResearchResults blocks={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('handles error blocks appropriately', () => {
    const errorBlock: ResearchBlock = {
      type: 'error',
      content: 'An error occurred during analysis',
      timestamp: new Date().toISOString()
    };
    
    render(<ResearchResults blocks={[errorBlock]} />);
    expect(screen.getByText('An error occurred during analysis')).toBeInTheDocument();
  });

  it('displays source credibility scores correctly', () => {
    render(<ResearchResults blocks={[{ 
      type: 'sources', 
      content: mockSources,
      timestamp: new Date().toISOString()
    }]} />);
    
    mockSources.forEach(source => {
      expect(screen.getByText(new RegExp(`${(source.credibility_score * 100).toFixed(0)}%`))).toBeInTheDocument();
    });
  });

  it('shows bias analysis suggestions', () => {
    render(<ResearchResults blocks={[{ 
      type: 'bias', 
      content: mockBiasAnalysis,
      timestamp: new Date().toISOString()
    }]} />);
    
    mockBiasAnalysis.suggestions.forEach(suggestion => {
      expect(screen.getByText(suggestion)).toBeInTheDocument();
    });
  });
}); 