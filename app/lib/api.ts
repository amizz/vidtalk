export class VidTalkAPI {
  constructor(private env: Env) {}

  private async getDatabaseStub() {
    const id = this.env.DATABASE.idFromName('main');
    return this.env.DATABASE.get(id);
  }

  async getVideos() {
    const stub = await this.getDatabaseStub();
    const videos = await stub.getVideos();
    return { videos };
  }

  async createVideo(data: {
    id: string;
    title: string;
    description?: string;
    filename: string;
    url: string;
    duration?: number;
    uploadedAt: Date;
  }) {
    const stub = await this.getDatabaseStub();
    const video = await stub.createVideo({
      ...data,
      status: 'processing',
    });
    return { video };
  }

  async getVideo(id: string) {
    const stub = await this.getDatabaseStub();
    const video = await stub.getVideo(id);
    return { video };
  }

  async createTranscript(data: {
    id: string;
    videoId: string;
    content: string;
    language?: string;
    createdAt: Date;
  }) {
    const stub = await this.getDatabaseStub();
    const transcript = await stub.createTranscript(data);
    return { transcript };
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
    const stub = await this.getDatabaseStub();
    const segment = await stub.createTranscriptSegment(data);
    return { segment };
  }

  async getTranscriptSegments(transcriptId: string) {
    const stub = await this.getDatabaseStub();
    const segments = await stub.getTranscriptSegments(transcriptId);
    return { segments };
  }

  async processVideo(videoId: string, videoUrl: string) {
    const id = this.env.VIDEO_PROCESSOR.idFromName(videoId);
    const stub = this.env.VIDEO_PROCESSOR.get(id);
    await stub.processVideo(videoId, videoUrl);
    return { status: 'processing' };
  }

  async getVideoProcessingStatus(videoId: string) {
    const id = this.env.VIDEO_PROCESSOR.idFromName(videoId);
    const stub = this.env.VIDEO_PROCESSOR.get(id);
    return await stub.getStatus();
  }

  async getChatSessionMessages(chatId: string) {
    const id = this.env.CHAT_SESSION.idFromName(chatId);
    const stub = this.env.CHAT_SESSION.get(id);
    const messages = await stub.getMessages();
    return { messages };
  }

  async addChatSessionMessage(chatId: string, role: string, content: string) {
    const id = this.env.CHAT_SESSION.idFromName(chatId);
    const stub = this.env.CHAT_SESSION.get(id);
    const message = await stub.addMessage(role, content);
    return { message };
  }

  async clearChatSession(chatId: string) {
    const id = this.env.CHAT_SESSION.idFromName(chatId);
    const stub = this.env.CHAT_SESSION.get(id);
    await stub.clearMessages();
    return { success: true };
  }
}