import { type LoaderFunctionArgs, type ActionFunctionArgs } from "react-router";
import { VidTalkAPI } from "../lib/api";

export async function loader({ context }: LoaderFunctionArgs) {
  const api = new VidTalkAPI(context.cloudflare.env);
  const { videos } = await api.getVideos();
  return Response.json({ videos });
}

export async function action({ request, context }: ActionFunctionArgs) {
  const api = new VidTalkAPI(context.cloudflare.env);
  
  if (request.method === "POST") {
    const formData = await request.formData();
    const video = {
      id: crypto.randomUUID(),
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      filename: formData.get("filename") as string,
      url: formData.get("url") as string,
      duration: Number(formData.get("duration")) || undefined,
      uploadedAt: new Date(),
    };
    
    const result = await api.createVideo(video);
    
    // Trigger video processing
    await api.processVideo(video.id, video.url);
    
    return Response.json(result);
  }
  
  return Response.json({ error: "Method not allowed" }, { status: 405 });
}