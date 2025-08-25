package handlers

import (
	"html/template"
	"net/http"
	"path/filepath"

	"github.com/gin-gonic/gin"
)

type PageHandlers struct {
	templates *template.Template
}

type PageData struct {
	Title       string
	Username    string
	Error       string
	Success     string
	FormData    interface{}
	GridOptions []GridOption
}

type GridOption struct {
	Type         string
	Name         string
	Description  string
	PreviewImage string
}

func NewPageHandlers() *PageHandlers {
	templates := template.Must(template.ParseGlob(filepath.Join("web", "templates", "*.tmpl")))

	return &PageHandlers{
		templates: templates,
	}
}

// ServeIndex renders the main index page
func (h *PageHandlers) ServeIndex(c *gin.Context) {
	data := PageData{
		Title:    "AAC Communicator",
		Username: "", // This could be populated from session/JWT
	}

	c.Header("Content-Type", "text/html")
	if err := h.templates.ExecuteTemplate(c.Writer, "index.tmpl", data); err != nil {
		c.String(http.StatusInternalServerError, "Template error: %v", err)
		return
	}
}

// ServeLogin renders the login page
func (h *PageHandlers) ServeLogin(c *gin.Context) {
	data := PageData{
		Title:    "Login",
		FormData: map[string]string{},
	}

	c.Header("Content-Type", "text/html")
	if err := h.templates.ExecuteTemplate(c.Writer, "login.tmpl", data); err != nil {
		c.String(http.StatusInternalServerError, "Template error: %v", err)
		return
	}
}

// ServeRegister renders the registration page
func (h *PageHandlers) ServeRegister(c *gin.Context) {
	data := PageData{
		Title:    "Registrazione",
		FormData: map[string]string{},
	}

	c.Header("Content-Type", "text/html")
	if err := h.templates.ExecuteTemplate(c.Writer, "register.tmpl", data); err != nil {
		c.String(http.StatusInternalServerError, "Template error: %v", err)
		return
	}
}

// ServeSetup renders the setup page
func (h *PageHandlers) ServeSetup(c *gin.Context) {
	// Example grid options - these could be loaded from config or database
	gridOptions := []GridOption{
		{
			Type:        "default",
			Name:        "Griglia Completa",
			Description: "Griglia con tutte le categorie predefinite",
		},
		{
			Type:        "simplified",
			Name:        "Griglia Semplificata",
			Description: "Griglia con categorie essenziali",
		},
		{
			Type:        "empty",
			Name:        "Griglia Vuota",
			Description: "Inizia da zero con una griglia personalizzata",
		},
	}

	data := PageData{
		Title:       "Configurazione",
		GridOptions: gridOptions,
	}

	c.Header("Content-Type", "text/html")
	if err := h.templates.ExecuteTemplate(c.Writer, "setup.tmpl", data); err != nil {
		c.String(http.StatusInternalServerError, "Template error: %v", err)
		return
	}
}
