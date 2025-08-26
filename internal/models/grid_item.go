package models

// GridItem represents a grid item in the CAA system
type GridItem struct {
	ID             string `json:"id" gorm:"primaryKey"`
	UserID         uint   `json:"user_id" gorm:"primaryKey;index"`
	ParentCategory string `json:"parent_category" gorm:"not null;index"`
	ItemOrder      int    `json:"item_order"`
	Type           string `json:"type" gorm:"not null"`
	Label          string `json:"label" gorm:"not null"`
	Icon           string `json:"icon" gorm:"type:text"`
	Color          string `json:"color"`
	Target         string `json:"target"`
	Text           string `json:"text" gorm:"type:text"`
	Speak          string `json:"speak" gorm:"type:text"`
	Action         string `json:"action"`
	IsVisible      bool   `json:"isVisible" gorm:"default:true"`
	SymbolType     string `json:"symbol_type"`
	IsHideable     bool   `json:"isHideable" gorm:"default:true"`

	// Reference to User
	User User `json:"-" gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
}

func (GridItem) TableName() string {
	return "grid_items"
}
