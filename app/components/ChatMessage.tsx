import { Bot, User, Tv, Radio, Sparkles } from 'lucide-react';
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
    <div className={`flex gap-4 ${isUser ? 'flex-row-reverse' : ''} ${!isUser ? 'pr-8' : 'pl-8'}`}>
      <div className="relative">
        <div className={`absolute inset-0 ${
          isUser ? 'bg-[#FF006E]' : 'bg-[#8338EC]'
        } rounded-xl retro-border transform ${isUser ? 'rotate-3' : '-rotate-3'}`} />
        <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center retro-border ${
          isUser 
            ? 'bg-[#FFBE0B] text-[#1A0033]' 
            : 'bg-[#00F5FF] text-[#1A0033]'
        } wiggle-hover`}>
          {isUser ? <User className="w-6 h-6" /> : <Radio className="w-6 h-6" />}
        </div>
      </div>
      
      <div className={`flex-1 max-w-[75%] ${isUser ? 'text-right' : ''}`}>
        <div className="relative inline-block">
          <div className={`absolute inset-0 ${
            isUser ? 'bg-[#FF006E]' : 'bg-[#8338EC]'
          } rounded-2xl retro-border transform ${isUser ? '-rotate-1' : 'rotate-1'}`} />
          <div className={`relative px-6 py-4 rounded-2xl retro-border ${
            isUser 
              ? 'bg-[#FFF3E0] text-[#1A0033]' 
              : 'bg-white text-[#1A0033]'
          }`}>
            {isUser ? (
              <p className="font-space-mono text-base whitespace-pre-wrap">{message.content}</p>
            ) : (
              <div className="font-space-mono text-base prose prose-sm max-w-none">
                <ReactMarkdown 
                  components={{
                    p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>,
                    li: ({ children }) => <li className="mb-1">{children}</li>,
                    h1: ({ children }) => <h1 className="font-bungee text-xl mb-3 text-[#FF006E]">{children}</h1>,
                    h2: ({ children }) => <h2 className="font-bungee text-lg mb-3 text-[#8338EC]">{children}</h2>,
                    h3: ({ children }) => <h3 className="font-bebas text-lg mb-2 text-[#1A0033]">{children}</h3>,
                    code: ({ node, className, children, ...props }) => {
                      const match = /language-(\w+)/.exec(className || '')
                      return match ? (
                        <pre className="bg-[#1A0033] text-[#00F5FF] p-3 rounded-xl overflow-x-auto mb-3 retro-border">
                          <code className="text-sm font-mono" {...props}>
                            {children}
                          </code>
                        </pre>
                      ) : (
                        <code className="bg-[#8338EC] text-white px-2 py-1 rounded font-mono text-sm" {...props}>
                          {children}
                        </code>
                      )
                    },
                    pre: ({ children }) => <>{children}</>,
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-[#FF006E] pl-4 italic bg-[#FF006E]/10 py-2 rounded-r-lg">
                        {children}
                      </blockquote>
                    ),
                    a: ({ href, children }) => (
                      <a href={href} className="text-[#FF006E] hover:text-[#8338EC] font-bold underline decoration-wavy" target="_blank" rel="noopener noreferrer">
                        {children}
                      </a>
                    ),
                    strong: ({ children }) => <strong className="font-bold text-[#FF006E]">{children}</strong>,
                    em: ({ children }) => <em className="italic text-[#8338EC]">{children}</em>,
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            )}
            
            {message.videoReferences && message.videoReferences.length > 0 && (
              <div className="mt-4 pt-3 border-t-2 border-[#8338EC]/20">
                <p className="font-bebas text-sm text-[#8338EC] mb-2 flex items-center gap-2">
                  <Tv className="w-4 h-4" />
                  REFERENCED VIDEOS:
                </p>
                <div className="space-y-2">
                  {message.videoReferences.map((ref, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <Sparkles className="w-3 h-3 text-[#FF006E]" />
                      <span className="font-space-mono">
                        {ref.videoTitle}
                        {ref.timestamp && (
                          <span className="text-[#8338EC]"> @ {ref.timestamp}</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <p className={`font-space-mono text-xs text-[#8338EC] mt-2 ${
          isUser ? 'text-right' : ''
        }`}>
          {message.timestamp.toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}