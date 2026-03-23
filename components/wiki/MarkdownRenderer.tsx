import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="wiki-md">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>{content}</ReactMarkdown>
      <style jsx global>{`
        .wiki-md h1 {
          font-size: 20px;
          font-weight: 600;
          margin: 0 0 12px;
          color: var(--color-text-primary);
        }
        .wiki-md h2 {
          font-size: 16px;
          font-weight: 600;
          margin: 16px 0 8px;
          color: var(--color-text-primary);
        }
        .wiki-md h3 {
          font-size: 14px;
          font-weight: 500;
          margin: 14px 0 6px;
          color: var(--color-text-primary);
        }
        .wiki-md p {
          line-height: 1.7;
          color: var(--color-text-secondary);
          margin-bottom: 10px;
        }
        .wiki-md ul {
          padding-left: 18px;
          margin-bottom: 10px;
        }
        .wiki-md li {
          line-height: 1.7;
          color: var(--color-text-secondary);
          margin-bottom: 3px;
        }
        .wiki-md strong {
          font-weight: 500;
          color: var(--color-text-primary);
        }
        .wiki-md code {
          font-family: var(--font-mono);
          font-size: 11px;
          background: var(--color-background-secondary);
          padding: 1px 5px;
          border-radius: 4px;
        }
        .wiki-md table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 10px;
          font-size: 13px;
        }
        .wiki-md th, .wiki-md td {
          padding: 6px 10px;
          border: 0.5px solid var(--color-border-tertiary);
          text-align: left;
        }
        .wiki-md th {
          font-weight: 500;
          background: var(--color-background-secondary);
          color: var(--color-text-primary);
        }
        .wiki-md td {
          color: var(--color-text-secondary);
        }
      `}</style>
    </div>
  )
}
