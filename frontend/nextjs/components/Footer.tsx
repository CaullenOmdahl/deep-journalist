import React from 'react';
import Image from 'next/image';
import { ChatBoxSettings } from '@/types/data';
import Modal from './Settings/Modal';

interface FooterProps {
  chatBoxSettings: ChatBoxSettings;
  setChatBoxSettings: React.Dispatch<React.SetStateAction<ChatBoxSettings>>;
}

export default function Footer({ chatBoxSettings, setChatBoxSettings }: FooterProps) {
  return (
    <footer className="bg-white">
      <div className="mx-auto max-w-7xl px-6 py-12 md:flex md:items-center md:justify-between lg:px-8">
        <div className="flex justify-center space-x-6 md:order-2">
          <Modal chatBoxSettings={chatBoxSettings} setChatBoxSettings={setChatBoxSettings} />
          <a
            href="https://github.com/yourusername/deep-journalist"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">GitHub</span>
            <Image
              src="/img/github-footer.svg"
              alt="GitHub"
              width={24}
              height={24}
              className="h-6 w-6"
            />
          </a>
        </div>
        <div className="mt-8 md:order-1 md:mt-0">
          <p className="text-center text-xs leading-5 text-gray-500">
            &copy; {new Date().getFullYear()} Deep-Journalist. All rights reserved.
            Built with AI for better journalism.
          </p>
        </div>
      </div>
    </footer>
  );
}