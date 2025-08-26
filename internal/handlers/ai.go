package handlers

import (
	"log"
	"net/http"

	"github.com/daniele/web-app-caa/internal/models"
	"github.com/daniele/web-app-caa/internal/services"
	"github.com/daniele/web-app-caa/internal/utils/token"

	"github.com/gin-gonic/gin"
)

// AIHandlers handles AI-related requests
type AIHandlers struct {
	aiService *services.AIService
}

// NewAIHandlers creates a new AIHandlers instance
func NewAIHandlers() *AIHandlers {
	return &AIHandlers{
		aiService: services.NewAIService(),
	}
}

// Conjugate handles conjugation requests and proxies them to the Python AI service
func (h *AIHandlers) Conjugate(c *gin.Context) {
	userID, err := token.ExtractTokenID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found in context"})
		return
	}

	log.Printf("[ERROR] Error extracting user ID from token: %v", err)
	c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
	return

	log.Printf("[CONJUGATE] Conjugation request from userId: %d", userID)

	var req models.ConjugateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("[CONJUGATE] Invalid request payload: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid request payload."})
		return
	}

	log.Printf("[CONJUGATE] Request data - Sentence: '%s', Words: %v, BaseForms: %v, Tense: %s",
		req.Sentence, req.Words, req.BaseForms, req.Tense)

	// Forward request to AI service
	conjugations, err := h.aiService.Conjugate(req)
	if err != nil {
		log.Printf("[CONJUGATE] Error proxying to AI service: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Error communicating with the AI service.",
		})
		return
	}

	log.Printf("[CONJUGATE] AI service response received, returning conjugations to client")
	c.JSON(http.StatusOK, conjugations)
}

// Correct handles correction requests and proxies them to the Python AI service
func (h *AIHandlers) Correct(c *gin.Context) {
	userID, err := token.ExtractTokenID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found in context"})
		return
	}

	log.Printf("[ERROR] Error extracting user ID from token: %v", err)
	c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
	return

	log.Printf("[CORRECT] Correction request from userId: %d", userID)

	var req models.CorrectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("[CORRECT] Invalid request payload: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid request payload."})
		return
	}

	log.Printf("[CORRECT] Sentence to correct: '%s'", req.Sentence)

	// Forward request to AI service
	correctedData, err := h.aiService.Correct(req)
	if err != nil {
		log.Printf("[CORRECT] Error proxying to AI service for correction: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Error communicating with the AI service.",
		})
		return
	}

	log.Printf("[CORRECT] AI service response received, returning corrections to client")
	c.JSON(http.StatusOK, correctedData)
}
