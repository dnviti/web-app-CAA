// web-app-CAA/static/script/event-handlers.js
// Event handling logic

// --- EVENT LISTENER SETUP ---
function setupEventListeners() {
    // Basic modal event listeners
    setupBasicModalListeners();
    
    // Password modal
    setupPasswordModalListeners();
    
    // Add/Edit modal listeners
    setupAddEditModalListeners();
    
    // Category selection modal
    setupCategorySelectionModalListeners();
    
    // Close buttons
    setupCloseButtonListeners();
    
    // Other event listeners
    setupMiscellaneousListeners();
}

function setupBasicModalListeners() {
    // Click outside modal to close
    const modals = [
        dom.passwordModal,
        dom.addSymbolModal, 
        dom.addCategoryModal,
        dom.categorySelectionModal,
        dom.systemControlsModal
    ];
    
    modals.forEach(modal => {
        if (modal) {
            modal.addEventListener('click', e => {
                if (e.target === modal) {
                    if (modal === dom.categorySelectionModal) {
                        clearContextMenuState();
                    }
                    closeModal(modal);
                }
            });
        }
    });
}

function setupPasswordModalListeners() {
    if (dom.cancelPasswordBtn) {
        dom.cancelPasswordBtn.addEventListener('click', () => {
            closeModal(dom.passwordModal);
        });
    }
    
    if (dom.confirmPasswordBtn) {
        dom.confirmPasswordBtn.addEventListener('click', checkPassword);
    }
    
    if (dom.passwordInput) {
        dom.passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                checkPassword();
            }
        });
    }
}

function setupAddEditModalListeners() {
    // Symbol modal listeners
    if (dom.cancelAddSymbolBtn) {
        dom.cancelAddSymbolBtn.addEventListener('click', () => {
            closeModal(dom.addSymbolModal);
        });
    }
    
    // Category modal listeners
    if (dom.cancelAddCategoryBtn) {
        dom.cancelAddCategoryBtn.addEventListener('click', () => {
            closeModal(dom.addCategoryModal);
        });
    }
    
    // Icon search buttons
    if (dom.searchIconBtn) {
        dom.searchIconBtn.addEventListener('click', searchArasaacIcon);
    }
    
    if (dom.searchCategoryIconBtn) {
        dom.searchCategoryIconBtn.addEventListener('click', searchArasaacCategoryIcon);
    }
}

function setupCategorySelectionModalListeners() {
    if (dom.cancelCategorySelection) {
        dom.cancelCategorySelection.addEventListener('click', () => {
            closeModal(dom.categorySelectionModal);
            clearContextMenuState();
        });
    }
}

function setupCloseButtonListeners() {
    if (dom.closeEditorBtn) {
        dom.closeEditorBtn.addEventListener('click', closeEditor);
    }
    
    if (dom.closeSystemControlsModal) {
        dom.closeSystemControlsModal.addEventListener('click', () => {
            closeModal(dom.systemControlsModal);
        });
    }
}

function setupMiscellaneousListeners() {
    // Before unload warning
    window.addEventListener('beforeunload', (e) => {
        // This will show a generic browser confirmation dialog.
        // Custom messages are no longer supported by modern browsers for security reasons.
        e.preventDefault();
        e.returnValue = '';
    });
    
    // Resize event for responsive adjustments
    window.addEventListener('resize', debounce(() => {
        adjustMainContainerPadding();
    }, 250));
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // Focus management for accessibility
    document.addEventListener('focusin', handleFocusManagement);
    
    // Error handling for images
    document.addEventListener('error', handleImageErrors, true);
}

function handleKeyboardShortcuts(e) {
    // Only handle shortcuts when not in an input field
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
    }
    
    switch (e.key.toLowerCase()) {
        case 'escape':
            // Close any open context menu
            hideContextMenu();
            clearContextMenuState();
            break;
            
        case 'delete':
        case 'backspace':
            if (getCurrentMode() === 'user') {
                e.preventDefault();
                deleteLastWord();
            }
            break;
            
        case ' ':
        case 'enter':
            if (getCurrentMode() === 'user') {
                e.preventDefault();
                speakText();
            }
            break;
            
        case 'e':
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                if (getCurrentMode() === 'user') {
                    requestEditorMode();
                } else {
                    closeEditor();
                }
            }
            break;
            
        case 's':
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                saveGridToDB();
            }
            break;
    }
}

function handleFocusManagement(e) {
    // Ensure focus is visible for accessibility
    if (e.target.matches('button, input, select, textarea, [tabindex]')) {
        e.target.classList.add('focus-visible');
    }
}

function handleImageErrors(e) {
    if (e.target.tagName === 'IMG') {
        // Replace broken images with placeholder
        if (!e.target.dataset.errorHandled) {
            e.target.dataset.errorHandled = 'true';
            e.target.src = 'https://placehold.co/53x53/ccc/fff?text=Error';
            e.target.alt = 'Immagine non disponibile';
        }
    }
}

// Touch and gesture support for mobile devices
function setupTouchGestures() {
    let touchStartX = 0;
    let touchStartY = 0;
    let isSwiping = false;
    
    document.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        isSwiping = false;
    });
    
    document.addEventListener('touchmove', (e) => {
        if (!isSwiping) {
            const touchMoveX = e.touches[0].clientX;
            const touchMoveY = e.touches[0].clientY;
            const deltaX = Math.abs(touchMoveX - touchStartX);
            const deltaY = Math.abs(touchMoveY - touchStartY);
            
            // Detect horizontal swipe
            if (deltaX > deltaY && deltaX > 50) {
                isSwiping = true;
                
                // Swipe right to go back
                if (touchMoveX > touchStartX) {
                    const navigationStack = getNavigationStack();
                    if (navigationStack.length > 1) {
                        goBack();
                    }
                }
            }
        }
    });
    
    // Double tap to speak
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            e.preventDefault();
            speakText();
        }
        lastTouchEnd = now;
    });
}

// Accessibility enhancements
function setupAccessibilityFeatures() {
    // Announce mode changes to screen readers
    const modeObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const element = mutation.target;
                if (element.classList.contains('active')) {
                    const mode = element.id === 'userModeBtn' ? 'Modalità utente' : 'Modalità editor';
                    announceToScreenReader(mode + ' attivata');
                }
            }
        });
    });
    
    if (dom.userModeBtn) {
        modeObserver.observe(dom.userModeBtn, { attributes: true });
    }
    
    if (dom.editorModeBtn) {
        modeObserver.observe(dom.editorModeBtn, { attributes: true });
    }
    
    // Add keyboard navigation hints
    addKeyboardHints();
}

function announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.style.width = '1px';
    announcement.style.height = '1px';
    announcement.style.overflow = 'hidden';
    
    document.body.appendChild(announcement);
    announcement.textContent = message;
    
    setTimeout(() => {
        document.body.removeChild(announcement);
    }, 1000);
}

function addKeyboardHints() {
    const hints = {
        'Ctrl+E': 'Cambia modalità',
        'Ctrl+S': 'Salva modifiche',
        'Spazio/Invio': 'Pronuncia testo',
        'Backspace': 'Cancella ultima parola',
        'Esc': 'Chiudi menu/modali'
    };
    
    // Add hints to the UI (could be in a help modal or tooltip)
    const hintsList = Object.entries(hints)
        .map(([key, desc]) => `<li><kbd>${key}</kbd>: ${desc}</li>`)
        .join('');
    
    // This could be added to a help section or modal
    console.log('Keyboard shortcuts available:', hints);
}

// Error boundary for JavaScript errors
function setupErrorHandling() {
    window.addEventListener('error', (e) => {
        console.error('Global error:', e.error);
        
        // Don't show alerts for minor errors, just log them
        if (e.error && e.error.message && !e.error.message.includes('Script error')) {
            console.error('Error details:', {
                message: e.error.message,
                stack: e.error.stack,
                filename: e.filename,
                lineno: e.lineno,
                colno: e.colno
            });
        }
    });
    
    window.addEventListener('unhandledrejection', (e) => {
        console.error('Unhandled promise rejection:', e.reason);
        
        // Handle specific types of promise rejections
        if (e.reason && e.reason.message) {
            if (e.reason.message.includes('NetworkError')) {
                console.warn('Network error detected, user may be offline');
            }
        }
    });
}

// Performance monitoring
function setupPerformanceMonitoring() {
    if ('performance' in window) {
        // Monitor page load time
        window.addEventListener('load', () => {
            setTimeout(() => {
                const perfData = performance.getEntriesByType('navigation')[0];
                if (perfData) {
                    console.log('Page load performance:', {
                        loadTime: perfData.loadEventEnd - perfData.loadEventStart,
                        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
                        totalTime: perfData.loadEventEnd - perfData.fetchStart
                    });
                }
            }, 0);
        });
    }
}

// Initialize all event handlers
function initializeEventHandlers() {
    setupEventListeners();
    setupTouchGestures();
    setupAccessibilityFeatures();
    setupErrorHandling();
    setupPerformanceMonitoring();
}

// Export functions for use in other modules
if (typeof window !== 'undefined') {
    window.setupEventListeners = setupEventListeners;
    window.setupTouchGestures = setupTouchGestures;
    window.setupAccessibilityFeatures = setupAccessibilityFeatures;
    window.announceToScreenReader = announceToScreenReader;
    window.handleKeyboardShortcuts = handleKeyboardShortcuts;
    window.setupErrorHandling = setupErrorHandling;
    window.initializeEventHandlers = initializeEventHandlers;
}
