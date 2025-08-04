import { useState, useEffect, useRef } from 'react';
import { Search, Download, FileText, Copy, Check, Tv, Radio, Music, Sparkles } from 'lucide-react';

interface TranscriptSegment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  speaker?: string;
}

interface TranscriptViewerProps {
  segments: TranscriptSegment[];
  currentTime: number;
  onSegmentClick: (startTime: number) => void;
}

export function TranscriptViewer({ segments, currentTime, onSegmentClick }: TranscriptViewerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const activeSegmentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Find active segment based on current time
  const activeSegmentIndex = segments.findIndex(
    seg => currentTime >= seg.startTime && currentTime < seg.endTime
  );

  // Auto-scroll to active segment
  useEffect(() => {
    if (activeSegmentRef.current && containerRef.current) {
      const container = containerRef.current;
      const element = activeSegmentRef.current;
      const elementTop = element.offsetTop;
      const elementHeight = element.offsetHeight;
      const containerHeight = container.offsetHeight;
      const scrollTop = container.scrollTop;

      // Check if element is not fully visible
      if (elementTop < scrollTop || elementTop + elementHeight > scrollTop + containerHeight) {
        container.scrollTo({
          top: elementTop - containerHeight / 2 + elementHeight / 2,
          behavior: 'smooth'
        });
      }
    }
  }, [activeSegmentIndex]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopy = async (segment: TranscriptSegment) => {
    try {
      await navigator.clipboard.writeText(segment.text);
      setCopiedId(segment.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleExport = (format: 'txt' | 'srt' | 'pdf') => {
    // This would be implemented with actual export logic
    console.log(`Exporting transcript as ${format}`);
  };

  const filteredSegments = segments.filter(segment =>
    segment.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (segment.speaker && segment.speaker.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === query.toLowerCase() ? 
        <mark key={index} className="bg-[#FFBE0B] text-[#1A0033] px-1 font-bold">{part}</mark> : 
        part
    );
  };

  return (
    <div className="h-full flex flex-col bg-[#FFF3E0] rounded-2xl overflow-hidden retro-border retro-shadow-lg">
      {/* Header */}
      <div className="p-5 border-b-4 border-[#1A0033] bg-gradient-to-r from-[#8338EC] to-[#FF006E]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bungee text-2xl text-white flex items-center gap-3">
            <Radio className="w-6 h-6" />
            TRANSCRIPT
          </h3>
          <div className="relative group">
            <button className="px-4 py-2 bg-[#FFBE0B] text-[#1A0033] rounded-xl retro-border retro-shadow hover:translate-x-0.5 hover:translate-y-0.5 transition-all font-bebas text-lg flex items-center gap-2">
              <Download className="w-5 h-5" />
              EXPORT
            </button>
            <div className="absolute top-full right-0 mt-3 bg-[#1A0033] rounded-xl retro-border retro-shadow opacity-0 group-hover:opacity-100 transition-all pointer-events-none group-hover:pointer-events-auto z-10">
              <button
                onClick={() => handleExport('txt')}
                className="block w-full text-left px-6 py-3 font-space-mono text-sm text-[#00F5FF] hover:bg-[#8338EC] hover:text-white transition-colors rounded-t-lg"
              >
                Export as TXT
              </button>
              <button
                onClick={() => handleExport('srt')}
                className="block w-full text-left px-6 py-3 font-space-mono text-sm text-[#00F5FF] hover:bg-[#8338EC] hover:text-white transition-colors"
              >
                Export as SRT
              </button>
              <button
                onClick={() => handleExport('pdf')}
                className="block w-full text-left px-6 py-3 font-space-mono text-sm text-[#00F5FF] hover:bg-[#8338EC] hover:text-white transition-colors rounded-b-lg border-t-2 border-[#8338EC]"
              >
                Export as PDF
              </button>
            </div>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <div className="absolute inset-0 bg-[#1A0033] rounded-xl retro-border transform translate-y-0.5" />
          <div className="relative bg-white rounded-xl retro-border">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#8338EC]" />
            <input
              type="search"
              placeholder="Search the groovy transcript..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 font-space-mono text-[#1A0033] rounded-xl bg-transparent focus:outline-none focus:ring-4 focus:ring-[#FF006E]/30"
            />
          </div>
        </div>
      </div>

      {/* Transcript Content */}
      <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
        {filteredSegments.length === 0 ? (
          <div className="text-center mt-16">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-[#8338EC] rounded-2xl retro-border transform -rotate-6" />
              <div className="relative w-24 h-24 bg-[#00F5FF] rounded-2xl flex items-center justify-center retro-border retro-shadow">
                <FileText className="w-12 h-12 text-[#1A0033]" />
              </div>
            </div>
            <p className="font-bungee text-xl text-[#1A0033]">NO TRANSCRIPT FOUND!</p>
            <p className="font-space-mono text-[#8338EC] mt-2">Try a different search term</p>
          </div>
        ) : (
          filteredSegments.map((segment, index) => {
            const isActive = segments.indexOf(segment) === activeSegmentIndex;
            
            return (
              <div
                key={segment.id}
                ref={isActive ? activeSegmentRef : null}
                onClick={() => onSegmentClick(segment.startTime)}
                className={`group cursor-pointer relative transition-all duration-200 ${
                  isActive ? 'scale-105' : 'hover:scale-102'
                }`}
              >
                <div className={`absolute inset-0 ${
                  isActive ? 'bg-[#FF006E]' : 'bg-[#8338EC]'
                } rounded-xl retro-border transform ${
                  isActive ? 'rotate-1' : 'rotate-0 group-hover:rotate-1'
                } transition-transform`} />
                
                <div className={`relative p-4 rounded-xl retro-border ${
                  isActive 
                    ? 'bg-[#FFBE0B]' 
                    : 'bg-[#FFF3E0] hover:bg-white'
                } transition-all`}>
                  <div className="flex items-start gap-4">
                    <div className={`${
                      isActive ? 'bg-[#1A0033] text-[#00F5FF]' : 'bg-[#8338EC] text-white'
                    } px-3 py-1 rounded-lg retro-border font-bebas text-lg`}>
                      {formatTime(segment.startTime)}
                    </div>
                    <div className="flex-1 min-w-0">
                      {segment.speaker && (
                        <p className="font-bungee text-sm text-[#FF006E] mb-2">
                          {highlightText(segment.speaker, searchQuery)}
                        </p>
                      )}
                      <p className={`font-space-mono text-base leading-relaxed ${
                        isActive ? 'text-[#1A0033]' : 'text-[#1A0033]/80'
                      }`}>
                        {highlightText(segment.text, searchQuery)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(segment);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-all p-2 bg-[#00F5FF] text-[#1A0033] rounded-lg retro-border hover:translate-x-0.5 hover:translate-y-0.5"
                    >
                      {copiedId === segment.id ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Copy className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  
                  {isActive && (
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#FF006E] rounded-full retro-border flex items-center justify-center animate-bounce">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Stats */}
      <div className="p-4 border-t-4 border-[#1A0033] bg-[#8338EC]">
        <div className="flex items-center justify-between font-space-mono text-white">
          <p className="flex items-center gap-2">
            <Music className="w-4 h-4" />
            {searchQuery 
              ? `${filteredSegments.length} OF ${segments.length} BEATS` 
              : `${segments.length} TOTAL BEATS`}
          </p>
          <p className="flex items-center gap-2">
            <Tv className="w-4 h-4" />
            {formatTime(segments[segments.length - 1]?.endTime || 0)}
          </p>
        </div>
      </div>
    </div>
  );
}