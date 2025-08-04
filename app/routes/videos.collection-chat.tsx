import { useState, useEffect, useMemo } from "react";
import { Link, useFetcher, type ActionFunctionArgs } from "react-router";
import { ChatMessage } from "~/components/ChatMessage";
import { ArrowLeft, Send, Film, Sparkles, Tv, Radio, Music, Disc } from "lucide-react";
import type { CloudflareContext } from "~/types/types";
import { VidTalkAPI } from "~/lib/api";
import type { MetaFunction } from "react-router";

export const meta: MetaFunction = () => {
 return [
  { title: "Cosmic Chat" },
  { name: "description", content: "Cosmic Chat" }
 ];
};

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
  <div className="min-h-screen bg-[#FFF3E0]">
   <div className="max-w-7xl mx-auto px-6 py-8">
    <div className="mb-8">
     <Link
      to="/videos"
      className="inline-flex items-center gap-2 px-4 py-2 bg-[#8338EC] text-white rounded-xl retro-border retro-shadow hover:translate-x-0.5 hover:translate-y-0.5 transition-all font-bebas text-lg mb-6"
     >
      <ArrowLeft className="w-5 h-5" />
      Back to Vault
     </Link>
     
     <div className="flex items-center gap-4">
      <div className="w-20 h-20 bg-[#FF006E] rounded-2xl flex items-center justify-center retro-border retro-shadow wiggle-hover">
       <Radio className="w-12 h-12 text-white" />
      </div>
      <div>
       <h1 className="font-bungee-shade text-5xl text-[#1A0033]">
        COSMIC CHAT
       </h1>
       <p className="font-bebas text-2xl text-[#8338EC] mt-1">
        Chat across your entire groovy video collection!
       </p>
      </div>
     </div>
    </div>

    <div className="flex gap-8">
     <div className="flex-1 max-w-4xl">
      <div className="relative">
       <div className="absolute inset-0 bg-[#8338EC] rounded-2xl retro-border transform rotate-1" />
       <div className="relative bg-white rounded-2xl retro-shadow-lg h-[70vh] flex flex-col retro-border">
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#FFF3E0] rounded-t-2xl">
         {messages.length === 0 ? (
          <div className="text-center py-16">
           <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-[#00F5FF] rounded-3xl retro-border transform -rotate-6" />
            <div className="relative w-24 h-24 bg-[#FFBE0B] rounded-3xl flex items-center justify-center retro-border retro-shadow float">
             <Sparkles className="w-12 h-12 text-[#1A0033]" />
            </div>
           </div>
           <p className="font-bungee text-2xl text-[#1A0033] mb-6">
            START A COSMIC CONVERSATION!
           </p>
           <div className="space-y-3">
            <button
             onClick={() => {
              setInputMessage("What themes appear across all videos?");
              handleSendMessage({ preventDefault: () => {} } as any);
             }}
             className="block mx-auto px-6 py-3 bg-[#FF006E] text-white rounded-xl retro-border retro-shadow hover:translate-x-0.5 hover:translate-y-0.5 transition-all font-bebas text-lg"
            >
             "What themes appear across all videos?"
            </button>
            <button
             onClick={() => {
              setInputMessage("Summarize the key insights from my collection");
              handleSendMessage({ preventDefault: () => {} } as any);
             }}
             className="block mx-auto px-6 py-3 bg-[#8338EC] text-white rounded-xl retro-border retro-shadow hover:translate-x-0.5 hover:translate-y-0.5 transition-all font-bebas text-lg"
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
            <div className="flex items-start gap-4">
             <div className="relative">
              <div className="absolute inset-0 bg-[#8338EC] rounded-xl retro-border transform -rotate-3" />
              <div className="relative w-12 h-12 rounded-xl bg-[#00F5FF] flex items-center justify-center retro-border">
               <Radio className="w-6 h-6 text-[#1A0033] animate-pulse" />
              </div>
             </div>
             <div className="relative flex-1">
              <div className="absolute inset-0 bg-[#8338EC] rounded-2xl retro-border transform rotate-1" />
              <div className="relative bg-white rounded-2xl retro-border p-6">
               <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-[#FF006E] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-3 h-3 bg-[#FFBE0B] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-3 h-3 bg-[#00F5FF] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
               </div>
              </div>
             </div>
            </div>
           )}
          </>
         )}
        </div>

        <form onSubmit={handleSendMessage} className="p-5 border-t-4 border-[#1A0033] bg-white rounded-b-2xl">
         <div className="flex gap-3">
          <input
           type="text"
           value={inputMessage}
           onChange={(e) => setInputMessage(e.target.value)}
           placeholder="Ask cosmic questions about your videos..."
           disabled={fetcher.state === "submitting"}
           className="flex-1 px-5 py-3 bg-[#FFF3E0] rounded-xl font-space-mono text-[#1A0033] placeholder-[#8338EC]/50 focus:outline-none focus:ring-4 focus:ring-[#FF006E]/30 disabled:opacity-50 retro-border"
          />
          <button
           type="submit"
           disabled={fetcher.state === "submitting"}
           className="p-3 bg-[#FF006E] text-white rounded-xl retro-border retro-shadow hover:translate-x-0.5 hover:translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed wiggle-hover"
          >
           {fetcher.state === "submitting" ? (
            <Disc className="w-6 h-6 animate-spin" />
           ) : (
            <Send className="w-6 h-6" />
           )}
          </button>
         </div>
        </form>
       </div>
      </div>
     </div>

     <div className="hidden lg:block w-80">
      <div className="relative">
       <div className="absolute inset-0 bg-[#FF006E] rounded-2xl retro-border transform -rotate-1" />
       <div className="relative bg-white rounded-2xl retro-shadow-lg p-6 sticky top-8 retro-border">
        <h3 className="font-bungee text-xl text-[#1A0033] mb-6 flex items-center gap-3">
         <Tv className="w-6 h-6" />
         VIDEO REFS
        </h3>
        {referencedVideos.length === 0 ? (
         <p className="font-space-mono text-sm text-[#8338EC]">
          Videos referenced in the cosmic conversation will appear here!
         </p>
        ) : (
         <div className="space-y-4">
          {referencedVideos.map((video) => (
           <Link
            key={video.id}
            to={`/videos/${video.id}`}
            className="block group relative"
           >
            <div className="absolute inset-0 bg-[#8338EC] rounded-xl retro-border transform rotate-1 group-hover:rotate-2 transition-transform" />
            <div className="relative overflow-hidden rounded-xl retro-border retro-shadow hover:translate-x-0.5 hover:translate-y-0.5 transition-all">
             {video.thumbnail ? (
              <img
               src={video.thumbnail}
               alt={video.title}
               className="w-full h-32 object-cover"
              />
             ) : (
              <div className="w-full h-32 bg-gradient-to-br from-[#8338EC] to-[#FF006E] flex items-center justify-center">
               <Film className="w-10 h-10 text-white" />
              </div>
             )}
             <div className="absolute inset-0 bg-gradient-to-t from-[#1A0033]/90 via-transparent to-transparent" />
             <div className="absolute bottom-0 left-0 right-0 p-3">
              <p className="font-bebas text-white text-lg truncate">
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
  </div>
 );
}