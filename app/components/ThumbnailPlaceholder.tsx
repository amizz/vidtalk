import { Film, Loader2 } from 'lucide-react';

interface ThumbnailPlaceholderProps {
  isLoading?: boolean;
  error?: boolean;
}

export default function ThumbnailPlaceholder({ isLoading = true, error = false }: ThumbnailPlaceholderProps) {
  return (
    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
      {error ? (
        <div className="text-center">
          <Film className="w-12 h-12 text-gray-400 mb-2" />
          <p className="text-xs text-gray-500">Thumbnail unavailable</p>
        </div>
      ) : isLoading ? (
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-gray-400 animate-spin mb-2" />
          <p className="text-xs text-gray-500">Generating thumbnail...</p>
        </div>
      ) : (
        <Film className="w-16 h-16 text-gray-400" />
      )}
    </div>
  );
}