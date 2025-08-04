export class VidTalkAPI {
  constructor(private env: Env) {}

  private async getDatabaseStub() {
    const id = this.env.DATABASE.idFromName("main");
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
      status: "processing",
    });
    return { video };
  }

  async deleteVideo(id: string) {
    const stub = await this.getDatabaseStub();
    await stub.deleteVideo(id);
    return { success: true };
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

  async getTranscriptWithSegments(videoId: string) {
    const stub = await this.getDatabaseStub();
    const result = await stub.getTranscriptWithSegments(videoId);
    return result;
  }

  async processVideo(videoId: string, videoUrl: string) {
    const id = this.env.VIDEO_PROCESSOR.idFromName(videoId);
    const stub = this.env.VIDEO_PROCESSOR.get(id);
    await stub.processVideo(videoId, videoUrl);
    return { status: "processing" };
  }

  async generateThumbnail(videoKey: string) {
    // Generate thumbnail key in the same folder as the video
    const pathParts = videoKey.split("/");
    const filename = pathParts[pathParts.length - 1];
    const nameWithoutExt = filename.substring(0, filename.lastIndexOf("."));
    const thumbnailKey = pathParts
      .slice(0, -1)
      .concat(`${nameWithoutExt}_thumb.jpg`)
      .join("/");

    try {
      // Get the container instance
      const containerId = this.env.VIDEO_THUMBNAIL.idFromName(videoKey);
      const container = this.env.VIDEO_THUMBNAIL.get(containerId);

      // Create request to container
      const request = new Request("http://localhost:8080/thumbnail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          videoKey,
          thumbnailKey,
          width: 640,
          height: 360,
        }),
      });

      // Call the container
      const response = await container.containerFetch(request);

      if (!response.ok) {
        throw new Error(`Thumbnail generation failed: ${response.statusText}`);
      }

      const result = (await response.json()) as {
        success: boolean;
        thumbnailKey?: string;
        error?: string;
      };

      if (result.success && result.thumbnailKey) {
        return { thumbnailKey: result.thumbnailKey, status: "success" };
      } else {
        throw new Error(result.error || "Unknown error");
      }
    } catch (error) {
      console.error("Thumbnail generation error:", error);
      return { thumbnailKey: null, status: "failed" };
    }
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
