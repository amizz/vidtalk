import { Link } from 'react-router';
import { Play, Clock, CheckCircle, Loader, AlertCircle, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import ThumbnailPlaceholder from './ThumbnailPlaceholder';

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

interface VideoCardProps {
  video: Video;
  onDelete?: (videoId: string) => void;
}

export default function VideoCard({ video, onDelete }: VideoCardProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [thumbnailLoading, setThumbnailLoading] = useState(true);
  const [thumbnailError, setThumbnailError] = useState(false);

  useEffect(() => {
    let mounted = true;
    let retryCount = 0;
    const maxRetries = 10;
    const retryDelay = 3000; // 3 seconds

    const checkThumbnail = async () => {
      // If we have a thumbnail URL already, use it
      if (video.thumbnail) {
        setThumbnailUrl(video.thumbnail);
        setThumbnailLoading(false);
        return;
      }

      // If video is processing, keep checking for thumbnail
      if (video.status === 'processing' || !video.thumbnailKey) {
        // Generate expected thumbnail key based on video URL
        const videoKey = video.url || video.r2Key || '';
        const expectedThumbnailKey = videoKey.replace(/\.[^/.]+$/, '_thumb.jpg');
        
        try {
          const response = await fetch(`/api/thumbnail/${encodeURIComponent(expectedThumbnailKey)}`);
          if (response.ok) {
            const data = await response.json() as { url?: string; key?: string; exists?: boolean };
            if (mounted && data.url) {
              setThumbnailUrl(data.url);
              setThumbnailLoading(false);
            }
          } else if (response.status === 404 && retryCount < maxRetries) {
            // Thumbnail not ready yet, retry
            retryCount++;
            setTimeout(() => {
              if (mounted) checkThumbnail();
            }, retryDelay);
          } else {
            // Give up after max retries
            if (mounted) {
              setThumbnailError(true);
              setThumbnailLoading(false);
            }
          }
        } catch (error) {
          console.error('Error checking thumbnail:', error);
          if (mounted) {
            setThumbnailError(true);
            setThumbnailLoading(false);
          }
        }
      }
    };

    checkThumbnail();

    return () => {
      mounted = false;
    };
  }, [video]);
  const getStatusBadge = () => {
    switch (video.status) {
      case 'transcribed':
        return (
          <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
            <CheckCircle className="w-4 h-4" />
            <span className="text-xs">Transcribed</span>
          </div>
        );
      case 'processing':
        return (
          <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
            <Loader className="w-4 h-4 animate-spin" />
            <span className="text-xs">Processing</span>
          </div>
        );
      case 'failed':
        return (
          <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs">Failed</span>
          </div>
        );
    }
  };

  return (
    <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-200 overflow-hidden group hover:scale-[1.02]">
      <Link
        to={`/videos/${video.id}`}
        className="block"
      >
      <div className="relative aspect-video bg-gray-200 dark:bg-gray-700">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover"
            onError={() => {
              setThumbnailError(true);
              setThumbnailUrl(null);
            }}
          />
        ) : (
          <ThumbnailPlaceholder isLoading={thumbnailLoading} error={thumbnailError} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <Play className="w-8 h-8 text-white ml-1" />
          </div>
        </div>
        <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 backdrop-blur-sm text-white text-xs rounded">
          {video.duration}
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
          {video.title}
        </h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-sm">
            <Clock className="w-4 h-4" />
            <span>{video.uploadDate}</span>
          </div>
          {getStatusBadge()}
        </div>
      </div>
      </Link>
      {onDelete && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete(video.id);
          }}
          className="absolute top-2 right-2 p-2 bg-white/20 dark:bg-black/20 backdrop-blur-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-500 hover:text-white"
          title="Delete video"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}