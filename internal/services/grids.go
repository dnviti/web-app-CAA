package services

import (
	"fmt"

	"github.com/daniele/web-app-caa/internal/config"
	"github.com/daniele/web-app-caa/internal/models"
	"github.com/google/uuid"
)

// GetDefaultGrid returns the default grid structure for new users using configuration
func GetDefaultGrid(cfg *config.Config) map[string][]models.GridItemResponse {
	arasaacURL := func(id string) string {
		return fmt.Sprintf("%s/%s", cfg.APIs.ArasaacBaseURL, id)
	}

	// Generate UUIDs for categories and items
	catEmoID := uuid.New().String()
	catActID := uuid.New().String()
	catFoodID := uuid.New().String()
	catFamID := uuid.New().String()
	catSubjID := uuid.New().String()

	// Generate target UUIDs for categories
	emotionsTarget := uuid.New().String()
	actionsTarget := uuid.New().String()
	foodTarget := uuid.New().String()
	familyTarget := uuid.New().String()
	subjectTarget := uuid.New().String()

	return map[string][]models.GridItemResponse{
		"home": {
			{ID: catEmoID, Type: "category", Icon: arasaacURL("39091"), Label: "Emozioni", Target: emotionsTarget, Color: "#FFADAD", IsVisible: true},
			{ID: catActID, Type: "category", Icon: arasaacURL("7297"), Label: "Azioni", Target: actionsTarget, Color: "#FFD6A5", IsVisible: true},
			{ID: catFoodID, Type: "category", Icon: arasaacURL("4610"), Label: "Cibo", Target: foodTarget, Color: "#CAFFBF", IsVisible: true},
			{ID: catFamID, Type: "category", Icon: arasaacURL("38351"), Label: "Famiglia", Target: familyTarget, Color: "#9BF6FF", IsVisible: true},
			{ID: catSubjID, Type: "category", Icon: arasaacURL("6632"), Label: "Soggetti", Target: subjectTarget, Color: "#A0C4FF", IsVisible: true},
		},
		subjectTarget: {
			{ID: uuid.New().String(), Type: "symbol", Icon: arasaacURL("6632"), Label: "Io", Text: "io", Speak: "io", SymbolType: "nome", Color: "#A0C4FF", IsVisible: true},
			{ID: uuid.New().String(), Type: "symbol", Icon: arasaacURL("6625"), Label: "Tu", Text: "tu", Speak: "tu", SymbolType: "nome", Color: "#BDB2FF", IsVisible: true},
			{ID: uuid.New().String(), Type: "symbol", Icon: arasaacURL("6480"), Label: "Lui", Text: "lui", Speak: "lui", SymbolType: "nome", Color: "#A0C4FF", IsVisible: true},
			{ID: uuid.New().String(), Type: "symbol", Icon: arasaacURL("7028"), Label: "Lei", Text: "lei", Speak: "lei", SymbolType: "nome", Color: "#A0C4FF", IsVisible: true},
			{ID: uuid.New().String(), Type: "symbol", Icon: arasaacURL("7186"), Label: "Noi", Text: "noi", Speak: "noi", SymbolType: "nome", Color: "#A0C4FF", IsVisible: true},
			{ID: uuid.New().String(), Type: "symbol", Icon: arasaacURL("7305"), Label: "Voi", Text: "voi", Speak: "voi", SymbolType: "nome", Color: "#A0C4FF", IsVisible: true},
			{ID: uuid.New().String(), Type: "symbol", Icon: arasaacURL("7033"), Label: "Loro", Text: "loro", Speak: "loro", SymbolType: "nome", Color: "#A0C4FF", IsVisible: true},
		},
		emotionsTarget: {
			{ID: uuid.New().String(), Type: "symbol", Icon: arasaacURL("35547"), Label: "Felice", Text: "felice", SymbolType: "altro", Speak: "felice", Color: "#FFADAD", IsVisible: true},
			{ID: uuid.New().String(), Type: "symbol", Icon: arasaacURL("35545"), Label: "Triste", Text: "triste", SymbolType: "altro", Speak: "triste", Color: "#A0C4FF", IsVisible: true},
		},
		actionsTarget: {
			{ID: uuid.New().String(), Type: "symbol", Icon: arasaacURL("29951"), Label: "Camminare", Text: "camminare", SymbolType: "verbo", Speak: "camminare", Color: "#CAFFBF", IsVisible: true},
			{ID: uuid.New().String(), Type: "symbol", Icon: arasaacURL("5441"), Label: "Volere", Text: "volere", SymbolType: "verbo", Speak: "volere", Color: "#FFC6FF", IsVisible: true},
			{ID: uuid.New().String(), Type: "symbol", Icon: arasaacURL("32648"), Label: "Aiutare", Text: "aiutare", SymbolType: "verbo", Speak: "aiutare", Color: "#FDFFB6", IsVisible: true},
			{ID: uuid.New().String(), Type: "symbol", Icon: arasaacURL("7141"), Label: "Leggere", Text: "leggere", SymbolType: "verbo", Speak: "leggere", Color: "#FDFFB6", IsVisible: true},
			{ID: uuid.New().String(), Type: "symbol", Icon: arasaacURL("36480"), Label: "Essere", Text: "essere", SymbolType: "verbo", Speak: "essere", Color: "#FDFFB6", IsVisible: true},
			{ID: uuid.New().String(), Type: "symbol", Icon: arasaacURL("32761"), Label: "Avere", Text: "avere", SymbolType: "verbo", Speak: "avere", Color: "#FDFFB6", IsVisible: true},
			{ID: uuid.New().String(), Type: "symbol", Icon: arasaacURL("6456"), Label: "Mangiare", Text: "mangiare", SymbolType: "verbo", Speak: "mangiare", Color: "#FDFFB6", IsVisible: true},
		},
		"food": {
			{ID: uuid.New().String(), Type: "symbol", Icon: arasaacURL("2527"), Label: "Pizza", Text: "pizza", SymbolType: "nome", Speak: "pizza", Color: "#FFADAD", IsVisible: true},
		},
		"family": {
			{ID: uuid.New().String(), Type: "symbol", Icon: arasaacURL("2458"), Label: "Mamma", Text: "mamma", SymbolType: "nome", Speak: "mamma", Color: "#9BF6FF", IsVisible: true},
		},
		"systemControls": {
			{ID: uuid.New().String(), Type: "system", Action: "deleteLastWord", Icon: arasaacURL("38200"), Label: "Cancella ultimo", Color: "#be626aff", IsVisible: true, IsHideable: true},
			{ID: uuid.New().String(), Type: "system", Action: "deleteAllText", Icon: arasaacURL("38201"), Label: "Cancella tutto", Color: "#be626aff", IsVisible: true, IsHideable: true},
			{ID: uuid.New().String(), Type: "system", Action: "speakText", Icon: arasaacURL("38216"), Label: "Leggi", Color: "#75d1a8ff", IsVisible: true, IsHideable: true},
			{ID: uuid.New().String(), Type: "system", Action: "setTense", Text: "passato", Icon: arasaacURL("9839"), Label: "Passato", Color: "#bb9bffff", IsVisible: true, IsHideable: false},
			{ID: uuid.New().String(), Type: "system", Action: "setTense", Text: "presente", Icon: arasaacURL("38276"), Label: "Presente", Color: "#A0C4FF", IsVisible: true, IsHideable: false},
			{ID: uuid.New().String(), Type: "system", Action: "setTense", Text: "futuro", Icon: arasaacURL("9829"), Label: "Futuro", Color: "#ffb2bfff", IsVisible: true, IsHideable: false},
		},
	}
}

// GetSimplifiedGrid returns the simplified grid structure using configuration
func GetSimplifiedGrid(cfg *config.Config) map[string][]models.GridItemResponse {
	arasaacURL := func(id string) string {
		return fmt.Sprintf("%s/%s", cfg.APIs.ArasaacBaseURL, id)
	}

	return map[string][]models.GridItemResponse{
		"home": {
			{ID: uuid.New().String(), Type: "category", Icon: arasaacURL("6632"), Label: "Soggetti", Target: "subject", Color: "#A0C4FF", IsVisible: true},
			{ID: uuid.New().String(), Type: "category", Icon: arasaacURL("7297"), Label: "Azioni", Target: "actions", Color: "#FFD6A5", IsVisible: true},
		},
		"subject": {
			{ID: uuid.New().String(), Type: "symbol", Icon: arasaacURL("6632"), Label: "Io", Text: "io", Speak: "io", SymbolType: "nome", Color: "#A0C4FF", IsVisible: true},
			{ID: uuid.New().String(), Type: "symbol", Icon: arasaacURL("6625"), Label: "Tu", Text: "tu", Speak: "tu", SymbolType: "nome", Color: "#BDB2FF", IsVisible: true},
		},
		"actions": {
			{ID: uuid.New().String(), Type: "symbol", Icon: arasaacURL("36480"), Label: "Essere", Text: "essere", SymbolType: "verbo", Speak: "essere", Color: "#FDFFB6", IsVisible: true},
			{ID: uuid.New().String(), Type: "symbol", Icon: arasaacURL("6456"), Label: "Mangiare", Text: "mangiare", SymbolType: "verbo", Speak: "mangiare", Color: "#FDFFB6", IsVisible: true},
		},
		"systemControls": {
			{ID: uuid.New().String(), Type: "system", Action: "deleteLastWord", Icon: arasaacURL("38200"), Label: "Cancella ultimo", Color: "#be626aff", IsVisible: true, IsHideable: true},
			{ID: uuid.New().String(), Type: "system", Action: "deleteAllText", Icon: arasaacURL("38201"), Label: "Cancella tutto", Color: "#be626aff", IsVisible: true, IsHideable: true},
			{ID: uuid.New().String(), Type: "system", Action: "speakText", Icon: arasaacURL("38216"), Label: "Leggi", Color: "#75d1a8ff", IsVisible: true, IsHideable: true},
		},
	}
}
