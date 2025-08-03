import { Container } from "@cloudflare/containers";

export class VideoConverterContainer extends Container<Env> {
  // Port the container listens on (default: 8080)
  defaultPort = 8080;
  // Time before container sleeps due to inactivity (default: 30s)
  sleepAfter = "2m";
  // Environment variables passed to the container
  envVars = {
    FFMPEG_PATH: "/usr/bin/ffmpeg",
    R2_ACCOUNT_ID: this.env.CLOUDFLARE_ACCOUNT_ID,
    R2_ACCESS_KEY_ID: this.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: this.env.R2_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME: "vidtalk",
    R2_PUBLIC_URL: this.env.R2_PUBLIC_URL,
  };

  // Optional lifecycle hooks
  override onStart() {
    console.log("Video converter container successfully started");
  }

  override onStop() {
    console.log("Video converter container successfully shut down");
  }

  override onError(error: unknown) {
    console.log("Video converter container error:", error);
  }
}