// Authentication types
export interface User {
  id: string
  username: string
  email?: string
  createdAt: string
  role?: 'admin' | 'user'
}

export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  password: string
  email?: string
}

export interface AuthResponse {
  token: string
  user: User
}

// Symbol and Grid types
export type SymbolType = 'nome' | 'verbo' | 'aggettivo' | 'altro'
export type ItemType = 'symbol' | 'category' | 'system'
export type TenseType = 'presente' | 'passato' | 'futuro'
export type SizeType = 'small' | 'medium' | 'big'

export interface BaseItem {
  id: string
  label: string
  icon: string
  color: string
  isVisible: boolean
  isHideable?: boolean
  type: ItemType
}

export interface Symbol extends BaseItem {
  type: 'symbol'
  text: string
  speak: string
  symbol_type: SymbolType
}

export interface Category extends BaseItem {
  type: 'category'
  target: string
}

export interface SystemControl extends BaseItem {
  type: 'system'
  action: string
  text?: string
}

export type GridItem = Symbol | Category | SystemControl

export interface Categories {
  [key: string]: GridItem[]
}

// Text content for the communication bar
export interface TextItem {
  text: string
  speak: string
  icon: string
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface ConjugationRequest {
  sentence: string
  base_forms: string[]
  tense: TenseType
}

export interface CorrectionRequest {
  sentence: string
}

export interface CorrectionResponse {
  corrected_sentence: string
  original_sentence: string
}

// ARASAAC API types
export interface ArasaacIcon {
  _id: number
  keywords: Array<{ keyword: string }>
}

// Modal and UI types
export type ModalType = 
  | 'password'
  | 'addSymbol' 
  | 'addCategory'
  | 'categorySelection'
  | 'systemControls'
  | 'camera'

export interface ColorSwatch {
  color: string
  name: string
}

// Context menu types
export type ContextMenuAction = 'edit' | 'copy' | 'move' | 'toggleVisibility'

// Drag and drop types
export interface DragItem {
  id: string
  type: 'symbol' | 'category'
}

// Error types
export interface AppError {
  message: string
  code?: string
  details?: any
}

// Store types
export interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null
}

export interface AppState {
  mode: 'user' | 'editor'
  currentTense: TenseType
  currentPageSize: SizeType
  navigationStack: string[]
  textContent: TextItem[]
  draggedItemId: string | null
  editingItemId: string | null
  contextMenuSymbolId: string | null
  contextMenuAction: ContextMenuAction | null
  categories: Categories
  originalSymbolForms: Record<string, Partial<Symbol>>
}

// Component props
export interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  className?: string
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
}

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export interface SymbolCellProps {
  item: GridItem
  onClick?: () => void
  onContextMenu?: (e: React.MouseEvent) => void
  isDragging?: boolean
  isOver?: boolean
}

// Form types
export interface SymbolFormData {
  label: string
  speak: string
  text: string
  symbol_type: SymbolType
  icon: string
  color: string
}

export interface CategoryFormData {
  label: string
  icon: string
  color: string
}

// Camera types
export interface CameraState {
  isOpen: boolean
  target: 'symbol' | 'category' | null
  stream: MediaStream | null
}
