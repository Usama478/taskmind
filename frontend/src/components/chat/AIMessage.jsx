import { Sparkles } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const markdownComponents = {
  p: ({ children }) => (
    <p className="mb-2 text-[14px] leading-6 text-white last:mb-0">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="my-2 list-disc space-y-1.5 pl-5 marker:text-[#9370DB]">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="my-2 list-decimal space-y-1.5 pl-5 marker:text-[#9370DB]">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="text-[14px] leading-6 text-white">{children}</li>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-white">{children}</strong>
  ),
  em: ({ children }) => <em className="italic text-gray-200">{children}</em>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[#C4B5FD] underline underline-offset-2 hover:text-white"
    >
      {children}
    </a>
  ),
  code: ({ className, children, ...props }) => {
    const isBlock = className?.includes('language-')
    if (isBlock) {
      return (
        <code
          className={`block text-[12.5px] text-[#E9D5FF] ${className || ''}`}
          {...props}
        >
          {children}
        </code>
      )
    }
    return (
      <code
        className="rounded bg-white/[0.08] px-1.5 py-0.5 text-[12.5px] text-[#E9D5FF]"
        {...props}
      >
        {children}
      </code>
    )
  },
  pre: ({ children }) => (
    <pre className="my-2 overflow-x-auto rounded-lg border border-white/[0.08] bg-[#13101F] p-3">
      {children}
    </pre>
  ),
  h1: ({ children }) => (
    <h1 className="mb-2 text-base font-bold text-white">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-2 text-[15px] font-bold text-white">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-1.5 text-sm font-semibold text-white">{children}</h3>
  ),
  hr: () => <hr className="my-3 border-white/10" />,
}

export default function AIMessage({ message }) {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  }

  return (
    <div className="mb-4 flex items-start gap-2.5">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#9370DB] to-[#5B3FBE] shadow-md shadow-[#7C5CBF]/30">
        <Sparkles size={13} className="text-white" />
      </div>
      <div className="flex max-w-[85%] flex-col items-start">
        <div className="break-words rounded-2xl rounded-tl-md border border-white/[0.06] bg-[#1B1530] px-4 py-3">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={markdownComponents}
          >
            {message.content}
          </ReactMarkdown>
        </div>
        <div className="ml-1 mt-1 text-[11px] text-gray-500">
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  )
}
