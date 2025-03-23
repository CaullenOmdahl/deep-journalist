import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Hero from '@/components/Hero';

describe('Hero Component', () => {
  const mockOnAnalyze = jest.fn();
  const defaultProps = {
    onAnalyze: mockOnAnalyze,
    isAnalyzing: false,
  };

  beforeEach(() => {
    mockOnAnalyze.mockClear();
  });

  it('renders the hero section with title and description', () => {
    render(<Hero {...defaultProps} />);
    
    expect(screen.getByText('Deep-Journalist')).toBeInTheDocument();
    expect(screen.getByText('AI-powered journalistic research assistant for comprehensive, unbiased news analysis')).toBeInTheDocument();
  });

  it('renders URL input and analyze button', () => {
    render(<Hero {...defaultProps} />);
    
    expect(screen.getByPlaceholderText('Enter article URL to analyze')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Analyze Article' })).toBeInTheDocument();
  });

  it('calls onAnalyze with URL when form is submitted', () => {
    render(<Hero {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Enter article URL to analyze');
    const button = screen.getByRole('button', { name: 'Analyze Article' });
    const testUrl = 'https://example.com/article';

    fireEvent.change(input, { target: { value: testUrl } });
    fireEvent.click(button);

    expect(mockOnAnalyze).toHaveBeenCalledWith(testUrl);
  });

  it('disables button when isAnalyzing is true', () => {
    render(<Hero {...defaultProps} isAnalyzing={true} />);
    
    const button = screen.getByRole('button', { name: 'Analyzing...' });
    expect(button).toBeDisabled();
  });

  it('disables button when URL is empty', () => {
    render(<Hero {...defaultProps} />);
    
    const button = screen.getByRole('button', { name: 'Analyze Article' });
    expect(button).toBeDisabled();
  });

  it('validates URL format', () => {
    render(<Hero {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Enter article URL to analyze');
    const button = screen.getByRole('button', { name: 'Analyze Article' });

    // Test invalid URL
    fireEvent.change(input, { target: { value: 'not-a-url' } });
    fireEvent.click(button);
    expect(mockOnAnalyze).not.toHaveBeenCalled();

    // Test valid URL
    fireEvent.change(input, { target: { value: 'https://example.com' } });
    fireEvent.click(button);
    expect(mockOnAnalyze).toHaveBeenCalledWith('https://example.com');
  });
}); 