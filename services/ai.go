package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"

	"gin/models"
)

// AIService handles AI-related operations
type AIService struct {
	backendBaseURL string
	client         *http.Client
	llmService     *LLMService // Add LLM service for direct template usage
	useTemplates   bool        // Flag to determine whether to use templates or Python backend
}

// NewAIService creates a new AIService
func NewAIService() *AIService {
	backendBaseURL := os.Getenv("BACKEND_BASE_URL")
	if backendBaseURL == "" {
		backendBaseURL = "http://localhost:5000"
	}

	// Check if we should use templates (check if LLM environment variables are set)
	useTemplates := os.Getenv("LLM_MODEL") != ""

	service := &AIService{
		backendBaseURL: backendBaseURL,
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
		useTemplates: useTemplates,
	}

	// Initialize LLM service if using templates
	if useTemplates {
		service.llmService = NewLLMService()
		log.Printf("AIService initialized with direct LLM integration")
	} else {
		log.Printf("AIService initialized with Python backend integration")
	}

	return service
}

// Conjugate sends a conjugation request to either the LLM service or Python AI service
func (s *AIService) Conjugate(req models.ConjugateRequest) (map[string]interface{}, error) {
	// Use direct LLM service if available
	if s.useTemplates && s.llmService != nil {
		log.Printf("Using direct LLM service for conjugation")
		return s.llmService.ConjugateWithTemplates(req)
	}

	// Fall back to Python backend
	log.Printf("Using Python backend for conjugation")
	return s.conjugateWithPythonBackend(req)
}

// conjugateWithPythonBackend handles conjugation via Python backend (original implementation)
func (s *AIService) conjugateWithPythonBackend(req models.ConjugateRequest) (map[string]interface{}, error) {
	log.Printf("Conjugation request - Sentence: '%s', Base forms: %v, Tense: %s",
		req.Sentence, req.BaseForms, req.Tense)

	// Prepare request payload
	payload := map[string]interface{}{
		"sentence":   req.Sentence,
		"words":      req.Words,
		"base_forms": req.BaseForms,
		"tense":      req.Tense,
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		log.Printf("Error marshaling conjugate request: %v", err)
		return nil, fmt.Errorf("error marshaling request: %w", err)
	}

	url := fmt.Sprintf("%s/conjugate", s.backendBaseURL)
	log.Printf("Forwarding request to AI service: %s", url)

	resp, err := s.client.Post(url, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		log.Printf("Error making request to AI service: %v", err)
		return nil, fmt.Errorf("error communicating with AI service: %w", err)
	}
	defer resp.Body.Close()

	log.Printf("AI service response status: %d", resp.StatusCode)

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		log.Printf("AI service error response: %s", string(body))
		return nil, fmt.Errorf("AI service responded with status: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("Error reading AI service response: %v", err)
		return nil, fmt.Errorf("error reading AI service response: %w", err)
	}

	var conjugations map[string]interface{}
	if err := json.Unmarshal(body, &conjugations); err != nil {
		log.Printf("Error unmarshaling AI service response: %v", err)
		return nil, fmt.Errorf("error unmarshaling AI service response: %w", err)
	}

	log.Printf("AI service response received, returning conjugations to client")
	return conjugations, nil
}

// Correct sends a correction request to either the LLM service or Python AI service
func (s *AIService) Correct(req models.CorrectRequest) (map[string]interface{}, error) {
	// Use direct LLM service if available
	if s.useTemplates && s.llmService != nil {
		log.Printf("Using direct LLM service for correction")
		return s.llmService.CorrectWithTemplate(req)
	}

	// Fall back to Python backend
	log.Printf("Using Python backend for correction")
	return s.correctWithPythonBackend(req)
}

// correctWithPythonBackend handles correction via Python backend (original implementation)
func (s *AIService) correctWithPythonBackend(req models.CorrectRequest) (map[string]interface{}, error) {
	log.Printf("Correction request - Sentence: '%s'", req.Sentence)

	payload := map[string]interface{}{
		"sentence": req.Sentence,
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		log.Printf("Error marshaling correct request: %v", err)
		return nil, fmt.Errorf("error marshaling request: %w", err)
	}

	url := fmt.Sprintf("%s/correct", s.backendBaseURL)
	log.Printf("Forwarding request to AI service: %s", url)

	resp, err := s.client.Post(url, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		log.Printf("Error making request to AI service: %v", err)
		return nil, fmt.Errorf("error communicating with AI service: %w", err)
	}
	defer resp.Body.Close()

	log.Printf("AI service response status: %d", resp.StatusCode)

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		log.Printf("AI service error response: %s", string(body))
		return nil, fmt.Errorf("AI service responded with status: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("Error reading AI service response: %v", err)
		return nil, fmt.Errorf("error reading AI service response: %w", err)
	}

	var correctedData map[string]interface{}
	if err := json.Unmarshal(body, &correctedData); err != nil {
		log.Printf("Error unmarshaling AI service response: %v", err)
		return nil, fmt.Errorf("error unmarshaling AI service response: %w", err)
	}

	log.Printf("AI service response received, returning corrections to client")
	return correctedData, nil
}
