package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"sync"
	"time"

	"github.com/daniele/web-app-caa/internal/auth"
	"github.com/daniele/web-app-caa/internal/utils"

	"github.com/gin-gonic/gin"
)

// ArasaacCacheEntry represents cached icon metadata
type ArasaacCacheEntry struct {
	Timestamp time.Time `json:"timestamp"`
	MimeType  string    `json:"mime_type"`
	FileSize  int64     `json:"file_size"`
}

// ArasaacHandlers handles ARASAAC icon search and caching
type ArasaacHandlers struct {
	cacheDir   string
	cacheMutex sync.RWMutex
	httpClient *http.Client
}

// NewArasaacHandlers creates a new ArasaacHandlers instance
func NewArasaacHandlers() *ArasaacHandlers {
	cacheDir := "cache"

	// Create cache directory if it doesn't exist
	if err := os.MkdirAll(cacheDir, 0755); err != nil {
		log.Printf("[ARASAAC-CACHE] Warning: Failed to create cache directory: %v", err)
	}

	return &ArasaacHandlers{
		cacheDir:   cacheDir,
		cacheMutex: sync.RWMutex{},
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// getCachedIconFromFile retrieves an icon from the file cache
func (h *ArasaacHandlers) getCachedIconFromFile(iconID string) ([]byte, string, bool) {
	h.cacheMutex.RLock()
	defer h.cacheMutex.RUnlock()

	metadataPath := filepath.Join(h.cacheDir, iconID+".meta")

	// Try to read metadata first to get the correct file extension
	var mimeType string = "image/png" // Default fallback
	var cachePath string

	if metaData, err := os.ReadFile(metadataPath); err == nil {
		var metadata ArasaacCacheEntry
		if err := json.Unmarshal(metaData, &metadata); err == nil {
			mimeType = metadata.MimeType
			// Get proper file extension based on stored mime type
			ext := utils.GetFileExtensionFromMimeType(mimeType, ".png")
			cachePath = filepath.Join(h.cacheDir, iconID+ext+".cache")
		} else {
			// Fallback to old naming scheme
			cachePath = filepath.Join(h.cacheDir, iconID+".cache")
		}
	} else {
		// Fallback to old naming scheme
		cachePath = filepath.Join(h.cacheDir, iconID+".cache")
	}

	// Check if cache file exists and is not too old (24 hours)
	if info, err := os.Stat(cachePath); err == nil {
		if time.Since(info.ModTime()) < 24*time.Hour {
			// Read the cached file
			data, err := os.ReadFile(cachePath)
			if err == nil {
				return data, mimeType, true
			}
		}
	}

	return nil, "", false
}

// setCachedIconToFile stores an icon in the file cache
func (h *ArasaacHandlers) setCachedIconToFile(iconID string, data []byte, mimeType string) {
	h.cacheMutex.Lock()
	defer h.cacheMutex.Unlock()

	// Get proper file extension based on mime type
	ext := utils.GetFileExtensionFromMimeType(mimeType, ".png")
	cachePath := filepath.Join(h.cacheDir, iconID+ext+".cache")
	metadataPath := filepath.Join(h.cacheDir, iconID+".meta")

	// Write the data to file
	if err := os.WriteFile(cachePath, data, 0644); err != nil {
		log.Printf("[ARASAAC-CACHE] Failed to cache icon %s: %v", iconID, err)
		return
	}

	// Create and store metadata
	metadata := ArasaacCacheEntry{
		Timestamp: time.Now(),
		MimeType:  mimeType,
		FileSize:  int64(len(data)),
	}

	if metadataBytes, err := json.Marshal(metadata); err == nil {
		if err := os.WriteFile(metadataPath, metadataBytes, 0644); err != nil {
			log.Printf("[ARASAAC-CACHE] Failed to cache metadata for icon %s: %v", iconID, err)
		}
	} else {
		log.Printf("[ARASAAC-CACHE] Failed to marshal metadata for icon %s: %v", iconID, err)
	}
}

// getCachedIcon retrieves an icon from file cache if available and valid
func (h *ArasaacHandlers) getCachedIcon(iconID string) ([]byte, string, bool) {
	return h.getCachedIconFromFile(iconID)
}

// setCachedIcon stores an icon in file cache
func (h *ArasaacHandlers) setCachedIcon(iconID string, data []byte, mimeType string) {
	h.setCachedIconToFile(iconID, data, mimeType)
}

// cleanExpiredCache removes expired entries from file cache
func (h *ArasaacHandlers) cleanExpiredCache() {
	h.cacheMutex.Lock()
	defer h.cacheMutex.Unlock()

	// Read cache directory and check for expired files
	files, err := os.ReadDir(h.cacheDir)
	if err != nil {
		log.Printf("[ARASAAC-CACHE] Failed to read cache directory: %v", err)
		return
	}

	for _, file := range files {
		if !file.IsDir() {
			fileName := file.Name()
			filePath := filepath.Join(h.cacheDir, fileName)

			// Check for both .cache and .meta files
			if filepath.Ext(fileName) == ".cache" || filepath.Ext(fileName) == ".meta" {
				if info, err := os.Stat(filePath); err == nil {
					if time.Since(info.ModTime()) >= 24*time.Hour {
						if err := os.Remove(filePath); err != nil {
							log.Printf("[ARASAAC-CACHE] Failed to remove expired cache file %s: %v", fileName, err)
						} else {
							log.Printf("[ARASAAC-CACHE] Removed expired cache file: %s", fileName)
						}
					}
				}
			}
		}
	}
}

// fetchIconFromAPI fetches an icon from the ARASAAC API
func (h *ArasaacHandlers) fetchIconFromAPI(ctx context.Context, iconID string) ([]byte, string, error) {
	arasaacURL := fmt.Sprintf("https://api.arasaac.org/api/pictograms/%s", iconID)

	req, err := http.NewRequestWithContext(ctx, "GET", arasaacURL, nil)
	if err != nil {
		return nil, "", err
	}

	resp, err := h.httpClient.Do(req)
	if err != nil {
		return nil, "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, "", fmt.Errorf("ARASAAC API returned status: %d", resp.StatusCode)
	}

	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, "", err
	}

	mimeType := resp.Header.Get("Content-Type")
	if mimeType == "" {
		mimeType = "image/png" // Default mime type for ARASAAC icons
	}

	return data, mimeType, nil
}

// SearchArasaac handles ARASAAC icon search requests with optional parallel icon preloading
// @Summary Search ARASAAC icons
// @Description Search for ARASAAC icons by keyword with optional parallel preloading
// @Tags ARASAAC
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param query query string true "Search query"
// @Param preload query boolean false "Whether to preload icon data in parallel"
// @Param limit query integer false "Limit number of icons for preloading (max 20)"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /arasaac/search [get]
func (h *ArasaacHandlers) SearchArasaac(c *gin.Context) {
	userID := auth.GetUserID(c)
	if userID == "" {
		log.Printf("[ERROR] Error getting user ID from context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authentication"})
		return
	}

	query := c.Query("query")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Query parameter is required"})
		return
	}

	// Parse optional preloading parameters
	preload := c.Query("preload") == "true"
	limitStr := c.Query("limit")
	limit := 10 // Default limit for preloading
	if limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 && parsedLimit <= 20 {
			limit = parsedLimit
		}
	}

	log.Printf("[ARASAAC-SEARCH] Search request from userId: %s, query: '%s', preload: %t, limit: %d", userID, query, preload, limit)

	// Call ARASAAC API directly with Italian language parameter
	arasaacURL := fmt.Sprintf("https://api.arasaac.org/api/pictograms/it/search/%s", url.QueryEscape(query))

	resp, err := h.httpClient.Get(arasaacURL)
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

	// Use a generic interface to avoid type issues
	var icons []interface{}
	if err := json.NewDecoder(resp.Body).Decode(&icons); err != nil {
		log.Printf("[ARASAAC-SEARCH] Error decoding ARASAAC response: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode response"})
		return
	}

	log.Printf("[ARASAAC-SEARCH] Found %d icons for query '%s'", len(icons), query)

	// If preloading is requested and we have icons, preload them in parallel
	if preload && len(icons) > 0 {
		go h.preloadIcons(icons, limit, query)
	}

	// Clean expired cache entries periodically (every 10th search)
	// For file-based cache, we can run cleanup less frequently
	if len(icons)%10 == 0 {
		go h.cleanExpiredCache()
	}

	c.JSON(http.StatusOK, gin.H{
		"icons":     icons,
		"preloaded": preload,
		"total":     len(icons),
	})
}

// preloadIcons preloads icon data in parallel to warm up the cache
func (h *ArasaacHandlers) preloadIcons(icons []interface{}, limit int, query string) {
	start := time.Now()
	log.Printf("[ARASAAC-PRELOAD] Starting parallel preload for query '%s' with limit %d", query, limit)

	// Limit the number of icons to preload
	iconsToPreload := icons
	if len(icons) > limit {
		iconsToPreload = icons[:limit]
	}

	// Create a context with timeout for the entire preload operation
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Use a semaphore to limit concurrent requests
	semaphore := make(chan struct{}, 5) // Max 5 concurrent requests
	var wg sync.WaitGroup
	preloadedCount := 0
	var countMutex sync.Mutex

	for i, iconInterface := range iconsToPreload {
		// Extract icon ID from the icon data structure
		if iconMap, ok := iconInterface.(map[string]interface{}); ok {
			if idFloat, exists := iconMap["_id"]; exists {
				if idNum, ok := idFloat.(float64); ok {
					iconID := strconv.Itoa(int(idNum))

					// Check if already cached
					if _, _, found := h.getCachedIcon(iconID); found {
						continue
					}

					wg.Add(1)
					go func(id string, index int) {
						defer wg.Done()

						// Acquire semaphore
						semaphore <- struct{}{}
						defer func() { <-semaphore }()

						// Preload with context
						if data, mimeType, err := h.fetchIconFromAPI(ctx, id); err == nil {
							h.setCachedIcon(id, data, mimeType)
							countMutex.Lock()
							preloadedCount++
							countMutex.Unlock()
						} else {
							log.Printf("[ARASAAC-PRELOAD] Failed to preload icon %s: %v", id, err)
						}
					}(iconID, i)
				}
			}
		}
	}

	wg.Wait()
	duration := time.Since(start)
	log.Printf("[ARASAAC-PRELOAD] Completed preloading %d/%d icons for query '%s' in %v", preloadedCount, len(iconsToPreload), query, duration)
}

// GetIcon serves ARASAAC icons from cache or fetches from API
// @Summary Get ARASAAC icon by ID
// @Description Retrieve an ARASAAC icon by its ID, with file-based caching (public endpoint)
// @Tags ARASAAC
// @Produce image/png
// @Param id path string true "Icon ID"
// @Success 200 {file} binary "Icon image"
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /arasaac/icon/{id} [get]
func (h *ArasaacHandlers) GetIcon(c *gin.Context) {
	iconID := c.Param("id")
	if iconID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Icon ID is required"})
		return
	}

	log.Printf("[ARASAAC-ICON] Icon request for iconID: %s", iconID)

	// Try to get from cache first
	if data, mimeType, found := h.getCachedIcon(iconID); found {
		log.Printf("[ARASAAC-ICON] Serving cached icon %s (%d bytes)", iconID, len(data))
		c.Header("Content-Type", mimeType)
		c.Header("Cache-Control", "public, max-age=86400") // Cache for 24 hours
		c.Data(http.StatusOK, mimeType, data)
		return
	}

	// If not in cache, fetch from API
	log.Printf("[ARASAAC-ICON] Icon %s not in cache, fetching from API", iconID)

	data, mimeType, err := h.fetchIconFromAPI(c.Request.Context(), iconID)
	if err != nil {
		log.Printf("[ARASAAC-ICON] Error fetching icon %s: %v", iconID, err)
		c.JSON(http.StatusNotFound, gin.H{"error": "Icon not found"})
		return
	}

	// Cache the icon
	h.setCachedIcon(iconID, data, mimeType)

	log.Printf("[ARASAAC-ICON] Successfully fetched and cached icon %s (%d bytes)", iconID, len(data))
	c.Header("Content-Type", mimeType)
	c.Header("Cache-Control", "public, max-age=86400") // Cache for 24 hours
	c.Data(http.StatusOK, mimeType, data)
}
