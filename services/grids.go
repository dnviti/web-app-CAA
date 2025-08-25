package services

import (
	"gin/models"
)

// DefaultGrid contains the default grid structure for new users
var DefaultGrid = map[string][]models.GridItemResponse{
	"home": {
		{ID: "cat-emo", Type: "category", Icon: "https://api.arasaac.org/api/pictograms/39091", Label: "Emozioni", Target: "emotions", Color: "#FFADAD", IsVisible: true},
		{ID: "cat-act", Type: "category", Icon: "https://api.arasaac.org/api/pictograms/7297", Label: "Azioni", Target: "actions", Color: "#FFD6A5", IsVisible: true},
		{ID: "cat-food", Type: "category", Icon: "https://api.arasaac.org/api/pictograms/4610", Label: "Cibo", Target: "food", Color: "#CAFFBF", IsVisible: true},
		{ID: "cat-fam", Type: "category", Icon: "https://api.arasaac.org/api/pictograms/38351", Label: "Famiglia", Target: "family", Color: "#9BF6FF", IsVisible: true},
		{ID: "cat-subj", Type: "category", Icon: "https://api.arasaac.org/api/pictograms/6632", Label: "Soggetti", Target: "subject", Color: "#A0C4FF", IsVisible: true},
	},
	"subject": {
		{ID: "sym-io", Type: "symbol", Icon: "https://api.arasaac.org/api/pictograms/6632", Label: "Io", Text: "io", Speak: "io", SymbolType: "nome", Color: "#A0C4FF", IsVisible: true},
		{ID: "sym-tu", Type: "symbol", Icon: "https://api.arasaac.org/api/pictograms/6625", Label: "Tu", Text: "tu", Speak: "tu", SymbolType: "nome", Color: "#BDB2FF", IsVisible: true},
		{ID: "sym-lui", Type: "symbol", Icon: "https://api.arasaac.org/api/pictograms/6480", Label: "Lui", Text: "lui", Speak: "lui", SymbolType: "nome", Color: "#A0C4FF", IsVisible: true},
		{ID: "sym-lei", Type: "symbol", Icon: "https://api.arasaac.org/api/pictograms/7028", Label: "Lei", Text: "lei", Speak: "lei", SymbolType: "nome", Color: "#A0C4FF", IsVisible: true},
		{ID: "sym-noi", Type: "symbol", Icon: "https://api.arasaac.org/api/pictograms/7186", Label: "Noi", Text: "noi", Speak: "noi", SymbolType: "nome", Color: "#A0C4FF", IsVisible: true},
		{ID: "sym-voi", Type: "symbol", Icon: "https://api.arasaac.org/api/pictograms/7305", Label: "Voi", Text: "voi", Speak: "voi", SymbolType: "nome", Color: "#A0C4FF", IsVisible: true},
		{ID: "sym-essi", Type: "symbol", Icon: "https://api.arasaac.org/api/pictograms/7033", Label: "Loro", Text: "loro", Speak: "loro", SymbolType: "nome", Color: "#A0C4FF", IsVisible: true},
	},
	"emotions": {
		{ID: "sym-happy", Type: "symbol", Icon: "https://api.arasaac.org/api/pictograms/35547", Label: "Felice", Text: "felice", SymbolType: "altro", Speak: "felice", Color: "#FFADAD", IsVisible: true},
		{ID: "sym-sad", Type: "symbol", Icon: "https://api.arasaac.org/api/pictograms/35545", Label: "Triste", Text: "triste", SymbolType: "altro", Speak: "triste", Color: "#A0C4FF", IsVisible: true},
	},
	"actions": {
		{ID: "sym-walk", Type: "symbol", Icon: "https://api.arasaac.org/api/pictograms/29951", Label: "Camminare", Text: "camminare", SymbolType: "verbo", Speak: "camminare", Color: "#CAFFBF", IsVisible: true},
		{ID: "sym-want", Type: "symbol", Icon: "https://api.arasaac.org/api/pictograms/5441", Label: "Volere", Text: "volere", SymbolType: "verbo", Speak: "volere", Color: "#FFC6FF", IsVisible: true},
		{ID: "sym-help", Type: "symbol", Icon: "https://api.arasaac.org/api/pictograms/32648", Label: "Aiutare", Text: "aiutare", SymbolType: "verbo", Speak: "aiutare", Color: "#FDFFB6", IsVisible: true},
		{ID: "sym-leg", Type: "symbol", Icon: "https://api.arasaac.org/api/pictograms/7141", Label: "Leggere", Text: "leggere", SymbolType: "verbo", Speak: "leggere", Color: "#FDFFB6", IsVisible: true},
		{ID: "sym-be", Type: "symbol", Icon: "https://api.arasaac.org/api/pictograms/36480", Label: "Essere", Text: "essere", SymbolType: "verbo", Speak: "essere", Color: "#FDFFB6", IsVisible: true},
		{ID: "sym-have", Type: "symbol", Icon: "https://api.arasaac.org/api/pictograms/32761", Label: "Avere", Text: "avere", SymbolType: "verbo", Speak: "avere", Color: "#FDFFB6", IsVisible: true},
		{ID: "sym-eat", Type: "symbol", Icon: "https://api.arasaac.org/api/pictograms/6456", Label: "Mangiare", Text: "mangiare", SymbolType: "verbo", Speak: "mangiare", Color: "#FDFFB6", IsVisible: true},
	},
	"food": {
		{ID: "sym-pizza", Type: "symbol", Icon: "https://api.arasaac.org/api/pictograms/2527", Label: "Pizza", Text: "pizza", SymbolType: "nome", Speak: "pizza", Color: "#FFADAD", IsVisible: true},
	},
	"family": {
		{ID: "sym-mom", Type: "symbol", Icon: "https://api.arasaac.org/api/pictograms/2458", Label: "Mamma", Text: "mamma", SymbolType: "nome", Speak: "mamma", Color: "#9BF6FF", IsVisible: true},
	},
	"systemControls": {
		{ID: "sys-del-word", Type: "system", Action: "deleteLastWord", Icon: "https://api.arasaac.org/api/pictograms/38200", Label: "Cancella ultimo", Color: "#be626aff", IsVisible: true, IsHideable: true},
		{ID: "sys-del-all", Type: "system", Action: "deleteAllText", Icon: "https://api.arasaac.org/api/pictograms/38201", Label: "Cancella tutto", Color: "#be626aff", IsVisible: true, IsHideable: true},
		{ID: "sys-speak", Type: "system", Action: "speakText", Icon: "https://api.arasaac.org/api/pictograms/38216", Label: "Leggi", Color: "#75d1a8ff", IsVisible: true, IsHideable: true},
		{ID: "sys-tense-past", Type: "system", Action: "setTense", Text: "passato", Icon: "https://api.arasaac.org/api/pictograms/9839", Label: "Passato", Color: "#bb9bffff", IsVisible: true, IsHideable: false},
		{ID: "sys-tense-present", Type: "system", Action: "setTense", Text: "presente", Icon: "https://api.arasaac.org/api/pictograms/38276", Label: "Presente", Color: "#A0C4FF", IsVisible: true, IsHideable: false},
		{ID: "sys-tense-future", Type: "system", Action: "setTense", Text: "futuro", Icon: "https://api.arasaac.org/api/pictograms/9829", Label: "Futuro", Color: "#ffb2bfff", IsVisible: true, IsHideable: false},
	},
}

// SimplifiedGrid contains the simplified grid structure
var SimplifiedGrid = map[string][]models.GridItemResponse{
	"home": {
		{ID: "cat-subj", Type: "category", Icon: "https://api.arasaac.org/api/pictograms/6632", Label: "Soggetti", Target: "subject", Color: "#A0C4FF", IsVisible: true},
		{ID: "cat-act", Type: "category", Icon: "https://api.arasaac.org/api/pictograms/7297", Label: "Azioni", Target: "actions", Color: "#FFD6A5", IsVisible: true},
	},
	"subject": {
		{ID: "sym-io", Type: "symbol", Icon: "https://api.arasaac.org/api/pictograms/6632", Label: "Io", Text: "io", Speak: "io", SymbolType: "nome", Color: "#A0C4FF", IsVisible: true},
		{ID: "sym-tu", Type: "symbol", Icon: "https://api.arasaac.org/api/pictograms/6625", Label: "Tu", Text: "tu", Speak: "tu", SymbolType: "nome", Color: "#BDB2FF", IsVisible: true},
	},
	"actions": {
		{ID: "sym-be", Type: "symbol", Icon: "https://api.arasaac.org/api/pictograms/36480", Label: "Essere", Text: "essere", SymbolType: "verbo", Speak: "essere", Color: "#FDFFB6", IsVisible: true},
		{ID: "sym-eat", Type: "symbol", Icon: "https://api.arasaac.org/api/pictograms/6456", Label: "Mangiare", Text: "mangiare", SymbolType: "verbo", Speak: "mangiare", Color: "#FDFFB6", IsVisible: true},
	},
	"systemControls": DefaultGrid["systemControls"],
}
