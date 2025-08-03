import { DurableObject } from 'cloudflare:workers';
import { drizzle } from 'drizzle-orm/durable-sqlite';
import { migrate } from 'drizzle-orm/durable-sqlite/migrator';
import { eq, asc } from 'drizzle-orm';
import * as schema from './schema';
import migrations from './migrations/migrations';

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
      const mp3Url = await this.processVideoInContainer(videoId, videoUrl);
      
      // Step 2: Download MP3 from R2 for transcription
      console.log('Step 2: Downloading MP3 for transcription...');
      const mp3Data = await this.downloadMP3(mp3Url);
      
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
      await this.ctx.storage.put('mp3Url', mp3Url);
      
      console.log(`Successfully processed video ${videoId}`);
      
      return {
        success: true,
        mp3Url,
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

  private async processVideoInContainer(videoId: string, videoUrl: string): Promise<string> {
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
    
    return result.mp3Url;
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
  }> {
    // Convert ArrayBuffer to Uint8Array for Whisper AI
    const audioArray = [...new Uint8Array(mp3Data)];
    
    // Call Whisper AI
    const response = await this.env.AI.run('@cf/openai/whisper', {
      audio: audioArray,
    });
    
    if (!response || !response.text) {
      throw new Error('Transcription failed: No text returned');
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
    
    // Create transcript segments if available
    if (transcriptionData.words && Array.isArray(transcriptionData.words)) {
      for (let i = 0; i < transcriptionData.words.length; i++) {
        const word = transcriptionData.words[i];
        await dbStub.createTranscriptSegment({
          id: crypto.randomUUID(),
          transcriptId: transcriptId,
          text: word.word || word.text || '',
          startTime: word.start || 0,
          endTime: word.end || 0,
          speaker: word.speaker,
          confidence: word.confidence,
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