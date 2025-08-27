// web-app-CAA/static/script/main.js
// Main application initialization

// --- MAIN APPLICATION INITIALIZATION ---
async function initializeApplication() {
    try {
        console.log('Starting application initialization...');
        
        // Initialize DOM elements first
        initializeDOMElements();
        
        // Setup color pickers
        setupColorPickers();
        
        // Load user info and data
        displayUserInfo();
        loadSize();
        
        // Load grid data from server
        console.log('Loading grid data from server...');
        const loadedData = await loadGridFromDB();
        
        if (loadedData && Object.keys(loadedData).length > 0) {
            console.log('Grid data loaded successfully:', loadedData);
            setCategories(loadedData);
            
            // Process original symbol forms for tense conjugation
            processOriginalSymbolForms();
        } else {
            console.log('No grid data loaded, using default empty categories');
            setCategories({
                home: [],
                systemControls: []
            });
        }
        
        // Setup all event listeners
        initializeEventHandlers();
        setupGridManagementListeners();
        setupDragDropListeners();
        setupCameraListeners();
        setupModalEventListeners();
        
        // Initial render
        renderSymbols();
        
        // Handle first login tutorial
        await handleFirstLoginTutorial();
        
        console.log('Application initialized successfully');
        
    } catch (error) {
        console.error('Error during application initialization:', error);
        showInitializationError(error);
    }
}

// Fallback DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', async () => {
    // Only run if not already initialized by the module loader
    if (!window.applicationInitialized) {
        console.log('Initializing via DOMContentLoaded fallback...');
        await initializeApplication();
        window.applicationInitialized = true;
    }
});

// Export initialization function for module loader
window.initializeApp = async function() {
    if (!window.applicationInitialized) {
        console.log('Initializing via module loader...');
        await initializeApplication();
        window.applicationInitialized = true;
    }
};

// Process original symbol forms for tense functionality
function processOriginalSymbolForms() {
    const categories = getCategories();
    
    for (const key in categories) {
        if (Array.isArray(categories[key])) {
            categories[key].forEach(item => {
                if (item.type === 'symbol' && item.tense_forms) {
                    setOriginalSymbolForm(item.id, {
                        presente: item.tense_forms.presente || item.label,
                        passato: item.tense_forms.passato || item.label,
                        futuro: item.tense_forms.futuro || item.label
                    });
                }
            });
        }
    }
}

// Handle first login tutorial
async function handleFirstLoginTutorial() {
    const isFirstLogin = localStorage.getItem('isFirstLogin');
    
    if (isFirstLogin === 'true') {
        const tutorialOverlay = document.getElementById('tutorialOverlay');
        
        if (tutorialOverlay) {
            tutorialOverlay.style.display = 'block';
            
            const dismissTutorial = async () => {
                tutorialOverlay.style.display = 'none';
                localStorage.removeItem('isFirstLogin');
                
                // Mark setup as complete on server
                try {
                    const token = localStorage.getItem('jwt_token');
                    if (token) {
                        await completeUserSetup();
                    }
                } catch (error) {
                    console.error('Failed to update user setup status:', error);
                }
                
                // Remove event listeners
                tutorialOverlay.removeEventListener('click', dismissTutorial);
                if (dom.editorModeBtn) {
                    dom.editorModeBtn.removeEventListener('click', dismissTutorial);
                }
            };
            
            // Add event listeners for dismissing tutorial
            tutorialOverlay.addEventListener('click', dismissTutorial);
            if (dom.editorModeBtn) {
                dom.editorModeBtn.addEventListener('click', dismissTutorial);
            }
        }
    }
}

// Show initialization error to user
function showInitializationError(error) {
    const errorMessage = formatErrorMessage(error, 'Errore durante l\'inizializzazione dell\'applicazione');
    
    // Create error overlay
    const errorOverlay = document.createElement('div');
    errorOverlay.className = 'error-overlay';
    errorOverlay.innerHTML = `
        <div class="error-dialog">
            <h2>Errore di Inizializzazione</h2>
            <p>${errorMessage}</p>
            <div class="error-actions">
                <button onclick="location.reload()" class="btn-primary">Riprova</button>
                <button onclick="this.parentElement.parentElement.parentElement.style.display='none'" class="btn-secondary">Continua Comunque</button>
            </div>
        </div>
    `;
    
    errorOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;
    
    const errorDialog = errorOverlay.querySelector('.error-dialog');
    errorDialog.style.cssText = `
        background: white;
        padding: 2rem;
        border-radius: 8px;
        max-width: 400px;
        text-align: center;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    `;
    
    document.body.appendChild(errorOverlay);
}

// Application health check
async function performHealthCheck() {
    const checks = {
        domElements: checkDOMElements(),
        localStorage: checkLocalStorage(),
        api: await checkAPIConnection(),
        browser: checkBrowserSupport()
    };
    
    const healthStatus = {
        healthy: Object.values(checks).every(check => check.status === 'ok'),
        checks: checks,
        timestamp: new Date().toISOString()
    };
    
    console.log('Health check results:', healthStatus);
    return healthStatus;
}

function checkDOMElements() {
    const requiredElements = [
        'symbolGrid', 'textBar', 'textContent', 'userModeBtn', 'editorModeBtn'
    ];
    
    const missing = requiredElements.filter(id => !document.getElementById(id));
    
    return {
        status: missing.length === 0 ? 'ok' : 'warning',
        message: missing.length === 0 ? 'All required DOM elements found' : `Missing elements: ${missing.join(', ')}`,
        missing: missing
    };
}

function checkLocalStorage() {
    try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        return {
            status: 'ok',
            message: 'localStorage is available'
        };
    } catch (error) {
        return {
            status: 'error',
            message: 'localStorage is not available',
            error: error.message
        };
    }
}

async function checkAPIConnection() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`, {
            method: 'GET',
            timeout: 5000
        });
        
        return {
            status: response.ok ? 'ok' : 'warning',
            message: response.ok ? 'API is responsive' : `API returned status ${response.status}`,
            responseTime: performance.now()
        };
    } catch (error) {
        return {
            status: 'error',
            message: 'API is not accessible',
            error: error.message
        };
    }
}

function checkBrowserSupport() {
    const features = {
        fetch: typeof fetch !== 'undefined',
        localStorage: typeof Storage !== 'undefined',
        speechSynthesis: 'speechSynthesis' in window,
        mediaDevices: 'mediaDevices' in navigator,
        dragAndDrop: 'draggable' in document.createElement('div'),
        fullscreen: 'requestFullscreen' in document.documentElement
    };
    
    const unsupported = Object.entries(features)
        .filter(([name, supported]) => !supported)
        .map(([name]) => name);
    
    return {
        status: unsupported.length === 0 ? 'ok' : 'warning',
        message: unsupported.length === 0 ? 'All features supported' : `Unsupported features: ${unsupported.join(', ')}`,
        features: features,
        unsupported: unsupported
    };
}

// Development mode helpers
function enableDevelopmentMode() {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        // Add development helpers
        window.devTools = {
            getAppState: () => ({
                currentMode: getCurrentMode(),
                currentCategory: getCurrentCategory(),
                navigationStack: getNavigationStack(),
                textContent: getTextContent(),
                categories: getCategories()
            }),
            
            clearGrid: () => {
                setCategories({ home: [], systemControls: [] });
                renderSymbols();
                console.log('Grid cleared');
            },
            
            exportGrid: () => {
                const data = JSON.stringify(getCategories(), null, 2);
                console.log('Grid data:', data);
                return data;
            },
            
            importGrid: (data) => {
                try {
                    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
                    setCategories(parsed);
                    renderSymbols();
                    console.log('Grid imported successfully');
                } catch (error) {
                    console.error('Failed to import grid:', error);
                }
            },
            
            performHealthCheck: performHealthCheck
        };
        
        console.log('Development mode enabled. Use window.devTools for debugging.');
    }
}

// Initialize development mode
enableDevelopmentMode();

// Expose key functions to global scope for backward compatibility
if (typeof window !== 'undefined') {
    // Core functions that might be called from HTML
    window.openFullscreen = openFullscreen;
    window.closeFullscreen = closeFullscreen;
    window.deleteLastWord = deleteLastWord;
    window.deleteAllText = deleteAllText;
    window.speakText = speakText;
    
    // State functions for debugging
    window.getCurrentMode = getCurrentMode;
    window.getCurrentCategory = getCurrentCategory;
    window.getCategories = getCategories;
    
    // Utility functions
    window.performHealthCheck = performHealthCheck;
}
