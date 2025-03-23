import Image from "next/image";
import { Toaster, toast } from "react-hot-toast";
import { useEffect, useState } from 'react';
import { remark } from 'remark';
import html from 'remark-html';
import '@/styles/markdown.css';

export default function Answer({ answer }: { answer: string }) {
  async function markdownToHtml(markdown: string | undefined) {
    try {
      const result = await remark().use(html).process(markdown);
      return result.toString();
    } catch (error) {
      console.error('Error converting Markdown to HTML:', error);
      return ''; // Handle error gracefully, return empty string or default content
    }
  }

  const [htmlContent, setHtmlContent] = useState('');

  useEffect(() => {
    markdownToHtml(answer).then((html) => setHtmlContent(html));
  }, [answer]);
  
  return (
    <div className="container flex h-auto w-full shrink-0 gap-4 bg-gray-900 shadow-md rounded-lg border border-solid border-[#C2C2C2] p-5">
      <div className="w-full">
        <div className="flex items-center justify-between pb-3">
          {answer && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(answer.trim());
                  toast("Answer copied to clipboard", {
                    icon: "✂️",
                  });
                }}
              >
                <Image
                  src="/img/copy-white.svg"
                  alt="footer"
                  width={20}
                  height={20}
                  className="cursor-pointer text-white"
                />
              </button>
            </div>
          )}
        </div>
        <div 
          className="prose prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>
      <Toaster />
    </div>
  );
}
