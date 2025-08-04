import { Film, Loader2, Tv, Radio } from 'lucide-react';

interface ThumbnailPlaceholderProps {
  isLoading?: boolean;
  error?: boolean;
}

export default function ThumbnailPlaceholder({ isLoading = true, error = false }: ThumbnailPlaceholderProps) {
  return (
    <div className="w-full h-full bg-gradient-to-br from-[#8338EC] to-[#FF006E] flex items-center justify-center relative overflow-hidden">
      {/* Retro Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(45deg, #FFBE0B 0, #FFBE0B 10px, transparent 10px, transparent 20px),
                            repeating-linear-gradient(-45deg, #00F5FF 0, #00F5FF 10px, transparent 10px, transparent 20px)`
        }} />
      </div>
      
      {error ? (
        <div className="text-center relative z-10">
          <div className="w-16 h-16 bg-[#1A0033] rounded-2xl flex items-center justify-center mx-auto mb-3 retro-border wiggle-hover">
            <Film className="w-8 h-8 text-[#FF006E]" />
          </div>
          <p className="font-bebas text-lg text-white">NO THUMBNAIL!</p>
        </div>
      ) : isLoading ? (
        <div className="text-center relative z-10">
          <div className="w-16 h-16 bg-[#FFBE0B] rounded-2xl flex items-center justify-center mx-auto mb-3 retro-border animate-pulse">
            <Radio className="w-8 h-8 text-[#1A0033] animate-spin" />
          </div>
          <p className="font-bebas text-lg text-white">COOKING...</p>
        </div>
      ) : (
        <div className="relative z-10">
          <div className="w-20 h-20 bg-[#00F5FF] rounded-2xl flex items-center justify-center retro-border float">
            <Tv className="w-12 h-12 text-[#1A0033]" />
          </div>
        </div>
      )}
    </div>
  );
}