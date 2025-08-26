# CAA Web App - JavaScript Modular Architecture

## Overview

The JavaScript codebase for the CAA Web App has been reorganized from a single monolithic `script.js` file (1446+ lines) into a clean, modular architecture consisting of 12 specialized modules. This refactoring improves code maintainability, readability, and makes the codebase more scalable.

## Module Structure

### 1. `constants.js`
**Purpose**: DOM element references and application constants
- Contains the `dom` object with all cached DOM element references
- `initializeDOMElements()` function to cache all DOM elements
- Exports all DOM references globally for use in other modules

### 2. `state.js`
**Purpose**: Application state management
- All application state variables (currentMode, navigationStack, textContent, etc.)
- State getter and setter functions
- Centralized state management with clean API
- Handles drag/drop state, camera state, color picker state, etc.

### 3. `utils.js`
**Purpose**: Utility functions
- `findItemById()` - Find items across all categories
- `shadeColor()` - Color manipulation utilities
- `generateUniqueId()` - ID generation
- `getAllCategories()` - Category traversal helpers
- Image handling utilities (`dataURLtoFile()`, `updateImagePreview()`)
- Performance utilities (`debounce()`, `scrollIntoView()`)

### 4. `api.js`
**Purpose**: API communication functions
- `loadGridFromDB()` - Load grid data from server with retry logic
- `saveGridToDB()` - Save grid state to server
- `searchArasaacAPI()` - Search for ARASAAC icons
- `deleteItemFromDB()` - Delete items on server
- `updateItemVisibility()` - Update item visibility
- Authentication and setup API calls

### 5. `color-picker.js`
**Purpose**: Color picker functionality
- `setupColorPickers()` - Initialize color picker components
- Color preset management
- Color utility functions (`hexToHsl()`, `hslToHex()`, `isColorLight()`)
- Fallback support for browsers without color picker libraries

### 6. `ui-components.js`
**Purpose**: UI component creation and manipulation
- `renderSymbols()` - Main symbol grid rendering
- `createSymbolCell()` - Individual symbol cell creation
- `renderSystemControls()` - System control buttons rendering
- `updateTextDisplay()` - Text bar content updates
- Icon picker components and category selection modals
- Responsive layout adjustments

### 7. `modals.js`
**Purpose**: Modal dialog management
- `showModal()` / `closeModal()` - Modal display controls
- `resetSymbolModal()` / `resetCategoryModal()` - Modal state reset
- `openEditModal()` - Edit dialog management
- Password modal handling
- Fullscreen functionality
- Modal event listener setup
- Accessibility features (focus management, escape key handling)

### 8. `drag-drop.js`
**Purpose**: Drag and drop functionality
- Complete drag and drop implementation
- `handleDragStart()`, `handleDragOver()`, `handleDrop()`, etc.
- Context menu functionality
- Trash can drop handling with confirmation
- Copy/move operations between categories
- Item visibility toggle

### 9. `camera.js`
**Purpose**: Camera functionality
- `openCamera()` - Access device camera
- `capturePhoto()` - Take and process photos
- `handleFileUpload()` - File upload handling
- Image resizing and optimization
- Camera permission checking
- Error handling for camera operations

### 10. `grid-management.js`
**Purpose**: Grid and symbol management
- Navigation between categories (`navigateToCategory()`, `goBack()`)
- Text manipulation (`addSymbolToText()`, `deleteLastWord()`, `speakText()`)
- Mode switching (user/editor mode)
- Item creation and editing (`confirmEditItem()`)
- ARASAAC icon search with debouncing
- Session management
- User logout functionality

### 11. `event-handlers.js`
**Purpose**: Event handling logic
- Centralized event listener setup
- Keyboard shortcuts and accessibility features
- Touch gesture support for mobile devices
- Error handling and performance monitoring
- Focus management for accessibility
- Global error boundary

### 12. `main.js`
**Purpose**: Main application initialization
- Application bootstrapping and initialization sequence
- First login tutorial handling
- Health checking and error reporting
- Development mode utilities
- Performance monitoring
- Global function exports for backward compatibility

## File Structure

```
web/static/script/
├── script.js              # Module loader (70 lines, was 1446+)
├── script-original.js      # Original monolithic file (backup)
├── constants.js           # DOM references (150 lines)
├── state.js               # State management (200 lines)
├── utils.js               # Utilities (150 lines)
├── api.js                 # API functions (180 lines)
├── color-picker.js        # Color functionality (200 lines)
├── ui-components.js       # UI components (300 lines)
├── modals.js              # Modal management (250 lines)
├── drag-drop.js           # Drag & drop (300 lines)
├── camera.js              # Camera functionality (150 lines)
├── grid-management.js     # Grid operations (250 lines)
├── event-handlers.js      # Event handling (200 lines)
├── main.js                # App initialization (200 lines)
├── auth.js                # Authentication (existing)
├── checkAuth.js           # Auth validation (existing)
├── config.js              # Configuration (existing)
└── setup.js               # Setup wizard (existing)
```

## Loading Mechanism

The new `script.js` file acts as a module loader that:
1. Lists all modules in dependency order
2. Dynamically loads each module using script tags
3. Maintains loading order with `async: false`
4. Provides loading progress feedback
5. Maintains backward compatibility with existing HTML

## Backward Compatibility

- All existing HTML templates continue to work without modification
- Global functions are still available (`openFullscreen()`, `deleteLastWord()`, etc.)
- The module loader provides fallback functions until modules are loaded
- All existing functionality is preserved

## Benefits of Modular Architecture

### 1. **Maintainability**
- Each module has a single, clear responsibility
- Easier to locate and fix bugs
- Cleaner separation of concerns

### 2. **Readability**
- Much smaller, focused files (70-300 lines vs 1446 lines)
- Clear naming conventions and documentation
- Logical grouping of related functionality

### 3. **Scalability**
- Easy to add new features by creating new modules
- Modules can be developed and tested independently
- Better code reusability

### 4. **Performance**
- Modules can be cached separately by browsers
- Easier to implement lazy loading if needed
- Better debugging with smaller files

### 5. **Collaboration**
- Multiple developers can work on different modules simultaneously
- Reduced merge conflicts
- Clear API boundaries between modules

## Development Guidelines

### Adding New Functionality
1. Determine which module the new feature belongs to
2. If it doesn't fit existing modules, create a new specialized module
3. Update the module list in `script.js`
4. Follow existing patterns for function exports

### Module Dependencies
- Modules should avoid circular dependencies
- State should be managed through `state.js`
- DOM access should go through `constants.js`
- API calls should go through `api.js`

### Testing
- Each module can be tested independently
- Mock dependencies for isolated unit testing
- Integration tests can load specific module combinations

### Code Style
- Use consistent naming conventions (camelCase for functions, UPPER_CASE for constants)
- Add JSDoc comments for public functions
- Export functions at the end of each module
- Include error handling and fallbacks

## Migration Notes

The original monolithic `script.js` has been preserved as `script-original.js` for reference. The new modular system:

- **Reduces complexity**: From 1 file with 1446+ lines to 12 focused modules
- **Improves organization**: Each module handles a specific aspect of the application
- **Maintains compatibility**: All existing functionality works without changes
- **Enables growth**: New features can be added cleanly to appropriate modules

## Future Enhancements

Potential improvements that the modular architecture enables:

1. **Lazy Loading**: Load modules only when needed
2. **Module Bundling**: Combine modules for production deployment
3. **TypeScript Migration**: Convert modules to TypeScript incrementally
4. **Testing Framework**: Add comprehensive unit tests for each module
5. **Documentation**: Generate API documentation from module exports
6. **Hot Reloading**: Enable development hot reloading of individual modules
