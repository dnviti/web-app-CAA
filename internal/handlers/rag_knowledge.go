package handlers

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/daniele/web-app-caa/internal/services"
	"github.com/gin-gonic/gin"
)

// RagKnowledgeHandler handles RAG knowledge management operations
type RagKnowledgeHandler struct {
	llmService *services.LLMService
}

// NewRagKnowledgeHandler creates a new RAG knowledge handler
func NewRagKnowledgeHandler(llmService *services.LLMService) *RagKnowledgeHandler {
	return &RagKnowledgeHandler{
		llmService: llmService,
	}
}

// GetRagKnowledge godoc
// @Summary Get RAG knowledge
// @Description Retrieve the current RAG knowledge data used by the AI system for language processing
// @Tags rag-knowledge
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{} "RAG knowledge data"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Security BearerAuth
// @Router /rag-knowledge [get]
func (h *RagKnowledgeHandler) GetRagKnowledge(c *gin.Context) {
	knowledge := h.llmService.GetRagKnowledge()
	if knowledge == nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "No RAG knowledge available",
		})
		return
	}

	c.JSON(http.StatusOK, knowledge)
}

// UpdateRagKnowledge godoc
// @Summary Update RAG knowledge
// @Description Update the RAG knowledge data and optionally save to S3 storage. Requires admin privileges.
// @Tags rag-knowledge
// @Accept json
// @Produce json
// @Param knowledge body map[string]interface{} true "RAG knowledge data structure"
// @Param save_to_s3 query bool false "Whether to save the updated knowledge to S3 storage"
// @Success 200 {object} map[string]interface{} "Success message with S3 save status"
// @Failure 400 {object} map[string]interface{} "Bad request - invalid JSON format"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Security BearerAuth
// @Router /rag-knowledge [put]
func (h *RagKnowledgeHandler) UpdateRagKnowledge(c *gin.Context) {
	var knowledge map[string]interface{}
	if err := c.ShouldBindJSON(&knowledge); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid JSON format",
		})
		return
	}

	// Check if we should save to S3
	saveToS3 := false
	if saveToS3Param := c.Query("save_to_s3"); saveToS3Param != "" {
		if parsed, err := strconv.ParseBool(saveToS3Param); err == nil {
			saveToS3 = parsed
		}
	}

	// Update RAG knowledge
	if err := h.llmService.UpdateRagKnowledge(knowledge, saveToS3); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": fmt.Sprintf("Failed to update RAG knowledge: %v", err),
		})
		return
	}

	response := gin.H{
		"message":     "RAG knowledge updated successfully",
		"saved_to_s3": saveToS3,
	}

	c.JSON(http.StatusOK, response)
}

// ReloadRagKnowledge godoc
// @Summary Reload RAG knowledge
// @Description Reload RAG knowledge from S3 storage or fall back to local file if S3 is unavailable. Requires admin privileges.
// @Tags rag-knowledge
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{} "Success message"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Security BearerAuth
// @Router /rag-knowledge/reload [post]
func (h *RagKnowledgeHandler) ReloadRagKnowledge(c *gin.Context) {
	if err := h.llmService.ReloadRagKnowledge(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": fmt.Sprintf("Failed to reload RAG knowledge: %v", err),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "RAG knowledge reloaded successfully",
	})
}

// BackupRagKnowledge godoc
// @Summary Create RAG knowledge backup
// @Description Create a timestamped backup of the current RAG knowledge in S3 storage. Requires S3 to be enabled and admin privileges.
// @Tags rag-knowledge
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{} "Success message"
// @Failure 500 {object} map[string]interface{} "Internal server error - S3 not enabled or backup failed"
// @Security BearerAuth
// @Router /rag-knowledge/backup [post]
func (h *RagKnowledgeHandler) BackupRagKnowledge(c *gin.Context) {
	if err := h.llmService.BackupRagKnowledge(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": fmt.Sprintf("Failed to create backup: %v", err),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "RAG knowledge backup created successfully",
	})
}

// ListRagKnowledgeBackups godoc
// @Summary List RAG knowledge backups
// @Description List all available RAG knowledge backups in S3 storage with timestamps and metadata. Requires S3 to be enabled and admin privileges.
// @Tags rag-knowledge
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{} "Object containing backups array"
// @Failure 500 {object} map[string]interface{} "Internal server error - S3 not enabled or list failed"
// @Security BearerAuth
// @Router /rag-knowledge/backups [get]
func (h *RagKnowledgeHandler) ListRagKnowledgeBackups(c *gin.Context) {
	backups, err := h.llmService.ListRagKnowledgeBackups()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": fmt.Sprintf("Failed to list backups: %v", err),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"backups": backups,
	})
}

// RestoreRagKnowledgeFromBackup godoc
// @Summary Restore RAG knowledge from backup
// @Description Restore RAG knowledge from a specific timestamped backup stored in S3. This will replace the current knowledge. Requires S3 to be enabled and admin privileges.
// @Tags rag-knowledge
// @Accept json
// @Produce json
// @Param backup_key path string true "S3 backup key (e.g., 'caa/backups/rag_knowledge_20240829_143052.json')"
// @Success 200 {object} map[string]interface{} "Success message with backup key"
// @Failure 400 {object} map[string]interface{} "Bad request - backup key required"
// @Failure 500 {object} map[string]interface{} "Internal server error - restore failed"
// @Security BearerAuth
// @Router /rag-knowledge/restore/{backup_key} [post]
func (h *RagKnowledgeHandler) RestoreRagKnowledgeFromBackup(c *gin.Context) {
	backupKey := c.Param("backup_key")
	if backupKey == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Backup key is required",
		})
		return
	}

	if err := h.llmService.RestoreRagKnowledgeFromBackup(backupKey); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": fmt.Sprintf("Failed to restore from backup: %v", err),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": fmt.Sprintf("RAG knowledge restored from backup: %s", backupKey),
	})
}

// CheckS3Health godoc
// @Summary Check S3 health
// @Description Check the health and connectivity of S3 storage service. Verifies bucket access and connectivity. Requires admin privileges.
// @Tags rag-knowledge
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{} "S3 health status with connection details"
// @Failure 500 {object} map[string]interface{} "S3 health check failed or S3 not enabled"
// @Security BearerAuth
// @Router /rag-knowledge/health [get]
func (h *RagKnowledgeHandler) CheckS3Health(c *gin.Context) {
	if err := h.llmService.CheckS3Health(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": fmt.Sprintf("S3 health check failed: %v", err),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "S3 storage is healthy",
		"status":  "ok",
	})
}
