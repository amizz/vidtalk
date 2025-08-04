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

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
)

type ConversionRequest struct {
	VideoID  string `json:"videoId"`
	VideoURL string `json:"videoUrl"` // This will be the R2 key, not a full URL
}

type ConversionResponse struct {
	Success bool   `json:"success"`
	MP3URL  string `json:"mp3Url,omitempty"`
	Error   string `json:"error,omitempty"`
}

var s3Client *s3.S3

func init() {
	// Initialize S3 client for R2
	r2AccountID := os.Getenv("R2_ACCOUNT_ID")
	r2AccessKeyID := os.Getenv("R2_ACCESS_KEY_ID")
	r2SecretAccessKey := os.Getenv("R2_SECRET_ACCESS_KEY")
	r2BucketName := os.Getenv("R2_BUCKET_NAME")

	if r2AccountID == "" || r2AccessKeyID == "" || r2SecretAccessKey == "" || r2BucketName == "" {
		log.Println("Warning: R2 credentials not fully configured")
		return
	}

	sess, err := session.NewSession(&aws.Config{
		Endpoint: aws.String(fmt.Sprintf("https://%s.r2.cloudflarestorage.com", r2AccountID)),
		Region:   aws.String("auto"),
		Credentials: credentials.NewStaticCredentials(
			r2AccessKeyID,
			r2SecretAccessKey,
			"",
		),
		S3ForcePathStyle: aws.Bool(true),
	})

	if err != nil {
		log.Printf("Failed to create R2 session: %v", err)
		return
	}

	s3Client = s3.New(sess)
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	http.HandleFunc("/health", healthHandler)
	http.HandleFunc("/process", processHandler)

	log.Printf("Server starting on port %s", port)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatal(err)
	}
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("OK"))
}

func processHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse JSON request
	var req ConversionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendJSONError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.VideoID == "" || req.VideoURL == "" {
		sendJSONError(w, "Missing videoId or videoUrl", http.StatusBadRequest)
		return
	}

	// Create temp directory for processing
	tempDir, err := os.MkdirTemp("", fmt.Sprintf("video-convert-%s-*", req.VideoID))
	if err != nil {
		sendJSONError(w, "Failed to create temp directory", http.StatusInternalServerError)
		return
	}
	defer os.RemoveAll(tempDir)

	// Step 1: Download video from R2
	// Extract the R2 key from the URL if it's a full URL
	videoKey := req.VideoURL
	if strings.HasPrefix(videoKey, "http") {
		// Extract key from full URL (e.g., https://pub-xxx.r2.dev/videos/...)
		parts := strings.Split(videoKey, "/")
		for i, part := range parts {
			if part == "videos" && i < len(parts)-1 {
				videoKey = strings.Join(parts[i:], "/")
				break
			}
		}
	}
	
	log.Printf("Downloading video %s with key %s", req.VideoID, videoKey)
	videoPath := filepath.Join(tempDir, "input.mp4")
	if err := downloadVideoFromR2(r.Context(), videoKey, videoPath); err != nil {
		sendJSONError(w, fmt.Sprintf("Failed to download video: %v", err), http.StatusInternalServerError)
		return
	}

	// Step 2: Convert to MP3
	log.Printf("Converting video %s to MP3", req.VideoID)
	mp3Path := filepath.Join(tempDir, "output.mp3")
	if err := convertToMP3(videoPath, mp3Path); err != nil {
		sendJSONError(w, fmt.Sprintf("Failed to convert video: %v", err), http.StatusInternalServerError)
		return
	}

	// Step 3: Upload to R2
	log.Printf("Uploading MP3 for video %s to R2", req.VideoID)
	mp3URL, err := uploadToR2(req.VideoID, mp3Path)
	if err != nil {
		sendJSONError(w, fmt.Sprintf("Failed to upload MP3: %v", err), http.StatusInternalServerError)
		return
	}

	// Send success response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ConversionResponse{
		Success: true,
		MP3URL:  mp3URL,
	})
}

func downloadVideoFromR2(ctx context.Context, videoKey string, outputPath string) error {
	// Download video from R2 using S3 SDK
	obj, err := s3Client.GetObjectWithContext(ctx, &s3.GetObjectInput{
		Bucket: aws.String(os.Getenv("R2_BUCKET_NAME")),
		Key:    aws.String(videoKey),
	})
	if err != nil {
		return fmt.Errorf("failed to get object from R2: %v", err)
	}
	defer obj.Body.Close()

	// Save to local file
	file, err := os.Create(outputPath)
	if err != nil {
		return fmt.Errorf("failed to create file: %v", err)
	}
	defer file.Close()

	_, err = io.Copy(file, obj.Body)
	if err != nil {
		return fmt.Errorf("failed to save video: %v", err)
	}

	return nil
}

func convertToMP3(inputPath, outputPath string) error {
	cmd := exec.Command("ffmpeg",
		"-i", inputPath,
		"-vn", // No video
		"-acodec", "libmp3lame",
		"-ab", "128k", // 128 kbps bitrate
		"-ar", "44100", // 44.1 kHz sample rate
		"-y", // Overwrite output file
		outputPath,
	)

	output, err := cmd.CombinedOutput()
	if err != nil {
		log.Printf("FFmpeg error: %s", string(output))
		return fmt.Errorf("ffmpeg failed: %w", err)
	}

	return nil
}

func uploadToR2(videoID, mp3Path string) (string, error) {
	if s3Client == nil {
		return "", fmt.Errorf("R2 client not initialized")
	}

	// Read the MP3 file
	mp3Data, err := os.ReadFile(mp3Path)
	if err != nil {
		return "", fmt.Errorf("failed to read MP3 file: %w", err)
	}

	// Upload to R2
	bucketName := os.Getenv("R2_BUCKET_NAME")
	key := fmt.Sprintf("/videos/%s/audio.mp3", videoID)

	_, err = s3Client.PutObject(&s3.PutObjectInput{
		Bucket:      aws.String(bucketName),
		Key:         aws.String(key),
		Body:        bytes.NewReader(mp3Data),
		ContentType: aws.String("audio/mpeg"),
	})

	if err != nil {
		return "", fmt.Errorf("failed to upload to R2: %w", err)
	}

	// Return the public URL
	publicURL := os.Getenv("R2_PUBLIC_URL")
	if publicURL == "" {
		publicURL = fmt.Sprintf("https://%s.r2.cloudflarestorage.com", os.Getenv("R2_ACCOUNT_ID"))
	}

	return fmt.Sprintf("%s%s", publicURL, key), nil
}

func sendJSONError(w http.ResponseWriter, message string, statusCode int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(ConversionResponse{
		Success: false,
		Error:   message,
	})
}