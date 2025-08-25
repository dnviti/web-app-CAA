package middleware

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// OllamaRequest represents the request structure for Ollama API based on the official documentation
type OllamaRequest struct {
	Model    string          `json:"model"`
	Messages []OllamaMessage `json:"messages"`
	Stream   bool            `json:"stream"`
	Format   string          `json:"format,omitempty"` // Optional field for JSON response format
}

// OllamaMessage represents a message in the conversation
type OllamaMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// OllamaResponse represents the response structure from Ollama API
type OllamaResponse struct {
	Model              string        `json:"model"`
	CreatedAt          time.Time     `json:"created_at"`
	Message            OllamaMessage `json:"message"`
	Done               bool          `json:"done"`
	TotalDuration      int64         `json:"total_duration"`
	LoadDuration       int           `json:"load_duration"`
	PromptEvalCount    int           `json:"prompt_eval_count"`
	PromptEvalDuration int           `json:"prompt_eval_duration"`
	EvalCount          int           `json:"eval_count"`
	EvalDuration       int64         `json:"eval_duration"`
}

// OllamaClient handles interactions with Ollama API
type OllamaClient struct {
	BaseURL    string
	HTTPClient *http.Client
}

// NewOllamaClient creates a new Ollama client with the given configuration
func NewOllamaClient(baseURL string) *OllamaClient {
	if baseURL == "" {
		baseURL = "http://localhost:11434" // Default Ollama URL
	}

	return &OllamaClient{
		BaseURL: baseURL,
		HTTPClient: &http.Client{
			Timeout: 60 * time.Second,
		},
	}
}

// Chat sends a chat request to Ollama and returns the response
func (c *OllamaClient) Chat(model, prompt string, options ...ChatOption) (*OllamaResponse, error) {
	// Build the request with default values
	req := OllamaRequest{
		Model: model,
		Messages: []OllamaMessage{
			{
				Role:    "user",
				Content: prompt,
			},
		},
		Stream: false, // Default to non-streaming
	}

	// Apply any options
	for _, option := range options {
		option(&req)
	}

	// Marshal the request to JSON
	jsonData, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("error marshaling ollama request: %w", err)
	}

	// Create HTTP request
	url := fmt.Sprintf("%s/api/chat", c.BaseURL)
	httpReq, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(jsonData))
	if err != nil {
		return nil, fmt.Errorf("error creating HTTP request: %w", err)
	}

	httpReq.Header.Set("Content-Type", "application/json")

	// Send the request
	httpResp, err := c.HTTPClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("error making ollama request: %w", err)
	}
	defer httpResp.Body.Close()

	// Check for HTTP errors
	if httpResp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("ollama API error (status %d)", httpResp.StatusCode)
	}

	// Decode the response
	var ollamaResp OllamaResponse
	if err := json.NewDecoder(httpResp.Body).Decode(&ollamaResp); err != nil {
		return nil, fmt.Errorf("error decoding ollama response: %w", err)
	}

	return &ollamaResp, nil
}

// ChatOption is a function type for configuring chat requests
type ChatOption func(*OllamaRequest)

// WithJSONFormat sets the response format to JSON
func WithJSONFormat() ChatOption {
	return func(req *OllamaRequest) {
		req.Format = "json"
	}
}

// WithStreaming enables streaming responses
func WithStreaming(stream bool) ChatOption {
	return func(req *OllamaRequest) {
		req.Stream = stream
	}
}

// WithMessages allows setting custom messages for conversation context
func WithMessages(messages []OllamaMessage) ChatOption {
	return func(req *OllamaRequest) {
		req.Messages = messages
	}
}

// WithSystemMessage adds a system message to the conversation
func WithSystemMessage(systemPrompt string) ChatOption {
	return func(req *OllamaRequest) {
		// Prepend system message to existing messages
		systemMsg := OllamaMessage{
			Role:    "system",
			Content: systemPrompt,
		}
		req.Messages = append([]OllamaMessage{systemMsg}, req.Messages...)
	}
}

// SimpleChat is a convenience function for basic chat interactions
func (c *OllamaClient) SimpleChat(model, prompt string) (string, error) {
	resp, err := c.Chat(model, prompt, WithJSONFormat())
	if err != nil {
		return "", err
	}

	if !resp.Done {
		return "", fmt.Errorf("ollama response not completed")
	}

	return resp.Message.Content, nil
}
