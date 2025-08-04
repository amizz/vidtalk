import { Link } from 'react-router';
import { Play, Clock, CheckCircle, Loader, AlertCircle, Trash2, Tv, Radio, Film } from 'lucide-react';
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
          <div className="flex items-center gap-1 px-2 py-1 bg-[#00F5FF] text-[#1A0033] rounded-lg retro-border font-space-mono text-xs">
            <CheckCircle className="w-4 h-4" />
            <span>READY</span>
          </div>
        );
      case 'processing':
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-[#FFBE0B] text-[#1A0033] rounded-lg retro-border font-space-mono text-xs">
            <Radio className="w-4 h-4 animate-pulse" />
            <span>COOKING</span>
          </div>
        );
      case 'failed':
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-[#FF006E] text-white rounded-lg retro-border font-space-mono text-xs">
            <AlertCircle className="w-4 h-4" />
            <span>OOPS</span>
          </div>
        );
    }
  };

  return (
    <div className="relative group transform transition-all duration-200 hover:scale-105">
      <div className="absolute inset-0 bg-[#8338EC] rounded-2xl retro-border transform rotate-3 group-hover:rotate-6 transition-transform duration-200" />
      <div className="relative bg-white rounded-2xl overflow-hidden retro-border retro-shadow hover:translate-x-1 hover:translate-y-1 transition-transform duration-200">
        <Link
          to={`/videos/${video.id}`}
          className="block"
        >
        <div className="relative aspect-video bg-[#2D1B69]">
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
          
          {/* Play Button Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1A0033]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="w-16 h-16 bg-[#FF006E] rounded-full flex items-center justify-center retro-border retro-shadow wiggle-hover">
              <Play className="w-8 h-8 text-white ml-1" />
            </div>
          </div>
          
          {/* Duration Badge */}
          <div className="absolute bottom-3 right-3 px-3 py-1 bg-[#FFBE0B] text-[#1A0033] font-bebas text-lg rounded-lg retro-border">
            {video.duration}
          </div>
          
          {/* Retro TV Icon */}
          <div className="absolute top-3 left-3 w-10 h-10 bg-[#FF6B35] rounded-full flex items-center justify-center retro-border wiggle-hover">
            <Tv className="w-6 h-6 text-white" />
          </div>
        </div>
        
        <div className="p-4 bg-[#FFF3E0]">
          <h3 className="font-bungee text-lg text-[#1A0033] mb-3 line-clamp-2">
            {video.title}
          </h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-space-mono text-sm text-[#8338EC]">
              <Clock className="w-4 h-4" />
              <span>{video.uploadDate}</span>
            </div>
            {getStatusBadge()}
          </div>
        </div>
        </Link>
        
        {/* Delete Button */}
        {onDelete && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete(video.id);
            }}
            className="absolute top-3 right-3 p-2 bg-[#FF006E] text-white rounded-lg retro-border opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-[#FF006E]/80 wiggle-hover"
            title="Delete video"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}