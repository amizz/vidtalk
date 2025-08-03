import { createRequestHandler } from "react-router";

declare module "react-router" {
  export interface AppLoadContext {
    cloudflare: {
      env: Env;
      ctx: ExecutionContext;
    };
  }
}

export { VidTalkDatabase, VideoProcessor, ChatSession } from "../app/db/durable-objects";
export { VideoConverterContainer } from "../app/lib/video-converter-container";
export { VideoThumbnailContainer } from "../app/lib/video-thumbnail-container";
// export { ProcessVideoWorkflow } from "../app/workflows/process-video-wf";

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE
);

export default {
  async fetch(request, env, ctx) {
    return requestHandler(request, {
      cloudflare: { env, ctx },
    });
  },
} satisfies ExportedHandler<Env>;
