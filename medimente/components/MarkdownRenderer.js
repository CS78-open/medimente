import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; // For GitHub Flavored Markdown (tables, task lists etc.)

const MarkdownRenderer = _ref => {
  let {
    children,
    className
  } = _ref;
  return (
    /*#__PURE__*/
    // 'prose' class from @tailwindcss/typography plugin, assumed to be available
    // 'max-w-none' to prevent it from setting max-width, allowing full component width
    _jsx("div", {
      className: `prose ${className}`,
      children: _jsx(ReactMarkdown, {
        remarkPlugins: [remarkGfm],
        children: children
      })
    })
  );
};
export default MarkdownRenderer;