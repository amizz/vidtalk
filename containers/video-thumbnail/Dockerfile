# Build stage
FROM golang:1.22-alpine AS builder

# Install build dependencies
RUN apk add --no-cache git

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

# Final stage
FROM alpine:latest

# Install ffmpeg and ffprobe
RUN apk add --no-cache ffmpeg

# Install ca-certificates for HTTPS
RUN apk add --no-cache ca-certificates

# Create non-root user
RUN adduser -D -g '' appuser

WORKDIR /app

# Copy the binary from builder
COPY --from=builder /app/main .

# Change ownership
RUN chown -R appuser:appuser /app

# Create temp directory for video processing
RUN mkdir -p /tmp/video-thumbnail && chown -R appuser:appuser /tmp/video-thumbnail

USER appuser

EXPOSE 8080

CMD ["./main"]