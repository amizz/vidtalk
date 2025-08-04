import { useState, useEffect, useRef } from 'react';
import { Search, Download, FileText, Copy, Check } from 'lucide-react';

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
        <mark key={index} className="bg-yellow-200">{part}</mark> : 
        part
    );
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Transcript
          </h3>
          <div className="relative group">
            <button className="px-4 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-2 shadow-sm transition-all">
              <Download className="w-4 h-4" />
              Export
            </button>
            <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none group-hover:pointer-events-auto">
              <button
                onClick={() => handleExport('txt')}
                className="block w-full text-left px-4 py-2.5 text-sm hover:bg-gray-100 transition-colors"
              >
                Export as TXT
              </button>
              <button
                onClick={() => handleExport('srt')}
                className="block w-full text-left px-4 py-2.5 text-sm hover:bg-gray-100 transition-colors"
              >
                Export as SRT
              </button>
              <button
                onClick={() => handleExport('pdf')}
                className="block w-full text-left px-4 py-2.5 text-sm hover:bg-gray-100 transition-colors border-t border-gray-100"
              >
                Export as PDF
              </button>
            </div>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="search"
            placeholder="Search transcript..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all"
          />
        </div>
      </div>

      {/* Transcript Content */}
      <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredSegments.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No transcript segments found</p>
          </div>
        ) : (
          filteredSegments.map((segment, index) => {
            const isActive = segments.indexOf(segment) === activeSegmentIndex;
            
            return (
              <div
                key={segment.id}
                ref={isActive ? activeSegmentRef : null}
                onClick={() => onSegmentClick(segment.startTime)}
                className={`group cursor-pointer p-4 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-gradient-to-r from-blue-50 to-blue-100 shadow-md border-l-4 border-blue-500' 
                    : 'hover:bg-gray-50 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-sm text-blue-600 font-mono whitespace-nowrap pt-0.5 bg-blue-50 px-2 py-1 rounded">
                    {formatTime(segment.startTime)}
                  </span>
                  <div className="flex-1 min-w-0">
                    {segment.speaker && (
                      <p className="text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">
                        {highlightText(segment.speaker, searchQuery)}
                      </p>
                    )}
                    <p className="text-sm leading-relaxed text-gray-700">
                      {highlightText(segment.text, searchQuery)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(segment);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-all p-2 hover:bg-gray-200 rounded-lg"
                  >
                    {copiedId === segment.id ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Stats */}
      <div className="p-3 border-t border-gray-200 text-xs text-gray-500 bg-gray-50">
        <div className="flex items-center justify-between">
          <p>
            {searchQuery 
              ? `${filteredSegments.length} of ${segments.length} segments` 
              : `${segments.length} segments total`}
          </p>
          <p>Duration: {formatTime(segments[segments.length - 1]?.endTime || 0)}</p>
        </div>
      </div>
    </div>
  );
}