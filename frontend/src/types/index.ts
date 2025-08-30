// Authentication types
export interface User {
  id: string
  username: string
  email?: string
  status?: string
  is_active?: boolean
  createdAt: string
  created_at?: string
  updated_at?: string
  roles?: Role[]
  // Backward compatibility
  role?: string
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
  refresh_token: string
  user: User
  message?: string
  status?: string
}

export interface RefreshTokenRequest {
  refresh_token: string
}

export interface RefreshTokenResponse {
  token: string
  refresh_token: string
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

// ARASAAC API types
export interface ArasaacIcon {
  _id: number
  keywords: Array<{ keyword: string }>
}

export interface ArasaacSearchResponse {
  icons: ArasaacIcon[]
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

// Admin types
export interface AdminUser {
  id: string
  username: string
  email: string
  name: string
  is_active: boolean
  roles: Role[]
  created_at: string
  updated_at: string
  last_login?: string
}

export interface Role {
  id: string
  name: string
  display_name: string
  description?: string
}

export interface CreateUserRequest {
  username: string
  email: string
  password: string
  name: string
  roles?: string[]
  is_active?: boolean
}

export interface UpdateUserRequest {
  email?: string
  name?: string
  roles?: string[]
  is_active?: boolean
}

export interface BulkOperationRequest {
  operation: 'delete' | 'activate' | 'deactivate' | 'assign_role' | 'remove_role'
  user_ids: string[]
  role_name?: string
}

export interface BulkOperationResult {
  message: string
  processed_count: number
  success_count: number
  failed_users: FailedUser[]
}

export interface FailedUser {
  user_id: string
  error: string
}

export interface UsersListResponse {
  users: AdminUser[]
  total_count: number
  current_page: number
  page_size: number
  total_pages: number
}

export interface UserAnalytics {
  total_users: number
  active_users: number
  inactive_users: number
  recent_registrations: number
  roles_distribution: Record<string, number>
}

export interface SystemHealthResponse {
  status: string
  timestamp: string
  services: {
    database: {
      status: string
      type: string
    }
    rbac: string
    auth: string
  }
}

export interface UserFilters {
  page?: number
  limit?: number
  is_active?: boolean
  role?: string
  search?: string
  sort_by?: 'username' | 'email' | 'name' | 'created_at'
  sort_order?: 'asc' | 'desc'
}
