import React from 'react';
import { render, screen } from '@testing-library/react';
import Header from '@/components/Header';

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />
}));

describe('Header Component', () => {
  it('renders the header with logo and title', () => {
    render(<Header />);
    
    // Check logo
    const logo = screen.getByAltText('Deep-Journalist Logo');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('src', '/img/news.svg');
    
    // Check visible title (not sr-only)
    const visibleTitle = screen.getByText('Deep-Journalist', { ignore: '.sr-only' });
    expect(visibleTitle).toBeInTheDocument();
    expect(visibleTitle).toHaveClass('text-xl', 'font-semibold', 'text-gray-900');
  });

  it('renders navigation links correctly', () => {
    render(<Header />);
    
    // Check GitHub link
    const githubLink = screen.getByRole('link', { name: /github/i });
    expect(githubLink).toBeInTheDocument();
    expect(githubLink).toHaveAttribute('href', 'https://github.com/yourusername/deep-journalist');
    expect(githubLink).toHaveAttribute('target', '_blank');
    expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer');
    
    // Check Documentation link
    const docsLink = screen.getByRole('link', { name: /documentation/i });
    expect(docsLink).toBeInTheDocument();
    expect(docsLink).toHaveAttribute('href', '/docs');
  });

  it('renders the home link correctly', () => {
    render(<Header />);
    
    // Check home link
    const homeLink = screen.getByRole('link', { name: /deep-journalist/i });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('renders all required images', () => {
    render(<Header />);
    
    // Check all images are present
    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(2); // Logo and GitHub icon
    
    // Check GitHub icon
    const githubIcon = screen.getByAltText('GitHub');
    expect(githubIcon).toBeInTheDocument();
    expect(githubIcon).toHaveAttribute('src', '/img/github.svg');
  });
}); 