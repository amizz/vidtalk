import { type LoaderFunctionArgs, type ActionFunctionArgs } from "react-router";
import { VidTalkAPI } from "../lib/api";

export async function loader({ params, context }: LoaderFunctionArgs) {
  const api = new VidTalkAPI(context.cloudflare.env);
  const { video } = await api.getVideo(params.id!);
  
  if (!video) {
    return Response.json({ error: "Video not found" }, { status: 404 });
  }
  
  return Response.json({ video });
}

export async function action({ request, params, context }: ActionFunctionArgs) {
  const api = new VidTalkAPI(context.cloudflare.env);
  
  if (request.method === "DELETE") {
    const result = await api.getVideo(params.id!);
    if (!result.video) {
      return Response.json({ error: "Video not found" }, { status: 404 });
    }
    await api.deleteVideo(params.id!);
    await context.cloudflare.env.VIDEO_BUCKET.delete(result.video.url);

    return Response.json({ success: true });
  }
  
  return Response.json({ error: "Method not allowed" }, { status: 405 });
}