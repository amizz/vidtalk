import { useState } from "react";
import { Form, useActionData, useNavigation, type ActionFunctionArgs } from "react-router";
import type { CloudflareContext } from "~/types/types";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB limit
const CHUNK_SIZE = 1024 * 1024; // 1 MB chunks

// Helper function to merge VTT subtitles from multiple chunks
function mergeVttSubtitles(vttChunks: string[]): string {
  if (vttChunks.length === 0) return '';
  if (vttChunks.length === 1) return vttChunks[0];
  
  // Extract cues from each VTT chunk
  const allCues: string[] = [];
  let cueIndex = 1;
  
  for (const vtt of vttChunks) {
    const lines = vtt.split('\n');
    let inCue = false;
    let currentCue: string[] = [];
    
    for (const line of lines) {
      // Skip WEBVTT header and empty lines at the start
      if (line.startsWith('WEBVTT') || (line.trim() === '' && !inCue)) {
        continue;
      }
      
      // Check if this is a timestamp line
      if (line.includes('-->')) {
        inCue = true;
        currentCue = [cueIndex.toString(), line];
        cueIndex++;
      } else if (inCue && line.trim() === '') {
        // End of cue
        allCues.push(currentCue.join('\n'));
        currentCue = [];
        inCue = false;
      } else if (inCue) {
        // Cue text
        currentCue.push(line);
      }
    }
    
    // Handle last cue if no empty line at end
    if (currentCue.length > 0) {
      allCues.push(currentCue.join('\n'));
    }
  }
  
  // Reconstruct VTT file
  return 'WEBVTT\n\n' + allCues.join('\n\n');
}

export async function action({ request, context }: ActionFunctionArgs<CloudflareContext>) {
  const formData = await request.formData();
  const videoUrl = formData.get("videoUrl") as string;
  const audioFile = formData.get("audioFile") as File;
  const inputType = formData.get("inputType") as string;
  const model = formData.get("model") as string || "@cf/openai/whisper";
  
  if (inputType === "url" && !videoUrl) {
    return { error: "Please provide a video/audio URL" };
  }
  
  if (inputType === "file" && (!audioFile || audioFile.size === 0)) {
    return { error: "Please select an audio/video file" };
  }

  if (inputType === "file" && audioFile.size > MAX_FILE_SIZE) {
    return { error: `File size exceeds 25 MB limit. Your file: ${(audioFile.size / 1024 / 1024).toFixed(2)} MB` };
  }

  try {
    let audioArrayBuffer: ArrayBuffer;
    let mediaUrl: string | null = null;
    let mediaType: string = 'audio';
    let fileName: string | null = null;
    
    if (inputType === "url") {
      // Fetch the video/audio file from URL
      const response = await fetch(videoUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch media: ${response.statusText}`);
      }
      
      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > MAX_FILE_SIZE) {
        throw new Error(`File size exceeds 25 MB limit. File size: ${(parseInt(contentLength) / 1024 / 1024).toFixed(2)} MB`);
      }
      
      audioArrayBuffer = await response.arrayBuffer();
      mediaUrl = videoUrl;
      const contentType = response.headers.get('content-type') || '';
      mediaType = contentType.startsWith('video/') ? 'video' : 'audio';
    } else {
      // Use uploaded file
      audioArrayBuffer = await audioFile.arrayBuffer();
      fileName = audioFile.name;
      mediaType = audioFile.type.startsWith('video/') ? 'video' : 'audio';
    }
    
    // Call Cloudflare AI Whisper
    const ai = context.cloudflare.env.AI;
    if (!ai) {
      throw new Error("AI binding not configured");
    }

    let response;
    let transcriptions: string[] = [];
    let allWords: any[] = [];
    let allVtt: string[] = [];
    
    // Check if we need chunking
    if (audioArrayBuffer.byteLength > CHUNK_SIZE) {
      console.log(`Processing large file (${(audioArrayBuffer.byteLength / 1024 / 1024).toFixed(2)} MB) with chunking`);
      
      // Calculate chunk parameters
      const totalChunks = Math.ceil(audioArrayBuffer.byteLength / CHUNK_SIZE);
      const overlapSize = Math.floor(CHUNK_SIZE * 0.1); // 10% overlap to prevent word splitting
      
      // Process chunks
      for (let i = 0; i < totalChunks; i++) {
        const start = i === 0 ? 0 : (i * CHUNK_SIZE) - overlapSize;
        const end = Math.min(start + CHUNK_SIZE, audioArrayBuffer.byteLength);
        const chunk = audioArrayBuffer.slice(start, end);
        
        console.log(`Processing chunk ${i + 1}/${totalChunks} (${(chunk.byteLength / 1024).toFixed(0)} KB)`);
        
        // Convert chunk to the format expected by Whisper
        const chunkInput = {
          audio: [...new Uint8Array(chunk)]
        };
        
        // Call the AI model for this chunk
        const chunkResponse = await ai.run(model as keyof AiModels, chunkInput);
        
        if (!chunkResponse || typeof chunkResponse.text !== 'string') {
          throw new Error(`Invalid response from Whisper model for chunk ${i + 1}`);
        }
        
        // Collect results
        transcriptions.push(chunkResponse.text);
        if (chunkResponse.words) {
          // For chunked processing, we'll concatenate words but won't adjust timestamps
          // as we don't have reliable audio duration info without decoding
          // Cloudflare's Whisper handles the audio context internally
          allWords.push(...chunkResponse.words);
        }
        if (chunkResponse.vtt) {
          allVtt.push(chunkResponse.vtt);
        }
      }
      
      // Merge results
      response = {
        text: transcriptions.join(' '),
        words: allWords,
        vtt: mergeVttSubtitles(allVtt),
        word_count: transcriptions.join(' ').split(/\s+/).length,
      };
    } else {
      // Process as single chunk for smaller files
      const input = {
        audio: [...new Uint8Array(audioArrayBuffer)]
      };

      response = await ai.run(model as keyof AiModels, input);

      if (!response || typeof response.text !== 'string') {
        throw new Error("Invalid response from Whisper model");
      }
    }

    return {
      success: true,
      transcription: response.text,
      vtt: response.vtt,
      words: response.words,
      wordCount: response.word_count,
      mediaUrl,
      mediaType,
      fileName,
      fileSize: (audioArrayBuffer.byteLength / 1024 / 1024).toFixed(2),
      model,
      chunksProcessed: audioArrayBuffer.byteLength > CHUNK_SIZE ? Math.ceil(audioArrayBuffer.byteLength / CHUNK_SIZE) : 1,
    };
  } catch (error) {
    console.error("Whisper error:", error);
    return { 
      error: error instanceof Error ? error.message : "Failed to transcribe media" 
    };
  }
}

export default function TestWhisper() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [videoUrl, setVideoUrl] = useState("");
  const [inputType, setInputType] = useState<"url" | "file">("url");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedModel, setSelectedModel] = useState("@cf/openai/whisper");
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Test Cloudflare Workers AI Whisper
        </h1>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <Form method="post" encType="multipart/form-data" className="space-y-4">
            {/* Input Type Selection */}
            <div className="flex space-x-4 mb-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="inputType"
                  value="url"
                  checked={inputType === "url"}
                  onChange={(e) => setInputType("url")}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  URL Input
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="inputType"
                  value="file"
                  checked={inputType === "file"}
                  onChange={(e) => setInputType("file")}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  File Upload
                </span>
              </label>
            </div>

            {/* Model Selection */}
            <div>
              <label 
                htmlFor="model" 
                className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
              >
                Whisper Model
              </label>
              <select
                id="model"
                name="model"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="@cf/openai/whisper">Whisper (General)</option>
                <option value="@cf/openai/whisper-tiny-en">Whisper Tiny (English only, Faster)</option>
              </select>
            </div>

            {/* URL Input */}
            {inputType === "url" && (
              <div>
                <label 
                  htmlFor="videoUrl" 
                  className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
                >
                  Audio/Video URL
                </label>
                <input
                  type="url"
                  id="videoUrl"
                  name="videoUrl"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://example.com/media.mp4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required={inputType === "url"}
                />
              </div>
            )}

            {/* File Upload */}
            {inputType === "file" && (
              <div>
                <label 
                  htmlFor="audioFile" 
                  className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
                >
                  Audio/Video File (Max 25 MB)
                </label>
                <input
                  type="file"
                  id="audioFile"
                  name="audioFile"
                  accept="audio/*,video/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setSelectedFile(file);
                    if (file && file.size > MAX_FILE_SIZE) {
                      alert(`File size exceeds 25 MB limit. Your file: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-gray-600 dark:file:text-gray-200"
                  required={inputType === "file"}
                />
                {selectedFile && (
                  <p className={`mt-2 text-sm ${selectedFile.size > MAX_FILE_SIZE ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    {selectedFile.size > MAX_FILE_SIZE && ' - File too large!'}
                  </p>
                )}
              </div>
            )}
            
            <button
              type="submit"
              disabled={isSubmitting || (inputType === "file" && selectedFile && selectedFile.size > MAX_FILE_SIZE)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Transcribing...
                </span>
              ) : (
                "Transcribe Media"
              )}
            </button>
          </Form>

          {/* Info Box */}
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">Information</h3>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Maximum file size: 25 MB</li>
              <li>• Supported formats: Most audio and video formats</li>
              <li>• Files larger than 1 MB are processed in chunks with 10% overlap</li>
              <li>• Rate limit: 720 requests/minute</li>
              <li>• Whisper internally processes audio in 30-second segments</li>
            </ul>
          </div>
        </div>

        {/* Error Display */}
        {actionData?.error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Transcription Error
                </h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                  {actionData.error}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Display */}
        {actionData?.success && (
          <>
            {/* Processing Info */}
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                Transcription Successful
              </h3>
              <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                <p>Model: {actionData.model}</p>
                <p>File size: {actionData.fileSize} MB</p>
                {actionData.chunksProcessed && actionData.chunksProcessed > 1 && (
                  <p>Chunks processed: {actionData.chunksProcessed}</p>
                )}
                {actionData.wordCount && <p>Word count: {actionData.wordCount}</p>}
              </div>
            </div>

            {/* Media Preview - Only for URL inputs */}
            {actionData.mediaUrl && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {actionData.mediaType === 'video' ? 'Video' : 'Audio'} Preview
                </h2>
                {actionData.mediaType === 'video' ? (
                  <video 
                    controls 
                    className="w-full rounded-lg"
                    src={actionData.mediaUrl}
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <audio 
                    controls 
                    className="w-full"
                    src={actionData.mediaUrl}
                  >
                    Your browser does not support the audio tag.
                  </audio>
                )}
              </div>
            )}

            {/* File info for uploaded files */}
            {actionData.fileName && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Uploaded File
                </h2>
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="font-medium">File:</span> {actionData.fileName}
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                  Note: Preview is not available for uploaded files in the Workers environment
                </p>
              </div>
            )}

            {/* Transcription */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Transcription
              </h2>
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {actionData.transcription || "No transcription text available"}
                </p>
              </div>
            </div>

            {/* VTT Subtitles */}
            {actionData.vtt && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  VTT Subtitles
                </h2>
                <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto">
                  <code className="text-sm text-gray-800 dark:text-gray-200">
                    {actionData.vtt}
                  </code>
                </pre>
              </div>
            )}

            {/* Word Timestamps */}
            {actionData.words && actionData.words.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Word Timestamps ({actionData.words.length} words)
                </h2>
                <div className="max-h-96 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Word
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Start
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          End
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {actionData.words.map((word: any, index: number) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-200">
                            {word.word}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                            {word.start?.toFixed(2)}s
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                            {word.end?.toFixed(2)}s
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}