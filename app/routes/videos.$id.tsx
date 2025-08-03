import { useState } from "react";
import { useParams, Link, useLoaderData, useNavigate } from "react-router";
import { VideoPlayer } from "~/components/VideoPlayer";
import { TranscriptViewer } from "~/components/TranscriptViewer";
import { ChatMessage } from "~/components/ChatMessage";
import { ArrowLeft, Send, X, MessageCircle, Trash2 } from "lucide-react";
import { useToast } from "~/contexts/ToastContext";
import type { LoaderFunctionArgs } from "react-router";
import type { CloudflareContext } from "~/types/types";

interface Video {
  id: string;
  title: string;
  thumbnail?: string;
  thumbnailKey?: string;
  duration: string;
  uploadDate: string;
  status: 'transcribed' | 'processing' | 'failed';
  r2Key?: string;
  url?: string;
}

interface LoaderData {
  video: Video | null;
  videoUrl: string | null;
}

export async function loader({ params, request, context }: LoaderFunctionArgs<CloudflareContext>): Promise<LoaderData> {
  try {
    const response = await fetch(new URL(`/api/videos/${params.id}`, request.url));
    if (!response.ok) {
      return { video: null, videoUrl: null };
    }
    const data = await response.json() as { video: Video };
    return { video: data.video, videoUrl: `${context.cloudflare.env.R2_PUBLIC_URL}/${data.video.url}` };
  } catch (error) {
    console.error('Failed to load video:', error);
    return { video: null, videoUrl: null };
  }
}

const mockTranscript = [
  { timestamp: 0, text: "Welcome to this tutorial on React Router v7." },
  { timestamp: 3, text: "Today we'll explore the new features and improvements." },
  { timestamp: 7, text: "First, let's talk about the new file-based routing system." },
  { timestamp: 12, text: "It's now more intuitive and type-safe than ever before." },
];

const mockMessages = [
  { 
    id: "1", 
    role: "user" as const, 
    content: "What are the main improvements in v7?",
    timestamp: new Date()
  },
  { 
    id: "2", 
    role: "assistant" as const, 
    content: "React Router v7 introduces several key improvements:\n\n1. **File-based routing** - More intuitive organization\n2. **Type safety** - Better TypeScript integration\n3. **Performance** - Optimized bundle splitting\n4. **Developer experience** - Improved error messages and debugging",
    timestamp: new Date()
  },
];

export default function VideoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { video, videoUrl } = useLoaderData<LoaderData>();
  
  const [messages, setMessages] = useState(mockMessages);
  const [inputMessage, setInputMessage] = useState("");
  const [currentTime, setCurrentTime] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  if (!video) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Video Not Found
          </h1>
          <Link
            to="/videos"
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            Back to Library
          </Link>
        </div>
      </div>
    );
  }

  const handleDeleteVideo = async () => {
    if (!confirm('Are you sure you want to delete this video?')) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/videos/${video.id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        showToast('Video deleted successfully', 'success');
        navigate('/videos');
      } else {
        console.error('Failed to delete video');
        showToast('Failed to delete video', 'error');
      }
    } catch (error) {
      console.error('Error deleting video:', error);
      showToast('Error deleting video', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

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
        content: "I'm analyzing the video content to provide you with the best answer...",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, response]);
    }, 1000);
  };

  const handleTimestampClick = (timestamp: number) => {
    setCurrentTime(timestamp);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm z-10">
          <div className="px-4 py-3 sm:px-6 flex items-center justify-between">
            <Link
              to="/videos"
              className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Library
            </Link>
            <button
              onClick={handleDeleteVideo}
              disabled={isDeleting}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
              title="Delete video"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Delete Video</span>
            </button>
          </div>
        </div>

        {/* Video content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
            {/* Video player with aspect ratio container */}
            <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl">
              <VideoPlayer
                videoUrl={videoUrl || undefined}
                title={video.title}
                onTimeUpdate={setCurrentTime}
              />
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-6 mb-6">
              {video.title}
            </h1>

            <TranscriptViewer
              segments={mockTranscript.map((t, idx) => ({
                id: idx.toString(),
                startTime: t.timestamp,
                endTime: mockTranscript[idx + 1]?.timestamp || t.timestamp + 5,
                text: t.text
              }))}
              currentTime={currentTime}
              onSegmentClick={handleTimestampClick}
            />
          </div>
        </div>
      </div>

      {/* Chat sidebar */}
      <div className="hidden lg:flex w-96 border-l border-gray-200 dark:border-gray-700 flex-col bg-white dark:bg-gray-800 shadow-xl">
        <div className="px-4 py-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            AI Chat Assistant
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Ask questions about this video
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
          </div>
        </div>

        <form onSubmit={handleSendMessage} className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask about the video..."
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

      {/* Mobile chat button */}
      <button
        className="lg:hidden fixed bottom-4 right-4 p-4 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-full shadow-lg hover:from-blue-700 hover:to-teal-700 transition-all duration-200 transform hover:scale-105 z-50"
        onClick={() => setIsChatOpen(true)}
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* Mobile chat modal */}
      {isChatOpen && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center sm:justify-center">
          <div className="bg-white dark:bg-gray-800 w-full sm:max-w-lg h-[90vh] sm:h-[80vh] rounded-t-xl sm:rounded-xl flex flex-col transition-all duration-300 ease-out transform translate-y-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  AI Chat Assistant
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Ask questions about this video
                </p>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
              </div>
            </div>

            <form onSubmit={handleSendMessage} className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask about the video..."
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
      )}
    </div>
  );
}