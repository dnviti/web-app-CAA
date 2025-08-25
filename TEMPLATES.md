# LLM Template Integration

This project now supports direct LLM integration using Go text templates instead of requiring a Python backend.

## Features

- **Direct LLM Integration**: Bypass Python backend and communicate directly with LLM APIs
- **Go Text Templates**: All prompts are now stored as reusable Go templates
- **Multi-Backend Support**: Supports both Ollama and OpenAI-compatible APIs
- **Fallback Support**: Falls back to Python backend if LLM environment variables are not set
- **RAG Integration**: Automatically loads and injects RAG knowledge from `rag_knowledge.json`

## Configuration

Set these environment variables to enable direct LLM integration:

```bash
# Required: Choose your backend
BACKEND_TYPE=ollama  # or "openai"

# Required: LLM host endpoint  
LLM_HOST=http://localhost:11434  # Ollama default
# or
LLM_HOST=https://api.openai.com  # OpenAI

# Required: Model name
LLM_MODEL=llama3.1:8b  # for Ollama
# or  
LLM_MODEL=gpt-4  # for OpenAI

# Required for OpenAI backend
OPENAI_API_KEY=your_api_key_here
```

## Template Files

The following template files are located in the `prompts/` directory:

- `presente.tmpl` - Present tense conjugation
- `passato.tmpl` - Past tense (Passato Prossimo) conjugation  
- `futuro.tmpl` - Future tense conjugation
- `correct_sentence.tmpl` - Sentence correction

## Template Variables

Each template receives different variables based on its purpose:

### Common Variables
- `{{.Sentence}}` - The input sentence
- `{{.BaseFormsJSON}}` - JSON array of base verb forms

### Present Tense Template
- `{{.RagKnowledge}}` - Formatted RAG knowledge for present tense rules

### Past Tense Template
- `{{.RegularParticiples}}` - Regular participle formation rules
- `{{.IrregularParticiples.VERB}}` - Access irregular participles (e.g., `{{.IrregularParticiples.essere}}`)
- `{{.AuxiliaryChoice.essere.rule}}` - Rules for auxiliary verb choice

### Future Tense Template
- `{{.IrregularRoots.VERB}}` - Access irregular future roots (e.g., `{{.IrregularRoots.andare}}`)
- `{{.Endings}}` - Future tense endings

## How It Works

1. **Template Selection**: Based on the `tense` parameter, the appropriate template is selected
2. **Data Preparation**: RAG knowledge is loaded and formatted according to the tense
3. **Template Rendering**: Variables are injected into the template to create the final prompt
4. **LLM Request**: The rendered prompt is sent to the configured LLM backend
5. **Response Processing**: JSON response is parsed and returned

## API Endpoints

The existing API endpoints remain unchanged:

- `POST /conjugate` - Conjugate verbs
- `POST /correct` - Correct sentences

## Fallback Behavior

If `LLM_MODEL` environment variable is not set, the system automatically falls back to the Python backend at `BACKEND_BASE_URL`.

## Example Usage

```bash
# Enable direct LLM integration
export BACKEND_TYPE=ollama
export LLM_HOST=http://localhost:11434
export LLM_MODEL=llama3.1:8b

# Start the service
go run main.go

# Make a conjugation request
curl -X POST http://localhost:3000/conjugate \
  -H "Content-Type: application/json" \
  -d '{
    "sentence": "Io",
    "base_forms": ["andare", "mangiare"],
    "tense": "presente"
  }'
```

## Benefits

- **Reduced Dependencies**: No need for Python backend when using direct LLM integration
- **Better Performance**: Direct API calls without additional HTTP proxy layer
- **Easier Maintenance**: All prompts are in Go templates, easier to version and modify
- **Consistent Formatting**: Templates ensure consistent prompt structure
- **Type Safety**: Go's type system helps prevent runtime errors
