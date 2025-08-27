package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"

	"github.com/daniele/web-app-caa/internal/config"
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
func NewAIHandlers(cfg *config.Config) *AIHandlers {
	return &AIHandlers{
		aiService: services.NewAIService(cfg),
	}
}

// Conjugate handles conjugation requests and proxies them to the Python AI service
// @Summary Conjugate verbs
// @Description Conjugate verbs in Italian based on tense and context
// @Tags AI
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body models.ConjugateRequest true "Conjugation request"
// @Success 200 {object} models.ConjugateResponse
// @Failure 400 {object} models.ErrorResponse
// @Failure 401 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /conjugate [post]
func (h *AIHandlers) Conjugate(c *gin.Context) {
	userID, err := token.ExtractTokenID(c)
	if err != nil {
		log.Printf("[ERROR] Error extracting user ID from token: %v", err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
		return
	}

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
// @Summary Correct sentences
// @Description Correct Italian sentences using AI language processing
// @Tags AI
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body models.CorrectRequest true "Correction request"
// @Success 200 {object} models.CorrectResponse
// @Failure 400 {object} models.ErrorResponse
// @Failure 401 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /correct [post]
func (h *AIHandlers) Correct(c *gin.Context) {
	userID, err := token.ExtractTokenID(c)
	if err != nil {
		log.Printf("[ERROR] Error extracting user ID from token: %v", err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
		return
	}

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

// ArasaacKeyword represents an ARASAAC keyword
type ArasaacKeyword struct {
	Type        int    `json:"type"`
	Keyword     string `json:"keyword"`
	HasLocution bool   `json:"hasLocution"`
	Plural      string `json:"plural"`
}

// ArasaacIcon represents an ARASAAC icon
type ArasaacIcon struct {
	ID       int              `json:"_id"`
	Keywords []ArasaacKeyword `json:"keywords"`
}

// SearchArasaac handles ARASAAC icon search requests
// @Summary Search ARASAAC icons
// @Description Search for ARASAAC icons by keyword
// @Tags AI
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param query query string true "Search query"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} models.ErrorResponse
// @Failure 401 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /ai/search-arasaac [get]
func (h *AIHandlers) SearchArasaac(c *gin.Context) {
	userID, err := token.ExtractTokenID(c)
	if err != nil {
		log.Printf("[ERROR] Error extracting user ID from token: %v", err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
		return
	}

	query := c.Query("query")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Query parameter is required"})
		return
	}

	log.Printf("[ARASAAC-SEARCH] Search request from userId: %d, query: '%s'", userID, query)

	// Call ARASAAC API directly with Italian language parameter
	arasaacURL := fmt.Sprintf("https://api.arasaac.org/api/pictograms/it/search/%s", url.QueryEscape(query))

	resp, err := http.Get(arasaacURL)
	if err != nil {
		log.Printf("[ARASAAC-SEARCH] Error calling ARASAAC API: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to search icons"})
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		log.Printf("[ARASAAC-SEARCH] ARASAAC API returned status: %d", resp.StatusCode)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "External API error"})
		return
	}

	var icons []ArasaacIcon
	if err := json.NewDecoder(resp.Body).Decode(&icons); err != nil {
		log.Printf("[ARASAAC-SEARCH] Error decoding ARASAAC response: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode response"})
		return
	}

	log.Printf("[ARASAAC-SEARCH] Found %d icons for query '%s'", len(icons), query)

	c.JSON(http.StatusOK, gin.H{
		"icons": icons,
	})
}
