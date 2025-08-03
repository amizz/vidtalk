import type { LoaderFunctionArgs } from "react-router";

export async function loader({ params, context }: LoaderFunctionArgs) {
  const { key } = params;
  const env = context.cloudflare.env;
  
  // Get the video from R2
  const object = await env.VIDEO_BUCKET.get(key);
  
  if (!object) {
    return new Response("Video not found", { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  
  // Add cache control headers
  headers.set("Cache-Control", "public, max-age=3600");
  
  // Support range requests for video streaming
  const range = context.request.headers.get("range");
  if (range && object.range) {
    const rangeResult = await env.VIDEO_BUCKET.get(key, {
      range,
    });
    
    if (rangeResult) {
      const rangeHeaders = new Headers();
      rangeResult.writeHttpMetadata(rangeHeaders);
      rangeHeaders.set("etag", rangeResult.httpEtag);
      rangeHeaders.set("Accept-Ranges", "bytes");
      rangeHeaders.set("Content-Range", rangeResult.httpRange || "");
      
      return new Response(rangeResult.body, {
        status: 206,
        headers: rangeHeaders,
      });
    }
  }

  return new Response(object.body, { headers });
}