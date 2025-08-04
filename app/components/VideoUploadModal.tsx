import { useState, useRef } from 'react';
import { X, Upload, FileVideo, Loader2, Tv, Music, Radio, Sparkles } from 'lucide-react';
import { useToast } from '~/contexts/ToastContext';

interface VideoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File, r2Key: string, id: string) => void;
}

export function VideoUploadModal({ isOpen, onClose, onUpload }: VideoUploadModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('video/')) {
        setSelectedFile(file);
      } else {
        showToast('Please select a video file', 'error');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    
    try {
      // Get presigned URL from server
      const id = crypto.randomUUID();
      const formData = new FormData();
      formData.append('fileName', selectedFile.name);
      formData.append('fileType', selectedFile.type);
      formData.append('id', id);
      
      const response = await fetch('/api/upload-url', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to get upload URL');
      }
      
      const { uploadUrl, key } = await response.json() as { uploadUrl: string; key: string };
      
      // Upload directly to R2 using presigned URL
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: selectedFile,
        headers: {
          'Content-Type': selectedFile.type,
        },
      });
      
      if (!uploadResponse.ok) {
        throw new Error('Failed to upload video');
      }
      
      // Notify parent component of successful upload
      await onUpload(selectedFile, key, id);
      
      setSelectedFile(null);
      onClose();
    } catch (error) {
      console.error('Upload error:', error);
      showToast('Failed to upload video. Please try again.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative bounce-in">
        <div className="absolute inset-0 bg-[#8338EC] rounded-3xl retro-border transform rotate-3" />
        <div className="relative bg-[#FFF3E0] rounded-3xl retro-border retro-shadow-lg w-full max-w-2xl m-4">
          <div className="flex items-center justify-between p-6 border-b-4 border-[#1A0033]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#FF006E] rounded-2xl flex items-center justify-center retro-border wiggle-hover">
                <Upload className="w-7 h-7 text-white" />
              </div>
              <h2 className="font-bungee text-3xl text-[#1A0033]">DROP THE BEAT!</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-[#FF006E] text-white rounded-xl retro-border hover:translate-x-0.5 hover:translate-y-0.5 transition-all duration-200 wiggle-hover"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="p-8">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative border-4 border-dashed rounded-2xl p-12 text-center transition-all duration-200 ${
                isDragging 
                  ? 'border-[#FF006E] bg-[#FF006E]/10 scale-105' 
                  : 'border-[#8338EC] bg-white'
              }`}
            >
              {/* Decorative Elements */}
              <div className="absolute top-4 left-4 w-8 h-8 bg-[#FFBE0B] rounded-full retro-border animate-bounce" />
              <div className="absolute top-4 right-4 w-8 h-8 bg-[#00F5FF] rounded-full retro-border animate-bounce" style={{ animationDelay: '0.3s' }} />
              <div className="absolute bottom-4 left-4 w-8 h-8 bg-[#FF6B35] rounded-full retro-border animate-bounce" style={{ animationDelay: '0.6s' }} />
              <div className="absolute bottom-4 right-4 w-8 h-8 bg-[#8338EC] rounded-full retro-border animate-bounce" style={{ animationDelay: '0.9s' }} />
              
              <Tv className="w-24 h-24 mx-auto mb-6 text-[#8338EC] float" />
              <p className="font-bungee text-2xl text-[#1A0033] mb-3">
                DRAG YOUR VIDEO HERE
              </p>
              <p className="font-bebas text-xl text-[#FF006E] mb-6">
                or click to browse
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-8 py-4 bg-[#FF006E] text-white rounded-xl retro-border retro-shadow hover:translate-x-0.5 hover:translate-y-0.5 transition-all duration-200 font-bungee text-lg wiggle-hover"
              >
                CHOOSE FILE
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <div className="mt-6 flex justify-center gap-2">
                <Music className="w-6 h-6 text-[#FF006E] animate-pulse" />
                <Radio className="w-6 h-6 text-[#8338EC] animate-pulse" style={{ animationDelay: '0.2s' }} />
                <Sparkles className="w-6 h-6 text-[#00F5FF] animate-pulse" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
            
            {selectedFile && (
              <div className="mt-6 relative">
                <div className="absolute inset-0 bg-[#00F5FF] rounded-2xl retro-border transform -rotate-1" />
                <div className="relative p-4 bg-white rounded-2xl retro-border retro-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#8338EC] rounded-xl flex items-center justify-center retro-border wiggle-hover">
                        <FileVideo className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <p className="font-bungee text-lg text-[#1A0033]">{selectedFile.name}</p>
                        <p className="font-space-mono text-sm text-[#8338EC]">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB of pure groove
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="p-2 bg-[#FF006E] text-white rounded-lg retro-border hover:translate-x-0.5 hover:translate-y-0.5 transition-all duration-200"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-4 p-6 border-t-4 border-[#1A0033]">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-white text-[#1A0033] rounded-xl retro-border retro-shadow hover:translate-x-0.5 hover:translate-y-0.5 transition-all duration-200 font-bungee"
            >
              CANCEL
            </button>
            <button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="px-6 py-3 bg-[#FF006E] text-white rounded-xl retro-border retro-shadow hover:translate-x-0.5 hover:translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 font-bungee wiggle-hover"
            >
              {isUploading && <Radio className="w-5 h-5 animate-pulse" />}
              {isUploading ? 'UPLOADING...' : 'BLAST OFF!'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}