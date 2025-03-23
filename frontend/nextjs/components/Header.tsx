import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface HeaderProps {
  loading: boolean;
  isStopped: boolean;
  showResult: boolean;
  onStop: () => void;
  onNewResearch: () => void;
}

export default function Header({ loading, isStopped, showResult, onStop, onNewResearch }: HeaderProps) {
  return (
    <header className="bg-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8" aria-label="Global">
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5" onClick={onNewResearch}>
            <span className="sr-only">Deep-Journalist</span>
            <div className="flex items-center gap-x-2">
              <Image
                src="/img/news.svg"
                alt="Deep-Journalist Logo"
                width={32}
                height={32}
                className="h-8 w-auto"
              />
              <span className="text-xl font-semibold text-gray-900">Deep-Journalist</span>
            </div>
          </Link>
        </div>
        <div className="flex gap-x-4 lg:gap-x-6">
          {loading && !isStopped && (
            <button
              onClick={onStop}
              className="flex items-center gap-x-2 text-sm font-semibold leading-6 text-red-600 hover:text-red-500"
            >
              Stop Research
            </button>
          )}
          <a
            href="https://github.com/yourusername/deep-journalist"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-x-2 text-sm font-semibold leading-6 text-gray-900"
          >
            <Image
              src="/img/github.svg"
              alt="GitHub"
              width={20}
              height={20}
              className="h-5 w-5"
            />
            GitHub
          </a>
          <a
            href="/docs"
            className="text-sm font-semibold leading-6 text-gray-900"
          >
            Documentation
          </a>
        </div>
      </nav>
    </header>
  );
}
