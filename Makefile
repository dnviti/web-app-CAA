.PHONY: build run test clean docker-build docker-up docker-down deps swagger

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

# Generate Swagger documentation
swagger:
	~/go/bin/swag init -g cmd/web-app-CAA/main.go --output docs

# Build the application with CGO enabled (required for SQLite)
build:
	CGO_ENABLED=1 $(GOBUILD) -o $(BINARY_PATH) ./cmd/web-app-CAA

# Run the application
run: build
	$(BINARY_PATH)

# Run the application directly without building binary
dev:
	$(GOCMD) run ./cmd/web-app-CAA/main.go

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

docker-build-ghcr:
	docker build -f deployments/Dockerfile -t ghcr.io/dnviti/web-app-caa:latest .

docker-push-ghcr: docker-build-ghcr
	gh auth token | docker login ghcr.io -u dnviti --password-stdin
	docker push ghcr.io/dnviti/web-app-caa:latest

docker-build-and-push:
	./scripts/build-and-push.sh

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
