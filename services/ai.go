package services

import (
	"log"

	"gin/models"
)

// AIService handles AI-related operations
type AIService struct {
	llmService *LLMService // LLM service for direct template usage
}

// NewAIService creates a new AIService
func NewAIService() *AIService {
	service := &AIService{
		llmService: NewLLMService(),
	}

	log.Printf("AIService initialized with direct LLM integration")
	return service
}

// Conjugate sends a conjugation request to the LLM service
func (s *AIService) Conjugate(req models.ConjugateRequest) (map[string]interface{}, error) {
	log.Printf("Using direct LLM service for conjugation")
	return s.llmService.ConjugateWithTemplates(req)
}

// Correct sends a correction request to the LLM service
func (s *AIService) Correct(req models.CorrectRequest) (map[string]interface{}, error) {
	log.Printf("Using direct LLM service for correction")
	return s.llmService.CorrectWithTemplate(req)
}
