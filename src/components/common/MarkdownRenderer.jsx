import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

/**
 * Isolated markdown rendering component with GFM and raw HTML support.
 *
 * @param {Object} props
 * @param {string} props.content - Markdown string content
 * @param {string} [props.className] - Optional custom CSS classes
 */
export default function MarkdownRenderer({ content, className = "" }) {
  if (!content) return null;

  return (
    <div className={`leading-relaxed text-sm sm:text-base text-gray-700 [&_h1]:mt-4 [&_h1]:mb-2 [&_h1]:font-semibold [&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:font-semibold [&_h4]:mt-4 [&_h4]:mb-2 [&_h4]:font-semibold [&_h5]:mt-4 [&_h5]:mb-2 [&_h5]:font-semibold [&_h6]:mt-4 [&_h6]:mb-2 [&_h6]:font-semibold [&_p]:my-2 [&_ul]:my-2 [&_ul]:pl-8 [&_ol]:my-2 [&_ol]:pl-8 [&_li]:mb-1 [&_a]:text-blue-600 [&_a]:no-underline [&_a:hover]:underline [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_pre]:bg-gray-100 [&_pre]:p-4 [&_pre]:rounded [&_pre]:overflow-x-auto [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:my-4 [&_blockquote]:pl-4 [&_blockquote]:pr-4 [&_blockquote]:bg-gray-50 [&_strong]:font-bold [&_em]:italic [&_u]:underline [&_br]:block [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded [&_img]:my-2 ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
