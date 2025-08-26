package ollama

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"
)

// Client represents the Ollama client interface
type Client interface {
	Chat(model, prompt string, options ...ChatOption) (*Response, error)
	SimpleChat(model, prompt string) (string, error)
}

// Request represents the request structure for Ollama API based on the official documentation
type Request struct {
	Model    string    `json:"model"`
	Messages []Message `json:"messages"`
	Stream   bool      `json:"stream"`
	Format   string    `json:"format,omitempty"` // Optional field for JSON response format
}

// Message represents a message in the conversation
type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// Response represents the response structure from Ollama API
type Response struct {
	Model              string    `json:"model"`
	CreatedAt          time.Time `json:"created_at"`
	Message            Message   `json:"message"`
	Done               bool      `json:"done"`
	TotalDuration      int64     `json:"total_duration"`
	LoadDuration       int       `json:"load_duration"`
	PromptEvalCount    int       `json:"prompt_eval_count"`
	PromptEvalDuration int       `json:"prompt_eval_duration"`
	EvalCount          int       `json:"eval_count"`
	EvalDuration       int64     `json:"eval_duration"`
}

// ClientImpl handles interactions with Ollama API
type ClientImpl struct {
	BaseURL    string
	HTTPClient *http.Client
}

// NewClient creates a new Ollama client with the given configuration
func NewClient(config *ClientConfig) Client {
	return &ClientImpl{
		BaseURL: config.BaseURL,
		HTTPClient: &http.Client{
			Timeout: config.Timeout,
		},
	}
}

// ClientConfig holds configuration for the Ollama client
type ClientConfig struct {
	BaseURL string
	Timeout time.Duration
}

// Chat sends a chat request to Ollama and returns the response
func (c *ClientImpl) Chat(model, prompt string, options ...ChatOption) (*Response, error) {
	// Build the request with default values
	req := Request{
		Model: model,
		Messages: []Message{
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
	defer func() {
		if err := httpResp.Body.Close(); err != nil {
			log.Printf("Warning: failed to close response body: %v", err)
		}
	}()

	// Check for HTTP errors
	if httpResp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("ollama API error (status %d)", httpResp.StatusCode)
	}

	// Decode the response
	var ollamaResp Response
	if err := json.NewDecoder(httpResp.Body).Decode(&ollamaResp); err != nil {
		return nil, fmt.Errorf("error decoding ollama response: %w", err)
	}

	return &ollamaResp, nil
}

// ChatOption is a function type for configuring chat requests
type ChatOption func(*Request)

// WithJSONFormat sets the response format to JSON
func WithJSONFormat() ChatOption {
	return func(req *Request) {
		req.Format = "json"
	}
}

// WithStreaming enables streaming responses
func WithStreaming(stream bool) ChatOption {
	return func(req *Request) {
		req.Stream = stream
	}
}

// WithMessages allows setting custom messages for conversation context
func WithMessages(messages []Message) ChatOption {
	return func(req *Request) {
		req.Messages = messages
	}
}

// WithSystemMessage adds a system message to the conversation
func WithSystemMessage(systemPrompt string) ChatOption {
	return func(req *Request) {
		// Prepend system message to existing messages
		systemMsg := Message{
			Role:    "system",
			Content: systemPrompt,
		}
		req.Messages = append([]Message{systemMsg}, req.Messages...)
	}
}

// SimpleChat is a convenience function for basic chat interactions
func (c *ClientImpl) SimpleChat(model, prompt string) (string, error) {
	resp, err := c.Chat(model, prompt, WithJSONFormat())
	if err != nil {
		return "", err
	}

	if !resp.Done {
		return "", fmt.Errorf("ollama response not completed")
	}

	return resp.Message.Content, nil
}
