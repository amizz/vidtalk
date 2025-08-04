import { useState, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  Maximize2,
  SkipBack,
  SkipForward,
  Settings,
  Tv,
  Radio,
  Music,
  Disc
} from 'lucide-react';

interface VideoPlayerProps {
  videoUrl?: string;
  title: string;
  onTimeUpdate?: (currentTime: number) => void;
  onSeek?: (time: number) => void;
}

export function VideoPlayer({ videoUrl, title, onTimeUpdate, onSeek }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      setCurrentTime(current);
      setDuration(videoRef.current.duration);
      onTimeUpdate?.(current);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current && progressRef.current) {
      const rect = progressRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;
      const percentage = clickX / width;
      const newTime = percentage * duration;
      
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      onSeek?.(newTime);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const skip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlaybackRateChange = (rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
    }
  };

  return (
    <div className="relative bg-[#1A0033] rounded-2xl overflow-hidden retro-border retro-shadow-lg group">
      <div 
        className="relative w-full h-full"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(isPlaying ? false : true)}
      >
        {videoUrl ? (
          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            src={videoUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleTimeUpdate}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#2D1B69] min-h-[400px]">
            <div className="text-center">
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-[#FF006E] rounded-3xl retro-border transform rotate-6" />
                <div className="relative w-32 h-32 bg-[#FFBE0B] rounded-3xl flex items-center justify-center retro-border retro-shadow float">
                  <Tv className="w-16 h-16 text-[#1A0033]" />
                </div>
              </div>
              <p className="font-bungee text-2xl text-[#00F5FF] mb-2">NO VIDEO YET!</p>
              <p className="font-space-mono text-[#FF006E]">Upload a groovy video to start jamming</p>
            </div>
          </div>
        )}

        {/* Retro TV Frame */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-4 left-4 w-8 h-8 bg-[#FF006E] rounded-full retro-border animate-pulse" />
          <div className="absolute top-4 right-4 w-8 h-8 bg-[#00F5FF] rounded-full retro-border animate-pulse" style={{ animationDelay: '0.5s' }} />
        </div>

        {/* Controls Overlay */}
        <div className={`absolute inset-0 bg-gradient-to-t from-[#1A0033]/90 via-transparent to-[#1A0033]/50 transition-opacity ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}>
          {/* Title */}
          <div className="absolute top-0 left-0 right-0 p-6">
            <div className="bg-[#8338EC] px-6 py-3 rounded-2xl retro-border retro-shadow inline-block">
              <h3 className="font-bungee text-xl text-white flex items-center gap-3">
                <Radio className="w-6 h-6" />
                {title}
              </h3>
            </div>
          </div>

          {/* Center Play Button */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={togglePlay}
                className="relative group wiggle-hover"
              >
                <div className="absolute inset-0 bg-[#FF006E] rounded-full retro-border transform rotate-3 group-hover:rotate-6 transition-transform" />
                <div className="relative w-28 h-28 bg-[#FFBE0B] rounded-full flex items-center justify-center retro-border retro-shadow-lg hover:translate-x-1 hover:translate-y-1 transition-transform">
                  <Play className="w-14 h-14 text-[#1A0033] ml-2" />
                </div>
              </button>
            </div>
          )}

          {/* Bottom Controls */}
          <div className="absolute bottom-0 left-0 right-0 p-6 space-y-4">
            {/* Progress Bar */}
            <div className="relative">
              <div className="absolute inset-0 bg-[#8338EC] rounded-full retro-border transform translate-y-0.5" />
              <div 
                ref={progressRef}
                className="relative h-3 bg-[#2D1B69] rounded-full cursor-pointer retro-border overflow-hidden"
                onClick={handleProgressClick}
              >
                <div 
                  className="absolute h-full bg-gradient-to-r from-[#FF006E] to-[#00F5FF] transition-all"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
                <div 
                  className="absolute w-6 h-6 bg-[#FFBE0B] rounded-full retro-border -top-1.5 transition-all wiggle-hover"
                  style={{ left: `${(currentTime / duration) * 100}%`, transform: 'translateX(-50%)' }}
                >
                  <Disc className="w-full h-full p-1 animate-spin" style={{ animationDuration: '2s' }} />
                </div>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlay}
                  className="p-3 bg-[#FF006E] text-white rounded-xl retro-border retro-shadow hover:translate-x-0.5 hover:translate-y-0.5 transition-all wiggle-hover"
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                </button>

                <button
                  onClick={() => skip(-10)}
                  className="p-3 bg-[#8338EC] text-white rounded-xl retro-border retro-shadow hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                >
                  <SkipBack className="w-5 h-5" />
                </button>

                <button
                  onClick={() => skip(10)}
                  className="p-3 bg-[#8338EC] text-white rounded-xl retro-border retro-shadow hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                >
                  <SkipForward className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3 ml-4">
                  <button
                    onClick={toggleMute}
                    className="p-3 bg-[#00F5FF] text-[#1A0033] rounded-xl retro-border retro-shadow hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                  >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                  <div className="relative">
                    <div className="absolute inset-0 bg-[#FF6B35] rounded-full retro-border transform translate-y-0.5" />
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="relative w-24 h-2 bg-[#2D1B69] rounded-full cursor-pointer appearance-none retro-border
                               [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                               [&::-webkit-slider-thumb]:bg-[#FFBE0B] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:retro-border"
                    />
                  </div>
                </div>

                <div className="bg-[#1A0033] px-4 py-2 rounded-xl retro-border ml-4">
                  <span className="font-bebas text-lg text-[#00F5FF]">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative group/speed">
                  <button className="p-3 bg-[#FFBE0B] text-[#1A0033] rounded-xl retro-border retro-shadow hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center gap-2">
                    <Music className="w-5 h-5" />
                    <span className="font-bebas text-lg">{playbackRate}x</span>
                  </button>
                  <div className="absolute bottom-full right-0 mb-3 bg-[#1A0033] rounded-xl retro-border retro-shadow opacity-0 group-hover/speed:opacity-100 transition-all pointer-events-none group-hover/speed:pointer-events-auto">
                    <div className="p-2 space-y-1">
                      {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                        <button
                          key={rate}
                          onClick={() => handlePlaybackRateChange(rate)}
                          className={`block w-full text-left px-4 py-2 rounded-lg font-space-mono text-sm transition-colors ${
                            playbackRate === rate ? 'bg-[#FF006E] text-white' : 'text-[#00F5FF] hover:bg-[#8338EC] hover:text-white'
                          }`}
                        >
                          {rate}x
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button className="p-3 bg-[#8338EC] text-white rounded-xl retro-border retro-shadow hover:translate-x-0.5 hover:translate-y-0.5 transition-all">
                  <Maximize2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}