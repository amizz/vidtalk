import { useState } from "react";
import { Link } from "react-router";
import { ChatMessage } from "~/components/ChatMessage";
import { ArrowLeft, Send, Film, Sparkles } from "lucide-react";

const mockMessages = [
  { 
    id: "1", 
    role: "user" as const, 
    content: "What common themes appear across all my videos?",
    timestamp: new Date()
  },
  { 
    id: "2", 
    role: "assistant" as const, 
    content: "Based on your video collection, I've identified several common themes:\n\n1. **Modern Web Development** - All videos focus on contemporary frameworks and tools\n2. **Developer Experience** - Emphasis on improving productivity and workflow\n3. **AI Integration** - Growing focus on incorporating AI into development\n4. **Performance Optimization** - Consistent attention to speed and efficiency\n\nThese themes suggest you're building a comprehensive resource for modern full-stack development.",
    timestamp: new Date(),
    videoReferences: [
      { videoId: 1, videoTitle: "Getting Started with React Router v7" },
      { videoId: 3, videoTitle: "AI and the Future of Development" }
    ]
  },
];

const referencedVideos = [
  {
    id: "1",
    title: "Getting Started with React Router v7",
    thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=300&h=200&fit=crop",
  },
  {
    id: "3",
    title: "AI and the Future of Development",
    thumbnail: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=300&h=200&fit=crop",
  },
];

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  videoReferences?: Array<{
    videoId: number;
    videoTitle: string;
    timestamp?: string;
  }>;
};

export default function CollectionChat() {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [inputMessage, setInputMessage] = useState("");

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const newMessage = {
      id: Date.now().toString(),
      role: "user" as const,
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages([...messages, newMessage]);
    setInputMessage("");

    setTimeout(() => {
      const response = {
        id: (Date.now() + 1).toString(),
        role: "assistant" as const,
        content: "I'm analyzing your entire video collection to provide comprehensive insights...",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, response]);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link
            to="/videos"
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Library
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Collection Chat
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Chat across your entire video library
          </p>
        </div>

        <div className="flex gap-8">
          <div className="flex-1 max-w-4xl">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg h-[70vh] flex flex-col">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-16">
                    <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      Start a conversation about your video collection
                    </p>
                    <div className="space-y-2">
                      <button
                        onClick={() => handleSendMessage({ preventDefault: () => {} } as any)}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline block"
                      >
                        "What themes appear across all videos?"
                      </button>
                      <button
                        onClick={() => handleSendMessage({ preventDefault: () => {} } as any)}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline block"
                      >
                        "Summarize the key insights from my collection"
                      </button>
                    </div>
                  </div>
                ) : (
                  messages.map((message) => (
                    <ChatMessage key={message.id} message={message} />
                  ))
                )}
              </div>

              <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask about your video collection..."
                    className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white placeholder-gray-400"
                  />
                  <button
                    type="submit"
                    className="p-2 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg hover:from-blue-700 hover:to-teal-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="hidden lg:block w-80">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Referenced Videos
              </h3>
              {referencedVideos.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Videos referenced in the conversation will appear here
                </p>
              ) : (
                <div className="space-y-4">
                  {referencedVideos.map((video) => (
                    <Link
                      key={video.id}
                      to={`/videos/${video.id}`}
                      className="block group"
                    >
                      <div className="relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow duration-200">
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <p className="text-white text-sm font-medium truncate">
                            {video.title}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}