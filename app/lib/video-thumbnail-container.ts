import { Container } from "@cloudflare/containers";

export class VideoThumbnailContainer extends Container<Env> {
  // Port the container listens on (default: 8080)
  defaultPort = 8080;
  // Time before container sleeps due to inactivity (default: 30s)
  sleepAfter = "5m"; // Sleep after 5 minutes of inactivity

  // Environment variables passed to the container
  envVars = {
    CLOUDFLARE_ACCOUNT_ID: this.env.CLOUDFLARE_ACCOUNT_ID,
    R2_ACCESS_KEY_ID: this.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: this.env.R2_SECRET_ACCESS_KEY,
    R2_BUCKET: "vidtalk",
    PORT: "8080",
  };

  // Optional lifecycle hooks
  override onStart() {
    console.log("VideoThumbnailContainer successfully started");
  }

  override onStop() {
    console.log("VideoThumbnailContainer successfully shut down");
  }

  override onError(error: unknown) {
    console.error("VideoThumbnailContainer error:", error);
  }
}
