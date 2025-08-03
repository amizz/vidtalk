package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
)

type ThumbnailRequest struct {
	VideoKey      string `json:"videoKey"`
	ThumbnailKey  string `json:"thumbnailKey"`
	TimeOffset    string `json:"timeOffset,omitempty"`    // Format: "00:00:05" or "5"
	Width         int    `json:"width,omitempty"`          // Default: 320
	Height        int    `json:"height,omitempty"`         // Default: 180
	Count         int    `json:"count,omitempty"`          // Number of thumbnails to generate
}

type ThumbnailResponse struct {
	Success      bool     `json:"success"`
	ThumbnailKey string   `json:"thumbnailKey,omitempty"`
	ThumbnailKeys []string `json:"thumbnailKeys,omitempty"` // For multiple thumbnails
	Error        string   `json:"error,omitempty"`
	Duration     float64  `json:"duration,omitempty"`      // Processing duration in seconds
}

var (
	s3Client *s3.S3
	bucket   string
)

func init() {
	// Initialize S3 client
	accountID := os.Getenv("CLOUDFLARE_ACCOUNT_ID")
	accessKeyID := os.Getenv("R2_ACCESS_KEY_ID")
	secretAccessKey := os.Getenv("R2_SECRET_ACCESS_KEY")
	bucket = os.Getenv("R2_BUCKET")

	if bucket == "" {
		bucket = "vidtalk"
	}

	if accountID == "" || accessKeyID == "" || secretAccessKey == "" {
		log.Fatal("Missing required R2 credentials")
	}

	sess := session.Must(session.NewSession(&aws.Config{
		Region:      aws.String("auto"),
		Endpoint:    aws.String(fmt.Sprintf("https://%s.r2.cloudflarestorage.com", accountID)),
		Credentials: credentials.NewStaticCredentials(accessKeyID, secretAccessKey, ""),
		S3ForcePathStyle: aws.Bool(true),
	}))

	s3Client = s3.New(sess)
}

func downloadVideo(ctx context.Context, videoKey string) (string, error) {
	// Create temp file for video
	tempDir := "/tmp/video-thumbnail"
	os.MkdirAll(tempDir, 0755)
	
	videoPath := filepath.Join(tempDir, fmt.Sprintf("video_%d%s", time.Now().Unix(), filepath.Ext(videoKey)))

	// Download video from R2
	obj, err := s3Client.GetObjectWithContext(ctx, &s3.GetObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(videoKey),
	})
	if err != nil {
		return "", fmt.Errorf("failed to download video: %v", err)
	}
	defer obj.Body.Close()

	// Save to temp file
	file, err := os.Create(videoPath)
	if err != nil {
		return "", fmt.Errorf("failed to create temp file: %v", err)
	}
	defer file.Close()

	_, err = io.Copy(file, obj.Body)
	if err != nil {
		return "", fmt.Errorf("failed to save video: %v", err)
	}

	return videoPath, nil
}

func generateThumbnail(videoPath, timeOffset string, width, height int) (string, error) {
	if timeOffset == "" {
		timeOffset = "00:00:01"
	}
	if width == 0 {
		width = 320
	}
	if height == 0 {
		height = 180
	}

	// Create temp file for thumbnail
	thumbnailPath := fmt.Sprintf("%s_thumb_%d.jpg", strings.TrimSuffix(videoPath, filepath.Ext(videoPath)), time.Now().Unix())

	// Run ffmpeg to generate thumbnail
	cmd := exec.Command("ffmpeg",
		"-ss", timeOffset,
		"-i", videoPath,
		"-vframes", "1",
		"-vf", fmt.Sprintf("scale=%d:%d:force_original_aspect_ratio=decrease,pad=%d:%d:(ow-iw)/2:(oh-ih)/2", width, height, width, height),
		"-q:v", "2",
		thumbnailPath,
	)

	var stderr bytes.Buffer
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		return "", fmt.Errorf("ffmpeg error: %v, stderr: %s", err, stderr.String())
	}

	return thumbnailPath, nil
}

func generateMultipleThumbnails(videoPath string, count, width, height int) ([]string, error) {
	if count == 0 {
		count = 3
	}

	// Get video duration
	cmd := exec.Command("ffprobe",
		"-v", "error",
		"-show_entries", "format=duration",
		"-of", "default=noprint_wrappers=1:nokey=1",
		videoPath,
	)

	output, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("failed to get video duration: %v", err)
	}

	var duration float64
	fmt.Sscanf(strings.TrimSpace(string(output)), "%f", &duration)

	thumbnails := make([]string, 0, count)
	interval := duration / float64(count+1)

	for i := 1; i <= count; i++ {
		timeOffset := fmt.Sprintf("%.2f", interval*float64(i))
		thumbnail, err := generateThumbnail(videoPath, timeOffset, width, height)
		if err != nil {
			log.Printf("Failed to generate thumbnail at %s: %v", timeOffset, err)
			continue
		}
		thumbnails = append(thumbnails, thumbnail)
	}

	return thumbnails, nil
}

func uploadThumbnail(ctx context.Context, thumbnailPath, thumbnailKey string) error {
	file, err := os.Open(thumbnailPath)
	if err != nil {
		return fmt.Errorf("failed to open thumbnail: %v", err)
	}
	defer file.Close()

	_, err = s3Client.PutObjectWithContext(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(bucket),
		Key:         aws.String(thumbnailKey),
		Body:        file,
		ContentType: aws.String("image/jpeg"),
	})

	return err
}

func handleThumbnail(w http.ResponseWriter, r *http.Request) {
	start := time.Now()
	ctx := r.Context()

	var req ThumbnailRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.VideoKey == "" {
		respondWithError(w, "videoKey is required", http.StatusBadRequest)
		return
	}

	// Download video
	log.Printf("Downloading video %s", req.VideoKey)
	videoPath, err := downloadVideo(ctx, req.VideoKey)
	if err != nil {
		respondWithError(w, fmt.Sprintf("Failed to download video: %v", err), http.StatusInternalServerError)
		return
	}
	defer os.Remove(videoPath)

	// Generate thumbnails
	log.Printf("Generating %d thumbnails", req.Count)
	if req.Count > 1 {
		// Generate multiple thumbnails
		thumbnailPaths, err := generateMultipleThumbnails(videoPath, req.Count, req.Width, req.Height)
		if err != nil {
			respondWithError(w, fmt.Sprintf("Failed to generate thumbnails: %v", err), http.StatusInternalServerError)
			return
		}

		// Upload thumbnails
		thumbnailKeys := make([]string, 0, len(thumbnailPaths))
		for i, path := range thumbnailPaths {
			key := fmt.Sprintf("%s_%d.jpg", strings.TrimSuffix(req.ThumbnailKey, ".jpg"), i)
			if err := uploadThumbnail(ctx, path, key); err != nil {
				log.Printf("Failed to upload thumbnail %s: %v", key, err)
				continue
			}
			thumbnailKeys = append(thumbnailKeys, key)
			os.Remove(path)
		}

		respondWithJSON(w, ThumbnailResponse{
			Success:       true,
			ThumbnailKeys: thumbnailKeys,
			Duration:      time.Since(start).Seconds(),
		})
	} else {
		// Generate single thumbnail
		thumbnailPath, err := generateThumbnail(videoPath, req.TimeOffset, req.Width, req.Height)
		if err != nil {
			respondWithError(w, fmt.Sprintf("Failed to generate thumbnail: %v", err), http.StatusInternalServerError)
			return
		}
		defer os.Remove(thumbnailPath)

		// Upload thumbnail
		thumbnailKey := req.ThumbnailKey
		if thumbnailKey == "" {
			thumbnailKey = fmt.Sprintf("thumbnails/%s.jpg", strings.TrimSuffix(filepath.Base(req.VideoKey), filepath.Ext(req.VideoKey)))
		}

		if err := uploadThumbnail(ctx, thumbnailPath, thumbnailKey); err != nil {
			respondWithError(w, fmt.Sprintf("Failed to upload thumbnail: %v", err), http.StatusInternalServerError)
			return
		}

		respondWithJSON(w, ThumbnailResponse{
			Success:      true,
			ThumbnailKey: thumbnailKey,
			Duration:     time.Since(start).Seconds(),
		})
	}
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	// Check if ffmpeg is available
	cmd := exec.Command("ffmpeg", "-version")
	if err := cmd.Run(); err != nil {
		respondWithError(w, "ffmpeg not available", http.StatusServiceUnavailable)
		return
	}

	respondWithJSON(w, map[string]interface{}{
		"status":  "healthy",
		"service": "video-thumbnail",
		"version": "1.0.0",
	})
}

func respondWithJSON(w http.ResponseWriter, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}

func respondWithError(w http.ResponseWriter, message string, statusCode int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(ThumbnailResponse{
		Success: false,
		Error:   message,
	})
}

func main() {
	http.HandleFunc("/thumbnail", handleThumbnail)
	http.HandleFunc("/health", handleHealth)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Video thumbnail service starting on port %s", port)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatal(err)
	}
}