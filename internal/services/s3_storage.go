package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/daniele/web-app-caa/internal/config"
)

// S3StorageService manages RAG knowledge files in S3
type S3StorageService struct {
	client     *s3.Client
	bucketName string
	keyPrefix  string
	enabled    bool
}

// S3Object represents an S3 object with metadata
type S3Object struct {
	Key          string
	LastModified time.Time
	Size         int64
	Content      []byte
}

// NewS3StorageService creates a new S3 storage service
func NewS3StorageService(cfg *config.Config) *S3StorageService {
	if !cfg.S3.Enabled {
		log.Printf("S3 storage is disabled")
		return &S3StorageService{enabled: false}
	}

	// Load AWS configuration
	awsCfg, err := awsconfig.LoadDefaultConfig(context.TODO(),
		awsconfig.WithRegion(cfg.S3.Region),
		awsconfig.WithCredentialsProvider(aws.CredentialsProviderFunc(func(ctx context.Context) (aws.Credentials, error) {
			return aws.Credentials{
				AccessKeyID:     cfg.S3.AccessKeyID,
				SecretAccessKey: cfg.S3.SecretAccessKey,
			}, nil
		})),
	)
	if err != nil {
		log.Printf("Error loading AWS config: %v", err)
		return &S3StorageService{enabled: false}
	}

	// Create S3 client
	var s3Client *s3.Client
	if cfg.S3.Endpoint != "" {
		// Use custom endpoint (for LocalStack, RustFS, etc.)
		s3Client = s3.NewFromConfig(awsCfg, func(o *s3.Options) {
			o.BaseEndpoint = aws.String(cfg.S3.Endpoint)
			o.UsePathStyle = cfg.S3.ForcePathStyle
		})
	} else {
		s3Client = s3.NewFromConfig(awsCfg)
	}

	service := &S3StorageService{
		client:     s3Client,
		bucketName: cfg.S3.BucketName,
		keyPrefix:  cfg.S3.KeyPrefix,
		enabled:    true,
	}

	log.Printf("S3StorageService initialized - Bucket: %s, Region: %s, Prefix: %s",
		cfg.S3.BucketName, cfg.S3.Region, cfg.S3.KeyPrefix)

	return service
}

// IsEnabled returns whether S3 storage is enabled
func (s *S3StorageService) IsEnabled() bool {
	return s.enabled
}

// GetRagKnowledge retrieves the RAG knowledge JSON from S3
func (s *S3StorageService) GetRagKnowledge(ctx context.Context) (map[string]interface{}, error) {
	if !s.enabled {
		return nil, fmt.Errorf("S3 storage is not enabled")
	}

	key := s.getKnowledgeKey()

	log.Printf("Fetching RAG knowledge from S3: bucket=%s, key=%s", s.bucketName, key)

	// Get object from S3
	result, err := s.client.GetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(s.bucketName),
		Key:    aws.String(key),
	})
	if err != nil {
		return nil, fmt.Errorf("error getting object from S3: %w", err)
	}
	defer result.Body.Close()

	// Read the content
	content, err := io.ReadAll(result.Body)
	if err != nil {
		return nil, fmt.Errorf("error reading S3 object content: %w", err)
	}

	// Parse JSON
	var knowledge map[string]interface{}
	if err := json.Unmarshal(content, &knowledge); err != nil {
		return nil, fmt.Errorf("error parsing RAG knowledge JSON: %w", err)
	}

	log.Printf("Successfully retrieved RAG knowledge from S3 (%d bytes)", len(content))
	return knowledge, nil
}

// PutRagKnowledge uploads RAG knowledge JSON to S3
func (s *S3StorageService) PutRagKnowledge(ctx context.Context, knowledge map[string]interface{}) error {
	if !s.enabled {
		return fmt.Errorf("S3 storage is not enabled")
	}

	key := s.getKnowledgeKey()

	// Convert to JSON
	content, err := json.MarshalIndent(knowledge, "", "  ")
	if err != nil {
		return fmt.Errorf("error marshaling knowledge to JSON: %w", err)
	}

	log.Printf("Uploading RAG knowledge to S3: bucket=%s, key=%s (%d bytes)",
		s.bucketName, key, len(content))

	// Upload to S3
	_, err = s.client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(s.bucketName),
		Key:         aws.String(key),
		Body:        bytes.NewReader(content),
		ContentType: aws.String("application/json"),
	})
	if err != nil {
		return fmt.Errorf("error uploading to S3: %w", err)
	}

	log.Printf("Successfully uploaded RAG knowledge to S3")
	return nil
}

// ListRagKnowledgeVersions lists all versions of RAG knowledge files in S3
func (s *S3StorageService) ListRagKnowledgeVersions(ctx context.Context) ([]S3Object, error) {
	if !s.enabled {
		return nil, fmt.Errorf("S3 storage is not enabled")
	}

	prefix := s.keyPrefix
	if prefix != "" && prefix[len(prefix)-1] != '/' {
		prefix += "/"
	}

	log.Printf("Listing RAG knowledge versions from S3: bucket=%s, prefix=%s", s.bucketName, prefix)

	// List objects with prefix
	result, err := s.client.ListObjectsV2(ctx, &s3.ListObjectsV2Input{
		Bucket: aws.String(s.bucketName),
		Prefix: aws.String(prefix),
	})
	if err != nil {
		return nil, fmt.Errorf("error listing S3 objects: %w", err)
	}

	var objects []S3Object
	for _, obj := range result.Contents {
		objects = append(objects, S3Object{
			Key:          *obj.Key,
			LastModified: *obj.LastModified,
			Size:         *obj.Size,
		})
	}

	log.Printf("Found %d RAG knowledge objects in S3", len(objects))
	return objects, nil
}

// BackupRagKnowledge creates a timestamped backup of the current RAG knowledge
func (s *S3StorageService) BackupRagKnowledge(ctx context.Context, knowledge map[string]interface{}) error {
	if !s.enabled {
		return fmt.Errorf("S3 storage is not enabled")
	}

	// Create backup key with timestamp
	timestamp := time.Now().Format("20060102_150405")
	backupKey := s.getBackupKey(timestamp)

	// Convert to JSON
	content, err := json.MarshalIndent(knowledge, "", "  ")
	if err != nil {
		return fmt.Errorf("error marshaling knowledge to JSON: %w", err)
	}

	log.Printf("Creating RAG knowledge backup: bucket=%s, key=%s", s.bucketName, backupKey)

	// Upload backup to S3
	_, err = s.client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(s.bucketName),
		Key:         aws.String(backupKey),
		Body:        bytes.NewReader(content),
		ContentType: aws.String("application/json"),
	})
	if err != nil {
		return fmt.Errorf("error uploading backup to S3: %w", err)
	}

	log.Printf("Successfully created RAG knowledge backup")
	return nil
}

// RestoreRagKnowledge restores RAG knowledge from a specific backup
func (s *S3StorageService) RestoreRagKnowledge(ctx context.Context, backupKey string) (map[string]interface{}, error) {
	if !s.enabled {
		return nil, fmt.Errorf("S3 storage is not enabled")
	}

	log.Printf("Restoring RAG knowledge from backup: bucket=%s, key=%s", s.bucketName, backupKey)

	// Get backup object from S3
	result, err := s.client.GetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(s.bucketName),
		Key:    aws.String(backupKey),
	})
	if err != nil {
		return nil, fmt.Errorf("error getting backup from S3: %w", err)
	}
	defer result.Body.Close()

	// Read the content
	content, err := io.ReadAll(result.Body)
	if err != nil {
		return nil, fmt.Errorf("error reading backup content: %w", err)
	}

	// Parse JSON
	var knowledge map[string]interface{}
	if err := json.Unmarshal(content, &knowledge); err != nil {
		return nil, fmt.Errorf("error parsing backup JSON: %w", err)
	}

	log.Printf("Successfully restored RAG knowledge from backup (%d bytes)", len(content))
	return knowledge, nil
}

// CheckHealth verifies S3 connectivity and bucket access
func (s *S3StorageService) CheckHealth(ctx context.Context) error {
	if !s.enabled {
		return fmt.Errorf("S3 storage is not enabled")
	}

	// Try to head the bucket to check if it exists and we have access
	_, err := s.client.HeadBucket(ctx, &s3.HeadBucketInput{
		Bucket: aws.String(s.bucketName),
	})
	if err != nil {
		return fmt.Errorf("S3 health check failed - cannot access bucket %s: %w", s.bucketName, err)
	}

	log.Printf("S3 health check passed for bucket: %s", s.bucketName)
	return nil
}

// getKnowledgeKey returns the S3 key for the main RAG knowledge file
func (s *S3StorageService) getKnowledgeKey() string {
	if s.keyPrefix == "" {
		return "rag_knowledge.json"
	}

	prefix := s.keyPrefix
	if prefix[len(prefix)-1] != '/' {
		prefix += "/"
	}
	return prefix + "rag_knowledge.json"
}

// getBackupKey returns the S3 key for a backup file with timestamp
func (s *S3StorageService) getBackupKey(timestamp string) string {
	if s.keyPrefix == "" {
		return fmt.Sprintf("backups/rag_knowledge_%s.json", timestamp)
	}

	prefix := s.keyPrefix
	if prefix[len(prefix)-1] != '/' {
		prefix += "/"
	}
	return fmt.Sprintf("%sbackups/rag_knowledge_%s.json", prefix, timestamp)
}
