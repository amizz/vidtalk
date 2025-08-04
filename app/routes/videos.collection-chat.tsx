import { useState, useEffect, useMemo } from "react";
import { Link, useFetcher, type ActionFunctionArgs } from "react-router";
import { ChatMessage } from "~/components/ChatMessage";
import { ArrowLeft, Send, Film, Sparkles } from "lucide-react";
import type { CloudflareContext } from "~/types/types";
import { VidTalkAPI } from "~/lib/api";

type ActionResponse = {
  content: string;
  videoReferences: Array<{
    videoId: string;
    videoTitle: string;
    thumbnailUrl?: string;
    timestamp?: string;
  }>;
};

export async function action({ request, context }: ActionFunctionArgs<CloudflareContext>) {
  const formData = await request.formData();
  const query = formData.get("query") as string;
  
  const env = context.cloudflare.env;
  
  try {
    const answer = await env.AI.autorag("vidtalk").aiSearch({
      query: query,
    });
    
    return Response.json({
      content: answer.response || "I couldn't find relevant information in your video collection.",
      videoReferences: await Promise.all(answer.data?.map(async (ref) => {
        // Extract UUID from filename path like "videos/f4b8a2e7-6bb0-4d50-87c6-555a6f14c451/..."
        const uuidMatch = ref.filename.match(/videos\/([a-f0-9-]+)\//);
        const videoId = uuidMatch ? uuidMatch[1] : ref.file_id;
        
        // Extract video title from filename (remove timestamp prefix and _transcript.txt suffix)
        const filenameParts = ref.filename.split('/').pop() || '';
        const titleMatch = filenameParts.match(/^\d+-(.+)_transcript\.txt$/);
        const videoTitle = titleMatch ? titleMatch[1].replace(/([A-Z])/g, ' $1').trim() : filenameParts;

        const api = new VidTalkAPI(env);
        const video = await api.getVideo(videoId);
        
        // Generate thumbnail URL
        let thumbnailUrl: string | undefined;
        if (video?.video?.url) {
          // Generate expected thumbnail key based on video URL
          const thumbnailKey = video.video.url.replace(/\.[^/.]+$/, '_thumb.jpg');
          thumbnailUrl = `${env.R2_PUBLIC_URL}/${thumbnailKey}`;
        }
        
        return {
          videoId,
          videoTitle: video?.video?.title || videoTitle,
          thumbnailUrl,
          timestamp: ref.attributes?.timestamp as string || undefined
        };
      }) || [])
    });
  } catch (error) {
    console.error("AutoRAG error:", error);
    return Response.json({
      content: "I'm having trouble searching through your video collection right now. Please try again.",
      videoReferences: []
    });
  }
}

const mockMessages: Message[] = [];

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  videoReferences?: Array<{
    videoId: string | number;
    videoTitle: string;
    thumbnailUrl?: string;
    timestamp?: string;
  }>;
};

export default function CollectionChat() {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [inputMessage, setInputMessage] = useState("");
  const fetcher = useFetcher<ActionResponse>();
  
  // Extract unique referenced videos from all messages
  const referencedVideos = useMemo(() => {
    const videoMap = new Map<string, { id: string; title: string; thumbnail?: string }>();
    
    messages.forEach(message => {
      if (message.videoReferences) {
        message.videoReferences.forEach(ref => {
          const id = String(ref.videoId);
          if (!videoMap.has(id)) {
            videoMap.set(id, {
              id,
              title: ref.videoTitle,
              thumbnail: ref.thumbnailUrl
            });
          }
        });
      }
    });
    
    return Array.from(videoMap.values());
  }, [messages]);

  useEffect(() => {
    if (fetcher.data) {
      const response: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: fetcher.data.content,
        timestamp: new Date(),
        videoReferences: fetcher.data.videoReferences
      };
      setMessages(prev => [...prev, response]);
    }
  }, [fetcher.data]);

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
    const currentInput = inputMessage;
    setInputMessage("");

    fetcher.submit(
      { query: currentInput },
      { method: "post" }
    );
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
                  <>
                    {messages.map((message) => (
                      <ChatMessage key={message.id} message={message} />
                    ))}
                    {fetcher.state === "submitting" && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-teal-600 flex items-center justify-center shadow-md">
                          <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-4 shadow-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask about your video collection..."
                    disabled={fetcher.state === "submitting"}
                    className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white placeholder-gray-400 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={fetcher.state === "submitting"}
                    className="p-2 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg hover:from-blue-700 hover:to-teal-700 transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {fetcher.state === "submitting" ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
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
                        {video.thumbnail ? (
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        ) : (
                          <div className="w-full h-32 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <Film className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
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