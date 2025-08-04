import { useState, useEffect } from "react";
import { useSearchParams, useLoaderData, useFetcher } from "react-router";
import VideoCard from "~/components/VideoCard";
import { VideoUploadModal } from "~/components/VideoUploadModal";
import { Search, Upload, Menu, Loader2 } from "lucide-react";
import { useSidebar } from "~/contexts/SidebarContext";
import { useToast } from "~/contexts/ToastContext";
import type { LoaderFunctionArgs } from "react-router";
import { VidTalkAPI } from "../lib/api";
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
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mobile menu button */}
        <button 
          onClick={() => setIsOpen(true)}
          className="md:hidden mb-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
        >
          <Menu className="w-6 h-6" />
        </button>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Video Library
            </h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              Manage and chat with your video collection
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={refreshVideos}
              disabled={isLoading}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh videos"
            >
              <Loader2 className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg hover:from-blue-700 hover:to-teal-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <Upload className="w-5 h-5" />
              Upload Video
            </button>
          </div>
        </div>

        <div className="relative mb-8 max-w-2xl">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search videos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white placeholder-gray-400"
          />
        </div>

        {filteredVideos.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 dark:text-gray-400">No videos found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredVideos.map((video: Video) => (
              <VideoCard 
                key={video.id} 
                video={video}
                onDelete={() => handleDeleteVideo(video.id)}
              />
            ))}
          </div>
        )}
      </div>

      <VideoUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleVideoUpload}
      />
    </div>
  );
}