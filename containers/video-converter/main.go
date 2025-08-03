package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

type ConversionRequest struct {
	Format string `json:"format"` // mp3, wav, aac, etc.
}

type ConversionResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message,omitempty"`
	Error   string `json:"error,omitempty"`
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	http.HandleFunc("/health", healthHandler)
	http.HandleFunc("/convert", convertHandler)

	log.Printf("Server starting on port %s", port)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatal(err)
	}
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("OK"))
}

func convertHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse multipart form
	err := r.ParseMultipartForm(100 << 20) // 100 MB max
	if err != nil {
		sendJSONError(w, "Failed to parse form", http.StatusBadRequest)
		return
	}

	// Get the uploaded file
	file, header, err := r.FormFile("video")
	if err != nil {
		sendJSONError(w, "Failed to get video file", http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Get the desired format
	format := r.FormValue("format")
	if format == "" {
		format = "mp3" // Default to mp3
	}

	// Validate format
	validFormats := map[string]bool{
		"mp3": true,
		"wav": true,
		"aac": true,
		"ogg": true,
		"m4a": true,
	}

	if !validFormats[format] {
		sendJSONError(w, fmt.Sprintf("Invalid format: %s", format), http.StatusBadRequest)
		return
	}

	// Create temp directory for processing
	tempDir, err := os.MkdirTemp("", "video-convert-*")
	if err != nil {
		sendJSONError(w, "Failed to create temp directory", http.StatusInternalServerError)
		return
	}
	defer os.RemoveAll(tempDir)

	// Save uploaded file
	inputPath := filepath.Join(tempDir, header.Filename)
	inputFile, err := os.Create(inputPath)
	if err != nil {
		sendJSONError(w, "Failed to create input file", http.StatusInternalServerError)
		return
	}
	defer inputFile.Close()

	_, err = io.Copy(inputFile, file)
	if err != nil {
		sendJSONError(w, "Failed to save input file", http.StatusInternalServerError)
		return
	}

	// Generate output filename
	outputFilename := strings.TrimSuffix(header.Filename, filepath.Ext(header.Filename)) + "." + format
	outputPath := filepath.Join(tempDir, outputFilename)

	// Convert using ffmpeg
	cmd := exec.Command("ffmpeg",
		"-i", inputPath,
		"-vn", // No video
		"-acodec", getAudioCodec(format),
		"-y", // Overwrite output file
		outputPath,
	)

	output, err := cmd.CombinedOutput()
	if err != nil {
		log.Printf("FFmpeg error: %s", string(output))
		sendJSONError(w, fmt.Sprintf("Conversion failed: %s", err), http.StatusInternalServerError)
		return
	}

	// Read the converted file
	convertedData, err := os.ReadFile(outputPath)
	if err != nil {
		sendJSONError(w, "Failed to read converted file", http.StatusInternalServerError)
		return
	}

	// Set response headers
	w.Header().Set("Content-Type", getContentType(format))
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", outputFilename))
	w.Header().Set("Content-Length", fmt.Sprintf("%d", len(convertedData)))

	// Send the converted file
	w.Write(convertedData)
}

func getAudioCodec(format string) string {
	switch format {
	case "mp3":
		return "libmp3lame"
	case "wav":
		return "pcm_s16le"
	case "aac":
		return "aac"
	case "ogg":
		return "libvorbis"
	case "m4a":
		return "aac"
	default:
		return "copy"
	}
}

func getContentType(format string) string {
	switch format {
	case "mp3":
		return "audio/mpeg"
	case "wav":
		return "audio/wav"
	case "aac":
		return "audio/aac"
	case "ogg":
		return "audio/ogg"
	case "m4a":
		return "audio/mp4"
	default:
		return "application/octet-stream"
	}
}

func sendJSONError(w http.ResponseWriter, message string, statusCode int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(ConversionResponse{
		Success: false,
		Error:   message,
	})
}