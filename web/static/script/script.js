// web-app CAA/static/script/script.js
// 
// NOTICE: This application has been reorganized into modular JavaScript files.
// The original monolithic script.js has been split into the following modules:
//
// - constants.js: DOM element references and application constants
// - state.js: Application state management  
// - utils.js: Utility functions
// - api.js: API communication functions
// - color-picker.js: Color picker functionality
// - ui-components.js: UI component creation and manipulation
// - modals.js: Modal dialog management
// - drag-drop.js: Drag and drop functionality
// - camera.js: Camera functionality
// - grid-management.js: Grid and symbol management
// - event-handlers.js: Event handling logic
// - main.js: Main application initialization
//
// For backward compatibility, this file now loads all modules automatically.
// The original script.js has been saved as script-original.js
//

console.log('CAA Web App - Loading modular JavaScript architecture...');

// List of modules to load in order
const modules = [
    'constants.js',
    'state.js', 
    'utils.js',
    'api.js',
    'color-picker.js',
    'ui-components.js',
    'modals.js',
    'drag-drop.js',
    'camera.js',
    'grid-management.js',
    'event-handlers.js',
    'main.js'
];

// Load modules dynamically
function loadModules() {
    const basePath = '/static/script/';
    
    modules.forEach((module, index) => {
        const script = document.createElement('script');
        script.src = basePath + module;
        script.async = false; // Maintain order
        
        script.onload = () => {
            console.log(`✓ Loaded module: ${module}`);
        };
        
        script.onerror = () => {
            console.error(`✗ Failed to load module: ${module}`);
        };
        
        document.head.appendChild(script);
    });
}

// Start loading modules when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadModules);
} else {
    loadModules();
}

// Expose legacy functions for backward compatibility with existing HTML
// These will be properly defined once the modules are loaded
window.openFullscreen = window.openFullscreen || function() { console.warn('openFullscreen not yet loaded'); };
window.closeFullscreen = window.closeFullscreen || function() { console.warn('closeFullscreen not yet loaded'); };
window.deleteLastWord = window.deleteLastWord || function() { console.warn('deleteLastWord not yet loaded'); };
window.deleteAllText = window.deleteAllText || function() { console.warn('deleteAllText not yet loaded'); };
window.speakText = window.speakText || function() { console.warn('speakText not yet loaded'); };