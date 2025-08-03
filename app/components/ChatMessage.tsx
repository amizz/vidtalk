import { Bot, User } from 'lucide-react';

interface ChatMessageProps {
  message: {
    id: string;
    content: string;
    role: 'user' | 'assistant';
    timestamp: Date;
    videoReferences?: Array<{
      videoId: number;
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
          : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
      }`}>
        {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
      </div>
      
      <div className={`flex-1 max-w-[80%] ${isUser ? 'text-right' : ''}`}>
        <div className={`inline-block px-4 py-2 rounded-lg ${
          isUser 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
        }`}>
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          
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
        
        <p className={`text-xs text-gray-500 dark:text-gray-400 mt-1 ${
          isUser ? 'text-right' : ''
        }`}>
          {message.timestamp.toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}