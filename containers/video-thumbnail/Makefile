.PHONY: build run test docker-build docker-run clean

# Variables
BINARY_NAME=video-thumbnail
DOCKER_IMAGE=vidtalk-video-thumbnail
DOCKER_TAG=latest

# Build the Go binary
build:
	go build -o $(BINARY_NAME) main.go

# Run the application locally
run:
	go run main.go

# Run tests
test:
	go test -v ./...

# Build Docker image
docker-build:
	docker build -t $(DOCKER_IMAGE):$(DOCKER_TAG) .

# Run Docker container
docker-run:
	docker run --rm \
		-p 8080:8080 \
		-e CLOUDFLARE_ACCOUNT_ID="$${CLOUDFLARE_ACCOUNT_ID}" \
		-e R2_ACCESS_KEY_ID="$${R2_ACCESS_KEY_ID}" \
		-e R2_SECRET_ACCESS_KEY="$${R2_SECRET_ACCESS_KEY}" \
		-e R2_BUCKET="vidtalk" \
		$(DOCKER_IMAGE):$(DOCKER_TAG)

# Run Docker container with test video
docker-test:
	@echo "Testing thumbnail generation..."
	@echo "1. Start the container with: make docker-run"
	@echo "2. In another terminal, run:"
	@echo '   curl -X POST http://localhost:8080/thumbnail \\'
	@echo '     -H "Content-Type: application/json" \\'
	@echo '     -d '"'"'{"videoKey":"videos/test.mp4","thumbnailKey":"thumbnails/test.jpg"}'"'"''

# Clean up
clean:
	rm -f $(BINARY_NAME)
	docker rmi $(DOCKER_IMAGE):$(DOCKER_TAG) || true

# Install dependencies
deps:
	go mod download
	go mod tidy

# Format code
fmt:
	go fmt ./...

# Lint code
lint:
	golangci-lint run

# Build for multiple platforms
build-all:
	GOOS=linux GOARCH=amd64 go build -o $(BINARY_NAME)-linux-amd64 main.go
	GOOS=darwin GOARCH=amd64 go build -o $(BINARY_NAME)-darwin-amd64 main.go
	GOOS=windows GOARCH=amd64 go build -o $(BINARY_NAME)-windows-amd64.exe main.go

# Health check
health:
	curl -f http://localhost:8080/health || exit 1