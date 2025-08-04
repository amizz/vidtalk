import { Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ChatMessageProps {
  message: {
    id: string;
    content: string;
    role: 'user' | 'assistant';
    timestamp: Date;
    videoReferences?: Array<{
      videoId: string | number;
      videoTitle: string;
      timestamp?: string;
    }>;
  };
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
        isUser 
          ? 'bg-blue-600 text-white' 
          : 'bg-gray-200 text-gray-600'
      }`}>
        {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
      </div>
      
      <div className={`flex-1 max-w-[80%] ${isUser ? 'text-right' : ''}`}>
        <div className={`inline-block px-4 py-2 rounded-lg ${
          isUser 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-100 text-gray-900'
        }`}>
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="text-sm prose prose-sm max-w-none">
              <ReactMarkdown 
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
                  li: ({ children }) => <li className="mb-1">{children}</li>,
                  h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-bold mb-2">{children}</h3>,
                  code: ({ node, className, children, ...props }) => {
                    const match = /language-(\w+)/.exec(className || '')
                    return match ? (
                      <pre className="bg-gray-200 p-2 rounded overflow-x-auto mb-2">
                        <code className="text-xs" {...props}>
                          {children}
                        </code>
                      </pre>
                    ) : (
                      <code className="bg-gray-200 px-1 py-0.5 rounded text-xs" {...props}>
                        {children}
                      </code>
                    )
                  },
                  pre: ({ children }) => <>{children}</>,
                  blockquote: ({ children }) => <blockquote className="border-l-2 border-gray-300 pl-2 italic">{children}</blockquote>,
                  a: ({ href, children }) => <a href={href} className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">{children}</a>,
                  strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                  em: ({ children }) => <em className="italic">{children}</em>,
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
          
          {message.videoReferences && message.videoReferences.length > 0 && (
            <div className="mt-2 pt-2 border-t border-opacity-20 border-current">
              <p className="text-xs opacity-80 mb-1">Referenced videos:</p>
              <div className="space-y-1">
                {message.videoReferences.map((ref, index) => (
                  <div key={index} className="text-xs opacity-80">
                    • {ref.videoTitle}
                    {ref.timestamp && ` at ${ref.timestamp}`}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <p className={`text-xs text-gray-500 mt-1 ${
          isUser ? 'text-right' : ''
        }`}>
          {message.timestamp.toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}