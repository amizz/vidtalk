import { DurableObject } from 'cloudflare:workers';
import { drizzle } from 'drizzle-orm/durable-sqlite';
import { migrate } from 'drizzle-orm/durable-sqlite/migrator';
import { eq, asc } from 'drizzle-orm';
import * as schema from './schema';
import migrations from './migrations/migrations';

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB limit
const CHUNK_SIZE = 1024 * 1024; // 1 MB chunks

// Helper function to group words into segments (sentences/phrases)
function groupWordsIntoSegments(words: Array<{
  word?: string;
  text?: string;
  start?: number;
  end?: number;
}>, maxWordsPerSegment: number = 15, maxDurationPerSegment: number = 10): Array<{
  text: string;
  startTime: number;
  endTime: number;
}> {
  if (!words || words.length === 0) return [];
  
  const segments: Array<{ text: string; startTime: number; endTime: number }> = [];
  let currentSegment: typeof words = [];
  let segmentDuration = 0;
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const wordText = word.word || word.text || '';
    const wordStart = word.start || 0;
    const wordEnd = word.end || 0;
    
    currentSegment.push(word);
    
    // Calculate current segment duration
    if (currentSegment.length > 0) {
      const segmentStart = currentSegment[0].start || 0;
      segmentDuration = wordEnd - segmentStart;
    }
    
    // Check if we should end the segment
    const shouldEndSegment = 
      // End on sentence boundaries (punctuation)
      /[.!?]$/.test(wordText) ||
      // Or if we've reached max words
      currentSegment.length >= maxWordsPerSegment ||
      // Or if segment duration exceeds max
      segmentDuration >= maxDurationPerSegment ||
      // Or if this is the last word
      i === words.length - 1;
    
    if (shouldEndSegment && currentSegment.length > 0) {
      // Create segment from current words
      const segmentText = currentSegment
        .map(w => w.word || w.text || '')
        .join(' ')
        .trim();
      
      const segmentStart = currentSegment[0].start || 0;
      const segmentEnd = currentSegment[currentSegment.length - 1].end || 0;
      
      if (segmentText) {
        segments.push({
          text: segmentText,
          startTime: segmentStart,
          endTime: segmentEnd,
        });
      }
      
      currentSegment = [];
      segmentDuration = 0;
    }
  }
  
  return segments;
}

export class VidTalkDatabase extends DurableObject {
  private db!: ReturnType<typeof drizzle>;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    
    this.ctx.blockConcurrencyWhile(async () => {
      this.db = drizzle(this.ctx.storage, { schema, logger: false });
      await this._migrate();
    });
  }

  private async _migrate() {
    try {
      await migrate(this.db, migrations);
    } catch (error) {
      console.error('Migration failed:', error);
    }
  }

  async getVideos() {
    return this.db.select().from(schema.videos).all();
  }

  async createVideo(data: {
    id: string;
    title: string;
    description?: string;
    filename: string;
    url: string;
    duration?: number;
    status?: string;
    uploadedAt: Date;
    processedAt?: Date;
  }) {
    return this.db.insert(schema.videos).values(data).returning().get();
  }

  async deleteVideo(id: string) {
    const transcript = await this.db.select().from(schema.transcripts).where(eq(schema.transcripts.videoId, id)).get();
    if (transcript) {
      await this.db.delete(schema.transcriptSegments).where(eq(schema.transcriptSegments.transcriptId, transcript.id));
      await this.db.delete(schema.transcripts).where(eq(schema.transcripts.id, transcript.id));
    }
    return this.db.delete(schema.videos).where(eq(schema.videos.id, id)).returning().get();
  }

  async getVideo(id: string) {
    return this.db.select().from(schema.videos).where(eq(schema.videos.id, id)).get();
  }

  async updateVideo(id: string, data: {
    title?: string;
    description?: string;
    status?: string;
    processedAt?: Date;
  }) {
    return this.db.update(schema.videos)
      .set(data)
      .where(eq(schema.videos.id, id))
      .returning()
      .get();
  }

  async createTranscript(data: {
    id: string;
    videoId: string;
    content: string;
    language?: string;
    createdAt: Date;
  }) {
    return this.db.insert(schema.transcripts).values(data).returning().get();
  }

  async createTranscriptSegment(data: {
    id: string;
    transcriptId: string;
    text: string;
    startTime: number;
    endTime: number;
    speaker?: string;
    confidence?: number;
    order: number;
  }) {
    return this.db.insert(schema.transcriptSegments).values(data).returning().get();
  }

  async getTranscriptSegments(transcriptId: string) {
    return this.db.select()
      .from(schema.transcriptSegments)
      .where(eq(schema.transcriptSegments.transcriptId, transcriptId))
      .orderBy(asc(schema.transcriptSegments.order))
      .all();
  }

  async getTranscriptByVideoId(videoId: string) {
    return this.db.select()
      .from(schema.transcripts)
      .where(eq(schema.transcripts.videoId, videoId))
      .get();
  }

  async getTranscriptWithSegments(videoId: string) {
    const transcript = await this.getTranscriptByVideoId(videoId);
    if (!transcript) return null;
    
    const segments = await this.getTranscriptSegments(transcript.id);
    
    return {
      transcript,
      segments
    };
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (path === '/createTranscript' && request.method === 'POST') {
        const data = await request.json() as {
          id: string;
          videoId: string;
          content: string;
          language?: string;
          createdAt: Date;
        };
        const result = await this.createTranscript(data);
        return new Response(JSON.stringify(result), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (path === '/createTranscriptSegment' && request.method === 'POST') {
        const data = await request.json() as {
          id: string;
          transcriptId: string;
          text: string;
          startTime: number;
          endTime: number;
          speaker?: string;
          confidence?: number;
          order: number;
        };
        const result = await this.createTranscriptSegment(data);
        return new Response(JSON.stringify(result), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (path === '/getVideo' && request.method === 'GET') {
        const id = url.searchParams.get('id');
        if (!id) {
          return new Response('Missing id parameter', { status: 400 });
        }
        const result = await this.getVideo(id);
        return new Response(JSON.stringify(result), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (path === '/getTranscriptWithSegments' && request.method === 'GET') {
        const videoId = url.searchParams.get('videoId');
        if (!videoId) {
          return new Response('Missing videoId parameter', { status: 400 });
        }
        const result = await this.getTranscriptWithSegments(videoId);
        return new Response(JSON.stringify(result), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (path === '/updateVideo' && request.method === 'POST') {
        const data = await request.json() as {
          id: string;
          title?: string;
          description?: string;
          status?: string;
          processedAt?: Date;
        };
        const result = await this.updateVideo(data.id, data);
        return new Response(JSON.stringify(result), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response('Not found', { status: 404 });
    } catch (error) {
      console.error('Database error:', error);
      return new Response('Internal server error', { status: 500 });
    }
  }
}

export class VideoProcessor extends DurableObject {
  constructor(ctx: DurableObjectState, public env: Env) {
    super(ctx, env);
  }

  async processVideo(videoId: string, videoUrl: string) {
    await this.ctx.blockConcurrencyWhile(async () => {
      // Store processing status
      await this.ctx.storage.put('status', 'processing');
      await this.ctx.storage.put('videoId', videoId);
      await this.ctx.storage.put('videoUrl', videoUrl);
      await this.ctx.storage.put('startedAt', Date.now());
    });

    try {
      console.log(`Processing video ${videoId} from ${videoUrl}`);
      
      // Step 1: Call the video converter container to download, convert, and upload
      console.log('Step 1: Processing video through container...');
      const processResult = await this.processVideoInContainer(videoId, videoUrl);
      
      // Step 2: Download MP3 from R2 for transcription
      console.log(`Step 2: Downloading MP3 (${JSON.stringify(processResult)}) for transcription...`);
      const mp3Data = await this.downloadMP3(processResult.mp3Url);
      
      // Step 3: Send MP3 to Whisper AI for transcription
      console.log('Step 3: Transcribing audio with Whisper AI...');
      const transcription = await this.transcribeWithWhisper(mp3Data);
      
      // Step 4: Save transcription to database
      console.log('Step 4: Saving transcription to database...');
      await this.saveTranscription(videoId, transcription);
      
      // Update video status to completed
      await this.updateVideoStatus(videoId, 'completed');
      
      await this.ctx.storage.put('status', 'completed');
      await this.ctx.storage.put('completedAt', Date.now());
      await this.ctx.storage.put('mp3Url', processResult.mp3Url);
      
      console.log(`Successfully processed video ${videoId}`);
      
      return {
        success: true,
        mp3Url: processResult.mp3Url,
        transcriptionLength: transcription.text.length,
        wordCount: transcription.words?.length || 0,
      };
    } catch (error) {
      console.error(`Error processing video ${videoId}:`, error);
      await this.ctx.storage.put('status', 'failed');
      await this.ctx.storage.put('error', error instanceof Error ? error.message : 'Unknown error');
      await this.ctx.storage.put('failedAt', Date.now());
      
      // Update video status to failed
      await this.updateVideoStatus(videoId, 'failed');
      
      throw error;
    }
  }

  private async processVideoInContainer(videoId: string, videoUrl: string): Promise<{ success: boolean; mp3Url: string; error?: string }> {
    // Get the video converter container
    const videoConverterId = this.env.VIDEO_CONVERTER.idFromName('converter');
    const videoConverterStub = this.env.VIDEO_CONVERTER.get(videoConverterId);
    
    // Send request to process video
    const response = await videoConverterStub.containerFetch('http://localhost:8080/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        videoId,
        videoUrl,
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Video processing failed: ${error}`);
    }
    
    const result = await response.json() as { success: boolean; mp3Url: string; error?: string };
    
    if (!result.success || !result.mp3Url) {
      throw new Error(result.error || 'Video processing failed');
    }
    
    return result;
  }

  private async downloadMP3(mp3Url: string): Promise<ArrayBuffer> {
    const response = await fetch(mp3Url);
    if (!response.ok) {
      throw new Error(`Failed to download MP3: ${response.statusText}`);
    }
    return response.arrayBuffer();
  }

  private async transcribeWithWhisper(mp3Data: ArrayBuffer): Promise<{
    text: string;
    language?: string;
    words?: Array<{
      word?: string;
      text?: string;
      start?: number;
      end?: number;
      speaker?: string;
      confidence?: number;
    }>;
    word_count?: number;
  }> {
    const ai = this.env.AI;
    if (!ai) {
      throw new Error("AI binding not configured");
    }

    let response;
    let transcriptions: string[] = [];
    let allWords: any[] = [];
    
    // Check if we need chunking
    if (mp3Data.byteLength > CHUNK_SIZE) {
      console.log(`Processing large file (${(mp3Data.byteLength / 1024 / 1024).toFixed(2)} MB) with chunking`);
      
      // Calculate chunk parameters
      const totalChunks = Math.ceil(mp3Data.byteLength / CHUNK_SIZE);
      const overlapSize = Math.floor(CHUNK_SIZE * 0.1); // 10% overlap to prevent word splitting
      
      // Process chunks
      for (let i = 0; i < totalChunks; i++) {
        const start = i === 0 ? 0 : (i * CHUNK_SIZE) - overlapSize;
        const end = Math.min(start + CHUNK_SIZE, mp3Data.byteLength);
        const chunk = mp3Data.slice(start, end);
        
        console.log(`Processing chunk ${i + 1}/${totalChunks} (${(chunk.byteLength / 1024).toFixed(0)} KB)`);
        
        // Convert chunk to the format expected by Whisper
        const chunkInput = {
          audio: [...new Uint8Array(chunk)]
        };
        
        // Call the AI model for this chunk
        const chunkResponse = await ai.run('@cf/openai/whisper' as keyof AiModels, chunkInput) as Ai_Cf_Openai_Whisper_Output;
        
        if (!chunkResponse || typeof chunkResponse.text !== 'string') {
          throw new Error(`Invalid response from Whisper model for chunk ${i + 1}`);
        }
        
        // Collect results
        transcriptions.push(chunkResponse.text);
        if (chunkResponse.words) {
          allWords.push(...chunkResponse.words);
        }
      }
      
      // Merge results
      response = {
        text: transcriptions.join(' '),
        words: allWords,
        word_count: transcriptions.join(' ').split(/\s+/).length,
      };
    } else {
      // Process as single chunk for smaller files
      const input = {
        audio: [...new Uint8Array(mp3Data)]
      };

      response = await ai.run('@cf/openai/whisper' as keyof AiModels, input) as Ai_Cf_Openai_Whisper_Output;

      if (!response || typeof response.text !== 'string') {
        throw new Error("Invalid response from Whisper model");
      }
    }

    return response;
  }

  private async saveTranscription(videoId: string, transcriptionData: {
    text: string;
    language?: string;
    words?: Array<{
      word?: string;
      text?: string;
      start?: number;
      end?: number;
      speaker?: string;
      confidence?: number;
    }>;
  }) {
    // Get database instance
    const dbId = this.env.DATABASE.idFromName('main');
    const dbStub = this.env.DATABASE.get(dbId);
    
    // Generate transcript ID
    const transcriptId = crypto.randomUUID();
    
    // Create transcript record
    await dbStub.createTranscript({
      id: transcriptId,
      videoId: videoId,
      content: transcriptionData.text,
      language: transcriptionData.language || 'en',
      createdAt: new Date(),
    });
    
    // Create transcript segments from words array
    if (transcriptionData.words && Array.isArray(transcriptionData.words) && transcriptionData.words.length > 0) {
      // Group words into meaningful segments instead of saving each word
      const segments = groupWordsIntoSegments(transcriptionData.words);
      
      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        await dbStub.createTranscriptSegment({
          id: crypto.randomUUID(),
          transcriptId: transcriptId,
          text: segment.text,
          startTime: segment.startTime,
          endTime: segment.endTime,
          speaker: undefined, // Could be enhanced later with speaker diarization
          confidence: undefined, // Could calculate average confidence from words
          order: i,
        });
      }
    }
  }

  private async updateVideoStatus(videoId: string, status: string) {
    // Get database instance
    const dbId = this.env.DATABASE.idFromName('main');
    const dbStub = this.env.DATABASE.get(dbId);
    
    // Update video status
    const videoResponse = await dbStub.getVideo(videoId);
    const video = videoResponse ? videoResponse : null;
    if (video) {
      await dbStub.updateVideo(videoId, {
        status: status,
        processedAt: status === 'completed' ? new Date() : undefined,
      });
    }
  }

  async getStatus() {
    const status = await this.ctx.storage.get('status') || 'idle';
    const videoId = await this.ctx.storage.get('videoId');
    const startedAt = await this.ctx.storage.get('startedAt');
    const completedAt = await this.ctx.storage.get('completedAt');
    const failedAt = await this.ctx.storage.get('failedAt');
    const error = await this.ctx.storage.get('error');
    const mp3Url = await this.ctx.storage.get('mp3Url');
    
    return {
      status,
      videoId,
      startedAt,
      completedAt,
      failedAt,
      error,
      mp3Url,
    };
  }
}

export class ChatSession extends DurableObject {
  private messages: Array<{ role: string; content: string; timestamp: number }> = [];

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    
    this.ctx.blockConcurrencyWhile(async () => {
      this.messages = (await this.ctx.storage.get('messages')) || [];
    });
  }

  async getMessages() {
    return this.messages;
  }

  async addMessage(role: string, content: string) {
    const message = { role, content, timestamp: Date.now() };
    this.messages.push(message);
    await this.ctx.storage.put('messages', this.messages);
    return message;
  }

  async clearMessages() {
    this.messages = [];
    await this.ctx.storage.delete('messages');
  }

  async getMessageCount() {
    return this.messages.length;
  }
}