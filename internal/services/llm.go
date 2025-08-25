package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"html/template"
	"log"
	"os"
	"path/filepath"
	"strings"

	"github.com/daniele/web-app-caa/internal/models"
	"github.com/daniele/web-app-caa/pkg/ollama"

	"github.com/openai/openai-go/v2"
	"github.com/openai/openai-go/v2/option"
	"github.com/openai/openai-go/v2/shared"
)

// LLMService handles direct LLM operations using Go templates
type LLMService struct {
	backendType  string
	llmHost      string
	openaiKey    string
	llmModel     string
	ollamaClient ollama.Client  // For Ollama requests
	openaiClient *openai.Client // For OpenAI requests
	ragData      map[string]interface{}
	templates    map[string]*template.Template
}

// TemplateData represents the data structure for template rendering
type TemplateData struct {
	// Common fields
	Sentence      string   `json:"sentence"`
	BaseForms     []string `json:"base_forms"`
	BaseFormsJSON string   `json:"base_forms_json"` // JSON-formatted string for templates

	// RAG knowledge fields
	RagKnowledge string `json:"rag_knowledge"`

	// Passato-specific fields
	RegularParticiples   string                 `json:"regular_participles"`
	IrregularParticiples map[string]interface{} `json:"irregular_participles"`
	AuxiliaryChoice      map[string]interface{} `json:"auxiliary_choice"`

	// Futuro-specific fields
	IrregularRoots map[string]interface{} `json:"irregular_roots"`
	Endings        string                 `json:"endings"`
}

// NewLLMService creates a new LLMService with templates and RAG data
func NewLLMService() *LLMService {
	backendType := os.Getenv("BACKEND_TYPE")
	if backendType == "" {
		backendType = "ollama"
	}

	llmHost := os.Getenv("LLM_HOST")
	if llmHost == "" {
		llmHost = "http://localhost:11434"
	}

	openaiKey := os.Getenv("OPENAI_API_KEY")
	llmModel := os.Getenv("LLM_MODEL")

	service := &LLMService{
		backendType: backendType,
		llmHost:     llmHost,
		openaiKey:   openaiKey,
		llmModel:    llmModel,
		templates:   make(map[string]*template.Template),
	}

	// Initialize Ollama client if using Ollama backend
	if backendType == "ollama" {
		service.ollamaClient = ollama.NewClient(llmHost)
	}

	// Initialize OpenAI client if using OpenAI backend
	if backendType == "openai" && openaiKey != "" {
		var opts []option.RequestOption
		opts = append(opts, option.WithAPIKey(openaiKey))

		// If using a custom host (not official OpenAI), set base URL
		if llmHost != "" && llmHost != "https://api.openai.com" {
			opts = append(opts, option.WithBaseURL(llmHost))
		}

		client := openai.NewClient(opts...)
		service.openaiClient = &client
	}

	// Load RAG knowledge
	if err := service.loadRagData(); err != nil {
		log.Printf("Error loading RAG data: %v", err)
	}

	// Load templates
	if err := service.loadTemplates(); err != nil {
		log.Printf("Error loading templates: %v", err)
	}

	log.Printf("LLMService initialized - Backend: %s, Host: %s, Model: %s",
		backendType, llmHost, llmModel)

	return service
}

// loadRagData loads the RAG knowledge from JSON file
func (s *LLMService) loadRagData() error {
	file, err := os.Open("rag_knowledge.json")
	if err != nil {
		return fmt.Errorf("error opening rag_knowledge.json: %w", err)
	}
	defer file.Close()

	decoder := json.NewDecoder(file)
	if err := decoder.Decode(&s.ragData); err != nil {
		return fmt.Errorf("error decoding RAG data: %w", err)
	}

	log.Printf("RAG knowledge loaded successfully")
	return nil
}

// loadTemplates loads all the prompt templates
func (s *LLMService) loadTemplates() error {
	templateDir := "internal/prompts"
	templateFiles := []string{"presente.tmpl", "passato.tmpl", "futuro.tmpl", "correct_sentence.tmpl"}

	for _, filename := range templateFiles {
		filePath := filepath.Join(templateDir, filename)
		tmpl, err := template.ParseFiles(filePath)
		if err != nil {
			return fmt.Errorf("error parsing template %s: %w", filename, err)
		}

		// Remove .tmpl extension for the key
		key := strings.TrimSuffix(filename, ".tmpl")
		s.templates[key] = tmpl
	}

	log.Printf("Templates loaded successfully: %v", templateFiles)
	return nil
}

// formatRagKnowledge formats the RAG JSON data for presente tense
func (s *LLMService) formatRagKnowledge() string {
	if s.ragData == nil {
		return ""
	}

	presenteData, ok := s.ragData["presente_indicativo"].(map[string]interface{})
	if !ok {
		return ""
	}

	var knowledge strings.Builder
	knowledge.WriteString("**Regole Generali di Coniugazione Regolare:**\n")

	// Get general rules
	if generalRules, ok := presenteData["general_rules"].(map[string]interface{}); ok {
		for rule, details := range generalRules {
			if detailsMap, ok := details.(map[string]interface{}); ok {
				if conjugation, ok := detailsMap["conjugation"].(string); ok {
					knowledge.WriteString(fmt.Sprintf("- %s: %s\n", rule, conjugation))
				}
			}
		}
	}

	knowledge.WriteString("\n**Verbi Irregolari Comuni (Esempi Chiave):**\n")

	// Get irregular verbs
	if irregularVerbs, ok := presenteData["irregular_verbs"].(map[string]interface{}); ok {
		for verb, details := range irregularVerbs {
			if detailsMap, ok := details.(map[string]interface{}); ok {
				if conjugation, ok := detailsMap["conjugation"].(string); ok {
					knowledge.WriteString(fmt.Sprintf("- **%s**: %s\n", verb, conjugation))
				}
			}
		}
	}

	return knowledge.String()
}

// renderTemplate renders a template with the given data
func (s *LLMService) renderTemplate(templateName string, data TemplateData) (string, error) {
	tmpl, exists := s.templates[templateName]
	if !exists {
		return "", fmt.Errorf("template %s not found", templateName)
	}

	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, data); err != nil {
		return "", fmt.Errorf("error executing template: %w", err)
	}

	return buf.String(), nil
}

// prepareTemplateData prepares the template data based on tense
func (s *LLMService) prepareTemplateData(sentence string, baseForms []string, tense string) TemplateData {
	// Convert BaseForms to JSON string for template use
	baseFormsJSON, _ := json.Marshal(baseForms)

	data := TemplateData{
		Sentence:      sentence,
		BaseForms:     baseForms,
		BaseFormsJSON: string(baseFormsJSON),
	}

	if s.ragData == nil {
		return data
	}

	switch tense {
	case "presente":
		data.RagKnowledge = s.formatRagKnowledge()

	case "passato":
		if passatoData, ok := s.ragData["passato_prossimo"].(map[string]interface{}); ok {
			if regularParticiples, ok := passatoData["regular_participles"].(string); ok {
				data.RegularParticiples = regularParticiples
			}
			if irregularParticiples, ok := passatoData["irregular_participles"].(map[string]interface{}); ok {
				data.IrregularParticiples = irregularParticiples
			}
			if auxiliaryChoice, ok := passatoData["auxiliary_choice"].(map[string]interface{}); ok {
				data.AuxiliaryChoice = auxiliaryChoice
			}
		}

	case "futuro":
		if futuroData, ok := s.ragData["futuro_semplice"].(map[string]interface{}); ok {
			if irregularRoots, ok := futuroData["irregular_roots"].(map[string]interface{}); ok {
				data.IrregularRoots = irregularRoots
			}
			if endings, ok := futuroData["endings"].(string); ok {
				data.Endings = endings
			}
		}
	}

	return data
}

// llmResponse sends a prompt to the LLM and gets the response
func (s *LLMService) llmResponse(prompt string) (string, error) {
	switch s.backendType {
	case "ollama":
		return s.ollamaRequest(prompt)
	case "openai":
		return s.openaiRequest(prompt)
	}

	return "", fmt.Errorf("unknown backend type: %s", s.backendType)
}

// ollamaRequest makes a request to Ollama using the dedicated client
func (s *LLMService) ollamaRequest(prompt string) (string, error) {
	if s.ollamaClient == nil {
		return "", fmt.Errorf("ollama client not initialized")
	}

	// Use the client's SimpleChat method for basic interactions
	response, err := s.ollamaClient.SimpleChat(s.llmModel, prompt)
	if err != nil {
		return "", fmt.Errorf("ollama request failed: %w", err)
	}

	return response, nil
}

// openaiRequest makes a request to OpenAI API using the official client
func (s *LLMService) openaiRequest(prompt string) (string, error) {
	if s.openaiClient == nil {
		return "", fmt.Errorf("OpenAI client not initialized")
	}

	// Create JSON object response format
	jsonObjectFormat := &shared.ResponseFormatJSONObjectParam{
		Type: "json_object",
	}

	chatCompletion, err := s.openaiClient.Chat.Completions.New(context.TODO(), openai.ChatCompletionNewParams{
		Messages: []openai.ChatCompletionMessageParamUnion{
			openai.UserMessage(prompt),
		},
		Model: shared.ChatModel(s.llmModel),
		ResponseFormat: openai.ChatCompletionNewParamsResponseFormatUnion{
			OfJSONObject: jsonObjectFormat,
		},
	})
	if err != nil {
		return "", fmt.Errorf("error making openai request: %w", err)
	}

	if len(chatCompletion.Choices) == 0 {
		return "", fmt.Errorf("no choices in openai response")
	}

	content := chatCompletion.Choices[0].Message.Content
	if content == "" {
		return "", fmt.Errorf("empty content in openai response")
	}

	return content, nil
}

// ConjugateWithTemplates performs conjugation using the Go templates
func (s *LLMService) ConjugateWithTemplates(req models.ConjugateRequest) (map[string]interface{}, error) {
	log.Printf("Conjugation request - Sentence: '%s', Base forms: %v, Tense: %s",
		req.Sentence, req.BaseForms, req.Tense)

	// Determine template name
	templateName := "presente" // default
	switch req.Tense {
	case "passato":
		templateName = "passato"
	case "futuro":
		templateName = "futuro"
	}

	// Prepare template data
	data := s.prepareTemplateData(req.Sentence, req.BaseForms, req.Tense)

	// Render template
	prompt, err := s.renderTemplate(templateName, data)
	if err != nil {
		log.Printf("Error rendering template: %v", err)
		return nil, fmt.Errorf("error rendering template: %w", err)
	}

	log.Printf("Generated prompt for %s tense", req.Tense)

	// Get LLM response
	response, err := s.llmResponse(prompt)
	if err != nil {
		log.Printf("Error getting LLM response: %v", err)
		// Return fallback result
		fallback := make(map[string]interface{})
		for _, verb := range req.BaseForms {
			fallback[verb] = verb
		}
		return fallback, nil
	}

	// Parse JSON response
	var conjugations map[string]interface{}
	if err := json.Unmarshal([]byte(response), &conjugations); err != nil {
		log.Printf("Error parsing LLM response: %v", err)
		// Return fallback result
		fallback := make(map[string]interface{})
		for _, verb := range req.BaseForms {
			fallback[verb] = verb
		}
		return fallback, nil
	}

	log.Printf("Successfully conjugated verbs: %v", conjugations)
	return conjugations, nil
}

// CorrectWithTemplate performs sentence correction using the Go template
func (s *LLMService) CorrectWithTemplate(req models.CorrectRequest) (map[string]interface{}, error) {
	log.Printf("Correction request - Sentence: '%s'", req.Sentence)

	// Prepare template data
	data := TemplateData{
		Sentence: req.Sentence,
	}

	// Render template
	prompt, err := s.renderTemplate("correct_sentence", data)
	if err != nil {
		log.Printf("Error rendering correction template: %v", err)
		return nil, fmt.Errorf("error rendering template: %w", err)
	}

	log.Printf("Generated correction prompt")

	// Get LLM response
	response, err := s.llmResponse(prompt)
	if err != nil {
		log.Printf("Error getting LLM correction response: %v", err)
		return map[string]interface{}{
			"corrected_sentence": req.Sentence,
		}, nil
	}

	// For correction, the response should be just the corrected sentence
	correctedSentence := strings.TrimSpace(response)
	// Remove any quotes if present
	correctedSentence = strings.Trim(correctedSentence, "\"")

	log.Printf("Successfully corrected sentence: '%s' -> '%s'", req.Sentence, correctedSentence)

	return map[string]interface{}{
		"corrected_sentence": correctedSentence,
	}, nil
}
