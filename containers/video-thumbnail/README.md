# Video Thumbnail Service

A containerized Go service that generates thumbnails from videos using FFmpeg. This service downloads videos from R2, generates thumbnails, and uploads them back to R2.

## Features

- Generate single or multiple thumbnails from videos
- Configurable thumbnail size and time offset
- Automatic aspect ratio preservation with padding
- R2 integration for video download and thumbnail upload
- Health check endpoint
- Containerized with Alpine Linux and FFmpeg

## API Endpoints

### POST /thumbnail

Generate thumbnail(s) from a video.

**Request Body:**
```json
{
  "videoKey": "videos/sample.mp4",      // Required: R2 key of the source video
  "thumbnailKey": "thumbnails/sample.jpg", // Optional: R2 key for the thumbnail
  "timeOffset": "00:00:05",             // Optional: Time to capture (default: "00:00:01")
  "width": 320,                         // Optional: Thumbnail width (default: 320)
  "height": 180,                        // Optional: Thumbnail height (default: 180)
  "count": 3                            // Optional: Number of thumbnails (default: 1)
}
```

**Response:**
```json
{
  "success": true,
  "thumbnailKey": "thumbnails/sample.jpg",  // For single thumbnail
  "thumbnailKeys": [                        // For multiple thumbnails
    "thumbnails/sample_0.jpg",
    "thumbnails/sample_1.jpg",
    "thumbnails/sample_2.jpg"
  ],
  "duration": 2.345                         // Processing time in seconds
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "service": "video-thumbnail",
  "version": "1.0.0"
}
```

## Environment Variables

- `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID
- `R2_ACCESS_KEY_ID` - R2 access key ID
- `R2_SECRET_ACCESS_KEY` - R2 secret access key
- `R2_BUCKET` - R2 bucket name (default: "vidtalk")
- `PORT` - Service port (default: "8080")

## Development

### Prerequisites

- Go 1.22+
- Docker
- FFmpeg (for local development)

### Local Development

1. Install dependencies:
   ```bash
   make deps
   ```

2. Run locally:
   ```bash
   export CLOUDFLARE_ACCOUNT_ID=your_account_id
   export R2_ACCESS_KEY_ID=your_access_key
   export R2_SECRET_ACCESS_KEY=your_secret_key
   make run
   ```

### Docker

1. Build the Docker image:
   ```bash
   make docker-build
   ```

2. Run the container:
   ```bash
   make docker-run
   ```

3. Test the service:
   ```bash
   # Single thumbnail
   curl -X POST http://localhost:8080/thumbnail \
     -H "Content-Type: application/json" \
     -d '{"videoKey":"videos/test.mp4","thumbnailKey":"thumbnails/test.jpg"}'

   # Multiple thumbnails
   curl -X POST http://localhost:8080/thumbnail \
     -H "Content-Type: application/json" \
     -d '{"videoKey":"videos/test.mp4","thumbnailKey":"thumbnails/test","count":3}'
   ```

## Deployment

This service is designed to be deployed on Cloudflare Workers AI or any container platform that supports Docker.

### Deploy to Cloudflare Workers AI

1. Build and push the image to your container registry
2. Configure the Workers AI deployment with the required environment variables
3. The service will be available at your Workers AI endpoint

## Technical Details

- Uses FFmpeg for video processing
- Streams video from R2 to minimize memory usage
- Generates high-quality JPEG thumbnails
- Preserves aspect ratio with black padding if needed
- Automatically cleans up temporary files
- Non-root container for security

## Error Handling

The service returns appropriate HTTP status codes:
- 200: Success
- 400: Bad request (missing required fields)
- 500: Internal server error (processing failed)
- 503: Service unavailable (FFmpeg not available)