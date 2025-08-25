.PHONY: build run test clean docker-build docker-up docker-down deps

# Go parameters
GOCMD=go
GOBUILD=$(GOCMD) build
GOCLEAN=$(GOCMD) clean
GOTEST=$(GOCMD) test
GOGET=$(GOCMD) get
GOMOD=$(GOCMD) mod

# Binary names
BINARY_NAME=web-app-caa
BINARY_PATH=./bin/$(BINARY_NAME)

# Build the application
build:
	$(GOBUILD) -o $(BINARY_PATH) ./cmd/web-app-caa

# Run the application
run: build
	$(BINARY_PATH)

# Run the application directly without building binary
dev:
	$(GOCMD) run ./cmd/web-app-caa/main.go

# Test all packages
test:
	$(GOTEST) -v ./...

# Clean build artifacts
clean:
	$(GOCLEAN)
	rm -rf ./bin

# Download dependencies
deps:
	$(GOMOD) download
	$(GOMOD) tidy

# Docker commands
docker-build:
	docker build -f deployments/Dockerfile -t $(BINARY_NAME) .

docker-up:
	docker-compose -f deployments/docker-compose.yaml up -d

docker-down:
	docker-compose -f deployments/docker-compose.yaml down

# Format code
fmt:
	$(GOCMD) fmt ./...

# Vet code
vet:
	$(GOCMD) vet ./...

# Lint code (requires golangci-lint)
lint:
	golangci-lint run

# Create binary directory if it doesn't exist
$(BINARY_PATH): | bin
	
bin:
	mkdir -p bin
