import { useState, useEffect } from "react";
import { useSearchParams, useLoaderData, useFetcher } from "react-router";
import VideoCard from "~/components/VideoCard";
import { VideoUploadModal } from "~/components/VideoUploadModal";
import { Search, Upload, Menu, Loader2, Tv, Sparkles, Music } from "lucide-react";
import { useSidebar } from "~/contexts/SidebarContext";
import { useToast } from "~/contexts/ToastContext";
import type { LoaderFunctionArgs } from "react-router";
import { VidTalkAPI } from "../lib/api";
import type { CloudflareContext } from "~/types/types";
import type { MetaFunction } from "react-router";

export const meta: MetaFunction = () => {
 return [
  { title: "Video Vault" },
  { name: "description", content: "Video Vault" }
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

interface LoaderData {
 videos: Video[];
}

export async function loader({ context }: LoaderFunctionArgs<CloudflareContext>): Promise<LoaderData> {
 try {
  const api = new VidTalkAPI(context.cloudflare.env);
  const { videos } = await api.getVideos();
  
  // Transform the API response to match the frontend Video interface
  const transformedVideos = (videos || []).map((video: any) => ({
   id: video.id,
   title: video.title,
   thumbnail: video.thumbnail,
   thumbnailKey: video.thumbnailKey,
   duration: video.duration ? `${Math.floor(video.duration / 60)}:${(video.duration % 60).toString().padStart(2, '0')}` : '0:00',
   uploadDate: new Date(video.uploadedAt).toLocaleDateString(),
   status: video.status as 'transcribed' | 'processing' | 'failed',
   r2Key: video.url,
   url: video.url
  }));
  
  return { videos: transformedVideos };
 } catch (error) {
  console.error('Failed to load videos:', error);
  return { videos: [] };
 }
}

export default function VideosIndex() {
 const { videos: initialVideos } = useLoaderData<LoaderData>();
 const [searchParams, setSearchParams] = useSearchParams();
 const [searchQuery, setSearchQuery] = useState("");
 const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
 const [videos, setVideos] = useState(initialVideos);
 const [isLoading, setIsLoading] = useState(false);
 const { setIsOpen } = useSidebar();
 const fetcher = useFetcher();
 const { showToast } = useToast();
 
 useEffect(() => {
  if (searchParams.get("upload") === "true") {
   setIsUploadModalOpen(true);
   searchParams.delete("upload");
   setSearchParams(searchParams);
  }
 }, [searchParams, setSearchParams]);
 
 useEffect(() => {
  setVideos(initialVideos);
 }, [initialVideos]);
 
 // Refresh videos list
 const refreshVideos = async () => {
  setIsLoading(true);
  try {
   const response = await fetch('/api/videos');
   const data = await response.json() as { videos: Video[] };
   setVideos(data.videos || []);
  } catch (error) {
   console.error('Failed to refresh videos:', error);
   showToast('Failed to refresh videos', 'error');
  } finally {
   setIsLoading(false);
  }
 };
 
 const filteredVideos = videos.filter((video: Video) =>
  video.title.toLowerCase().includes(searchQuery.toLowerCase())
 );
 
 const handleVideoUpload = async (file: File, r2Key: string, id: string) => {
  // Create video record via API
  const formData = new FormData();
  formData.append('title', file.name.replace(/\.[^/.]+$/, ''));
  formData.append('filename', file.name);
  formData.append('url', r2Key); // Store the actual R2 key
  formData.append('description', '');
  formData.append('id', id);
  
  try {
   const response = await fetch('/api/videos', {
    method: 'POST',
    body: formData,
   });
   
   if (response.ok) {
    // Refresh the videos list
    await refreshVideos();
    showToast('Video uploaded successfully', 'success');
   } else {
    console.error('Failed to create video record');
    showToast('Failed to create video record', 'error');
   }
  } catch (error) {
   console.error('Error creating video:', error);
   showToast('Error uploading video', 'error');
  }
 };
 
 const handleDeleteVideo = async (videoId: string) => {
  if (!confirm('Are you sure you want to delete this video?')) return;
  
  try {
   const response = await fetch(`/api/videos/${videoId}`, {
    method: 'DELETE',
   });
   
   if (response.ok) {
    setVideos((prev: Video[]) => prev.filter((v: Video) => v.id !== videoId));
    showToast('Video deleted successfully', 'success');
   } else {
    console.error('Failed to delete video');
    showToast('Failed to delete video', 'error');
   }
  } catch (error) {
   console.error('Error deleting video:', error);
   showToast('Error deleting video', 'error');
  }
 };

 return (
  <div className="min-h-screen relative">
   <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {/* Mobile menu button */}
    <button 
     onClick={() => setIsOpen(true)}
     className="md:hidden mb-4 p-3 bg-[#FF006E] text-white rounded-xl retro-border retro-shadow hover:translate-x-0.5 hover:translate-y-0.5 transition-all duration-200 wiggle-hover"
    >
     <Menu className="w-6 h-6" />
    </button>
    
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
     <div className="relative">
      <div className="absolute -top-6 -left-6 w-16 h-16 bg-[#FFBE0B] rounded-full retro-border animate-bounce opacity-50" />
      <h1 className="font-bungee-shade text-5xl text-[#1A0033] transform -rotate-2">
       VIDEO VAULT
      </h1>
      <p className="mt-2 font-bebas text-2xl text-[#8338EC] tracking-wider">
       Your groovy video collection awaits!
      </p>
     </div>
     <div className="flex gap-3">
      <button
       onClick={refreshVideos}
       disabled={isLoading}
       className="p-3 bg-[#00F5FF] text-[#1A0033] rounded-xl retro-border retro-shadow hover:translate-x-0.5 hover:translate-y-0.5 transition-all duration-200 disabled:opacity-50 wiggle-hover"
       title="Refresh videos"
      >
       <Loader2 className={`w-6 h-6 ${isLoading ? 'animate-spin' : ''}`} />
      </button>
      <button
       onClick={() => setIsUploadModalOpen(true)}
       className="flex items-center gap-3 px-6 py-3 bg-[#FF006E] text-white rounded-xl retro-border retro-shadow-lg hover:translate-x-0.5 hover:translate-y-0.5 transition-all duration-200 font-bungee wiggle-hover"
      >
       <Upload className="w-6 h-6" />
       DROP BEATS
      </button>
     </div>
    </div>

    <div className="relative mb-10 max-w-2xl">
     <div className="absolute inset-0 bg-[#8338EC] rounded-2xl retro-border transform rotate-1" />
     <div className="relative bg-white rounded-2xl retro-border retro-shadow">
      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#8338EC] w-6 h-6" />
      <input
       type="text"
       placeholder="Search for rad videos..."
       value={searchQuery}
       onChange={(e) => setSearchQuery(e.target.value)}
       className="w-full pl-12 pr-6 py-4 bg-transparent font-space-mono text-lg text-[#1A0033] placeholder-[#8338EC]/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#FF006E]/30"
      />
     </div>
    </div>

    {filteredVideos.length === 0 ? (
     <div className="text-center py-16">
      <div className="inline-block">
       <div className="w-32 h-32 bg-[#FF6B35] rounded-full flex items-center justify-center retro-border retro-shadow mx-auto mb-6 animate-pulse">
        <Tv className="w-16 h-16 text-white" />
       </div>
       <p className="font-bungee text-2xl text-[#1A0033] mb-2">NO VIDEOS YET!</p>
       <p className="font-space-mono text-[#8338EC]">Time to upload some groovy content!</p>
      </div>
     </div>
    ) : (
     <>
      {/* Decorative Header */}
      <div className="flex items-center gap-4 mb-8">
       <div className="flex gap-2">
        <div className="w-4 h-4 bg-[#FF006E] rounded-full retro-border" />
        <div className="w-4 h-4 bg-[#FFBE0B] rounded-full retro-border" />
        <div className="w-4 h-4 bg-[#00F5FF] rounded-full retro-border" />
       </div>
       <h2 className="font-bebas text-2xl text-[#1A0033] tracking-wide">
        {filteredVideos.length} RADICAL {filteredVideos.length === 1 ? 'VIDEO' : 'VIDEOS'}
       </h2>
       <div className="flex-1 h-1 bg-gradient-to-r from-[#FF006E] via-[#8338EC] to-[#00F5FF] rounded-full" />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
       {filteredVideos.map((video: Video) => (
        <VideoCard 
         key={video.id} 
         video={video}
         onDelete={() => handleDeleteVideo(video.id)}
        />
       ))}
      </div>
     </>
    )}
    
    {/* Decorative Footer */}
    <div className="mt-16 flex justify-center gap-4">
     <Music className="w-8 h-8 text-[#FF006E] animate-bounce" />
     <Sparkles className="w-8 h-8 text-[#8338EC] animate-bounce" style={{ animationDelay: '0.2s' }} />
     <Tv className="w-8 h-8 text-[#00F5FF] animate-bounce" style={{ animationDelay: '0.4s' }} />
    </div>
   </div>

   <VideoUploadModal
    isOpen={isUploadModalOpen}
    onClose={() => setIsUploadModalOpen(false)}
    onUpload={handleVideoUpload}
   />
  </div>
 );
}