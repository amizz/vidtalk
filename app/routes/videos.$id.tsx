import { useState } from "react";
import { useParams, Link, useLoaderData, useNavigate } from "react-router";
import { VideoPlayer } from "~/components/VideoPlayer";
import { TranscriptViewer } from "~/components/TranscriptViewer";
import { ChatMessage } from "~/components/ChatMessage";
import { ArrowLeft, Send, X, MessageCircle, Trash2, Tv, Radio, Music, Sparkles } from "lucide-react";
import { useToast } from "~/contexts/ToastContext";
import type { LoaderFunctionArgs } from "react-router";
import type { CloudflareContext } from "~/types/types";
import { VidTalkAPI } from "~/lib/api";
import type { MetaFunction } from "react-router";

export const meta: MetaFunction = () => {
 return [
  { title: "Groovy Video" },
  { name: "description", content: "Groovy Video" }
 ];
};

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

interface TranscriptSegment {
 id: string;
 text: string;
 startTime: number;
 endTime: number;
 speaker?: string | null;
 confidence?: number | null;
 order: number;
}

interface LoaderData {
 video: Video | null;
 videoUrl: string | null;
 transcript: {
  transcript: {
   id: string;
   videoId: string;
   content: string;
   language?: string | null;
   createdAt: Date;
  };
  segments: TranscriptSegment[];
 } | null;
}

export async function loader({ params, context }: LoaderFunctionArgs<CloudflareContext>): Promise<LoaderData> {
 try {
  const api = new VidTalkAPI(context.cloudflare.env);
  const { video } = await api.getVideo(params.id!);
  
  if (!video) {
   return { video: null, videoUrl: null, transcript: null };
  }
  
  // Transform the API response to match the frontend Video interface
  const transformedVideo: Video = {
   id: video.id,
   title: video.title,
   duration: video.duration ? `${Math.floor(video.duration / 60)}:${(video.duration % 60).toString().padStart(2, '0')}` : '0:00',
   uploadDate: new Date(video.uploadedAt).toLocaleDateString(),
   status: video.status as 'transcribed' | 'processing' | 'failed',
   r2Key: video.url,
   url: video.url
  };
  
  // Fetch transcript data
  let transcript = null;
  if (video.status === 'completed' || video.status === 'transcribed') {
   try {
    transcript = await api.getTranscriptWithSegments(video.id);
   } catch (err) {
    console.error('Failed to load transcript:', err);
   }
  }
  
  return { 
   video: transformedVideo, 
   videoUrl: `${context.cloudflare.env.R2_PUBLIC_URL}/${video.url}`,
   transcript 
  };
 } catch (error) {
  console.error('Failed to load video:', error);
  return { video: null, videoUrl: null, transcript: null };
 }
}

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
 const { video, videoUrl, transcript } = useLoaderData<LoaderData>();
 
 const [messages, setMessages] = useState(mockMessages);
 const [inputMessage, setInputMessage] = useState("");
 const [currentTime, setCurrentTime] = useState(0);
 const [isChatOpen, setIsChatOpen] = useState(false);
 const [isDeleting, setIsDeleting] = useState(false);
 
 if (!video) {
  return (
   <div className="flex h-screen items-center justify-center bg-[#FFF3E0]">
    <div className="text-center">
     <div className="relative inline-block mb-6">
      <div className="absolute inset-0 bg-[#FF006E] rounded-3xl retro-border transform rotate-6" />
      <div className="relative w-32 h-32 bg-[#FFBE0B] rounded-3xl flex items-center justify-center retro-border retro-shadow">
       <Tv className="w-16 h-16 text-[#1A0033]" />
      </div>
     </div>
     <h1 className="font-bungee text-3xl text-[#1A0033] mb-4">
      VIDEO NOT FOUND!
     </h1>
     <Link
      to="/videos"
      className="inline-flex items-center gap-2 px-6 py-3 bg-[#8338EC] text-white rounded-xl retro-border retro-shadow hover:translate-x-0.5 hover:translate-y-0.5 transition-all font-bebas text-xl"
     >
      <ArrowLeft className="w-5 h-5" />
      Back to Vault
     </Link>
    </div>
   </div>
  );
 }

 const handleDeleteVideo = async () => {
  if (!confirm('Are you sure you want to delete this groovy video?')) return;
  
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
  <div className="flex h-screen overflow-hidden bg-[#FFF3E0]">
   {/* Main content area */}
   <div className="flex-1 flex flex-col min-w-0">
    {/* Header */}
    <div className="bg-[#1A0033] border-b-4 border-[#FF006E] z-10">
     <div className="px-6 py-4 flex items-center justify-between">
      <Link
       to="/videos"
       className="inline-flex items-center gap-2 px-4 py-2 bg-[#8338EC] text-white rounded-xl retro-border retro-shadow hover:translate-x-0.5 hover:translate-y-0.5 transition-all font-bebas text-lg"
      >
       <ArrowLeft className="w-5 h-5" />
       Back to Vault
      </Link>
      <button
       onClick={handleDeleteVideo}
       disabled={isDeleting}
       className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF006E] text-white rounded-xl retro-border retro-shadow hover:translate-x-0.5 hover:translate-y-0.5 transition-all disabled:opacity-50 font-bebas text-lg wiggle-hover"
       title="Delete video"
      >
       <Trash2 className="w-5 h-5" />
       <span className="hidden sm:inline">DELETE</span>
      </button>
     </div>
    </div>

    {/* Video content */}
    <div className="flex-1 overflow-y-auto">
     <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Video player */}
      <div className="relative">
       <div className="absolute inset-0 bg-[#8338EC] rounded-2xl retro-border transform rotate-1" />
       <div className="relative w-full aspect-video rounded-2xl overflow-hidden retro-shadow-lg">
        <VideoPlayer
         videoUrl={videoUrl || undefined}
         title={video.title}
         onTimeUpdate={setCurrentTime}
        />
       </div>
      </div>
      
      <div className="mt-8 mb-8 flex items-center gap-4">
       <div className="w-16 h-16 bg-[#FF006E] rounded-xl flex items-center justify-center retro-border wiggle-hover">
        <Music className="w-8 h-8 text-white" />
       </div>
       <h1 className="font-bungee text-3xl sm:text-4xl text-[#1A0033]">
        {video.title}
       </h1>
      </div>

      {transcript && transcript.segments.length > 0 ? (
       <TranscriptViewer
        segments={transcript.segments.map((segment) => ({
         id: segment.id,
         startTime: segment.startTime,
         endTime: segment.endTime,
         text: segment.text
        }))}
        currentTime={currentTime}
        onSegmentClick={handleTimestampClick}
       />
      ) : (
       <div className="relative">
        <div className="absolute inset-0 bg-[#8338EC] rounded-2xl retro-border transform -rotate-1" />
        <div className="relative bg-white rounded-2xl retro-border retro-shadow p-12 text-center">
         <Radio className="w-16 h-16 mx-auto text-[#8338EC] mb-4 animate-pulse" />
         <p className="font-bebas text-2xl text-[#1A0033]">
          {video.status === 'processing' 
           ? 'TRANSCRIPT COOKING...' 
           : 'NO TRANSCRIPT YET!'}
         </p>
        </div>
       </div>
      )}
     </div>
    </div>
   </div>

   {/* Chat button - visible on all screen sizes */}
   <button
    className="fixed bottom-6 right-6 p-4 bg-[#FF006E] text-white rounded-2xl retro-border retro-shadow-lg hover:translate-x-0.5 hover:translate-y-0.5 transition-all z-50 wiggle-hover"
    onClick={() => setIsChatOpen(true)}
   >
    <MessageCircle className="w-7 h-7" />
   </button>

   {/* Chat modal - works on all screen sizes */}
   {isChatOpen && (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-end sm:items-center sm:justify-center">
     <div className="relative w-full sm:max-w-lg h-[90vh] sm:h-[80vh] bounce-in">
      <div className="absolute inset-0 bg-[#8338EC] rounded-t-3xl sm:rounded-3xl retro-border transform -rotate-1" />
      <div className="relative bg-white w-full h-full rounded-t-3xl sm:rounded-3xl flex flex-col retro-border">
       <div className="flex items-center justify-between px-5 py-4 border-b-4 border-[#1A0033] bg-gradient-to-r from-[#FF006E] to-[#8338EC] rounded-t-3xl">
        <div>
         <h2 className="font-bungee text-xl text-white flex items-center gap-2">
          <Radio className="w-5 h-5" />
          AI CHAT
         </h2>
         <p className="font-space-mono text-xs text-white/80">
          Ask groovy questions
         </p>
        </div>
        <button
         onClick={() => setIsChatOpen(false)}
         className="p-2 bg-[#FFBE0B] text-[#1A0033] rounded-lg retro-border hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
        >
         <X className="w-5 h-5" />
        </button>
       </div>

       <div className="flex-1 overflow-y-auto px-4 py-6 bg-[#FFF3E0]">
        <div className="space-y-6">
         {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
         ))}
        </div>
       </div>

       <form onSubmit={handleSendMessage} className="px-4 py-4 border-t-4 border-[#1A0033] bg-white">
        <div className="flex gap-3">
         <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Ask something rad..."
          className="flex-1 px-4 py-3 bg-[#FFF3E0] border-3 border-[#8338EC] rounded-xl font-space-mono text-[#1A0033] placeholder-[#8338EC]/50 focus:outline-none focus:ring-4 focus:ring-[#FF006E]/30 retro-border"
         />
         <button
          type="submit"
          className="p-3 bg-[#FF006E] text-white rounded-xl retro-border retro-shadow hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
         >
          <Send className="w-6 h-6" />
         </button>
        </div>
       </form>
      </div>
     </div>
    </div>
   )}
  </div>
 );
}