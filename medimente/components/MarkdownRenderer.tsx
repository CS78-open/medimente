import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; // For GitHub Flavored Markdown (tables, task lists etc.)

interface MarkdownRendererProps {
  children: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ children, className }) => {
  return (
    // 'prose' class from @tailwindcss/typography plugin, assumed to be available
    // 'max-w-none' to prevent it from setting max-width, allowing full component width
    <div className={`prose ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {children}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
