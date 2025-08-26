# Build stage
FROM golang:1.24.6-alpine AS builder

# Install git, ca-certificates, and build tools (needed for go modules, HTTPS, and CGO)
RUN apk add --no-cache git ca-certificates tzdata gcc musl-dev

# Set the Current Working Directory inside the container
WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./

# Download all dependencies
RUN go mod download

# Copy the source code
COPY . .

# Build the Go app with the new project structure - output to bin directory
RUN CGO_ENABLED=1 GOOS=linux go build -a -installsuffix cgo -o bin/web-app-caa ./cmd/web-app-CAA

# Final stage
FROM alpine:latest

# Install ca-certificates and sqlite for runtime
RUN apk --no-cache add ca-certificates sqlite

WORKDIR /root/

# Copy the Pre-built binary file from the previous stage
COPY --from=builder /app/bin/web-app-caa .

# Copy static files, templates, and other necessary files with new structure
COPY --from=builder /app/web ./web
COPY --from=builder /app/internal/prompts ./internal/prompts
COPY --from=builder /app/rag_knowledge.json ./rag_knowledge.json

# Create data directory with proper permissions (application will create database files here)
RUN mkdir -p ./data && chmod 755 ./data

# Expose port 3000 to the outside world
EXPOSE 3000

# Command to run the executable
CMD ["./web-app-caa"]
