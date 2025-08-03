import { type ActionFunctionArgs } from "react-router";
import { AwsClient } from "aws4fetch";

export async function action({ request, context }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const formData = await request.formData();
  const fileName = formData.get("fileName") as string;
  const fileType = formData.get("fileType") as string;

  if (!fileName || !fileType) {
    return Response.json({ error: "Missing fileName or fileType" }, { status: 400 });
  }

  // Get R2 credentials from environment
  const env = context.cloudflare.env;
  const accountId = env.CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId = env.R2_ACCESS_KEY_ID;
  const secretAccessKey = env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    return Response.json({ error: "R2 credentials not configured" }, { status: 500 });
  }

  // Create AWS client
  const client = new AwsClient({
    accessKeyId,
    secretAccessKey,
  });

  // Generate unique key for the video
  const timestamp = Date.now();
  const key = `videos/${timestamp}-${fileName}`;

  // Create presigned URL
  const bucketName = "vidtalk";
  const url = new URL(
    `https://${bucketName}.${accountId}.r2.cloudflarestorage.com/${key}`
  );

  // Set expiry to 1 hour
  url.searchParams.set("X-Amz-Expires", "3600");

  const signed = await client.sign(
    new Request(url, {
      method: "PUT",
      headers: {
        "Content-Type": fileType,
      },
    }),
    {
      aws: { signQuery: true },
    }
  );

  return Response.json({
    uploadUrl: signed.url,
    key,
  });
}