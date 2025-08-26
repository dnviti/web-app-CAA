// web-app-CAA/static/script/script-loader.js
// Simplified script loader for backward compatibility

// This file loads all the modular JavaScript files in the correct order
// and maintains backward compatibility with existing HTML templates

console.log('Loading CAA Web App modules...');

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
            console.log(`Loaded module: ${module}`);
        };
        
        script.onerror = () => {
            console.error(`Failed to load module: ${module}`);
        };
        
        document.head.appendChild(script);
    });
}

// Start loading modules
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadModules);
} else {
    loadModules();
}

// Legacy support - ensure some global functions are available immediately
window.openFullscreen = window.openFullscreen || function() { console.warn('openFullscreen not yet loaded'); };
window.closeFullscreen = window.closeFullscreen || function() { console.warn('closeFullscreen not yet loaded'); };
window.deleteLastWord = window.deleteLastWord || function() { console.warn('deleteLastWord not yet loaded'); };
window.deleteAllText = window.deleteAllText || function() { console.warn('deleteAllText not yet loaded'); };
window.speakText = window.speakText || function() { console.warn('speakText not yet loaded'); };
