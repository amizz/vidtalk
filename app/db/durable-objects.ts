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
    return await this.db.select().from(schema.videos).all();
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
    return await this.db.insert(schema.videos).values(data).returning().get();
  }

  async getVideo(id: string) {
    return await this.db.select().from(schema.videos).where(eq(schema.videos.id, id)).get();
  }

  async createTranscript(data: {
    id: string;
    videoId: string;
    content: string;
    language?: string;
    createdAt: Date;
  }) {
    return await this.db.insert(schema.transcripts).values(data).returning().get();
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
    return await this.db.insert(schema.transcriptSegments).values(data).returning().get();
  }

  async getTranscriptSegments(transcriptId: string) {
    return await this.db.select()
      .from(schema.transcriptSegments)
      .where(eq(schema.transcriptSegments.transcriptId, transcriptId))
      .orderBy(asc(schema.transcriptSegments.order))
      .all();
  }
}

export class VideoProcessor extends DurableObject {
  constructor(ctx: DurableObjectState, env: Env) {
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

    console.log(`Processing video ${videoId} from ${videoUrl}`);
    
    // TODO: Implement actual video processing
    // - Download video
    // - Extract audio
    // - Send to transcription service
    // - Store results
    
    await this.ctx.storage.put('status', 'completed');
    await this.ctx.storage.put('completedAt', Date.now());
  }

  async getStatus() {
    const status = await this.ctx.storage.get('status') || 'idle';
    const videoId = await this.ctx.storage.get('videoId');
    const startedAt = await this.ctx.storage.get('startedAt');
    const completedAt = await this.ctx.storage.get('completedAt');
    
    return {
      status,
      videoId,
      startedAt,
      completedAt,
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