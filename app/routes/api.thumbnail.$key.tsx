import { type LoaderFunctionArgs } from "react-router";
import type { CloudflareContext } from "~/types/types";

export async function loader({ params, context }: LoaderFunctionArgs<CloudflareContext>) {
  const thumbnailKey = decodeURIComponent(params.key!);
  const env = context.cloudflare.env;
  
  try {
    // Check if thumbnail exists in R2
    // const object = await env.VIDEO_BUCKET.get(thumbnailKey);
    
    // if (!object) {
    //   return Response.json({ error: "Thumbnail not found" }, { status: 404 });
    // }
    
    // Generate a public URL for the thumbnail
    // In production, you might want to use signed URLs or serve through CDN
    const publicUrl = `${env.R2_PUBLIC_URL}/${thumbnailKey}`;
    
    return Response.json({ 
      url: publicUrl,
      key: thumbnailKey,
      exists: true 
    });
  } catch (error) {
    console.error('Error checking thumbnail:', error);
    return Response.json({ error: "Failed to check thumbnail" }, { status: 500 });
  }
}