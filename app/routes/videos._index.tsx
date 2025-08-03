import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import VideoCard from "~/components/VideoCard";
import { VideoUploadModal } from "~/components/VideoUploadModal";
import { Search, Upload, Menu } from "lucide-react";
import { useSidebar } from "~/contexts/SidebarContext";

const mockVideos = [
  {
    id: "1",
    title: "Getting Started with React Router v7",
    thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=300&h=200&fit=crop",
    duration: "12:34",
    uploadDate: "2024-01-15",
    status: "transcribed" as const,
  },
  {
    id: "2",
    title: "Building Modern Web Apps",
    thumbnail: "https://images.unsplash.com/photo-1619410283995-43d9134e7656?w=300&h=200&fit=crop",
    duration: "8:45",
    uploadDate: "2024-01-14",
    status: "processing" as const,
  },
  {
    id: "3",
    title: "AI and the Future of Development",
    thumbnail: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=300&h=200&fit=crop",
    duration: "15:20",
    uploadDate: "2024-01-13",
    status: "transcribed" as const,
  },
];

export default function VideosIndex() {
  console.log('VideosIndex component rendering');
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [videos, setVideos] = useState(mockVideos);
  const { setIsOpen } = useSidebar();
  
  useEffect(() => {
    if (searchParams.get("upload") === "true") {
      setIsUploadModalOpen(true);
      searchParams.delete("upload");
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);
  
  const filteredVideos = videos.filter(video =>
    video.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleVideoUpload = (file: File, r2Key: string) => {
    // Add new video to the list
    const newVideo = {
      id: Date.now().toString(),
      title: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension
      thumbnail: `/api/video/${r2Key}/thumbnail`, // We'll need to implement thumbnail generation
      duration: "0:00", // Will be updated after processing
      uploadDate: new Date().toISOString().split('T')[0],
      status: "processing" as const,
      r2Key: r2Key,
    };
    
    setVideos(prev => [newVideo, ...prev]);
    
    // TODO: Trigger video processing via Durable Object
    console.log('Video uploaded with R2 key:', r2Key);
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
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg hover:from-blue-700 hover:to-teal-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            <Upload className="w-5 h-5" />
            Upload Video
          </button>
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
            {filteredVideos.map((video) => (
              <VideoCard key={video.id} video={video} />
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