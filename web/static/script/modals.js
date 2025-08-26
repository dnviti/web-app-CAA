// web-app-CAA/static/script/modals.js
// Modal dialog management

// --- MODAL & UI MANAGEMENT ---
function showModal(modal) {
    if (modal) {
        modal.classList.add('active');
        // Focus management for accessibility
        const firstFocusableElement = modal.querySelector('input, button, textarea, select, [tabindex]:not([tabindex="-1"])');
        if (firstFocusableElement) {
            firstFocusableElement.focus();
        }
    }
}

function closeModal(modal) {
    if (!modal) return;
    
    modal.classList.remove('active');
    
    // Reset specific modal states
    if (modal === dom.passwordModal && dom.passwordInput) {
        dom.passwordInput.value = '';
    }
    
    // Reset editing states when closing main editing modals
    if (modal === dom.addSymbolModal) {
        resetSymbolModal();
        setEditingItemId(null);
    }
    
    if (modal === dom.addCategoryModal) {
        resetCategoryModal();
        setEditingItemId(null);
    }
}

function resetSymbolModal() {
    if (!dom.symbolLabel) return;
    
    dom.symbolLabel.value = '';
    if (dom.symbolSpeak) dom.symbolSpeak.value = '';
    if (dom.symbolType) dom.symbolType.value = 'nome';
    if (dom.symbolColor) dom.symbolColor.value = '#ffffff';
    if (dom.iconSearchResults) dom.iconSearchResults.innerHTML = '';
    if (dom.symbolIconQuery) dom.symbolIconQuery.value = '';
    
    // Reset selected icon URLs
    setSelectedArasaacIconUrl(null);
    setSelectedCustomSymbolIconUrl(null);
    
    // Reset image preview
    updateImagePreview(dom.symbolCustomImagePreview, null);
    
    // Reset color picker
    const colorPickers = getColorPickers();
    if (colorPickers.symbol) {
        colorPickers.symbol.color.hexString = '#ffffff';
    }
    
    // Reset modal title
    const modalTitle = dom.addSymbolModal?.querySelector('#addSymbolModalTitle');
    if (modalTitle) {
        modalTitle.textContent = 'Aggiungi Simbolo';
    }
    
    // Reset confirm button text
    if (dom.confirmAddSymbolBtn) {
        dom.confirmAddSymbolBtn.textContent = 'Aggiungi';
    }
    
    // Show/hide appropriate fields
    if (dom.symbolSpeak?.parentElement) {
        dom.symbolSpeak.parentElement.style.display = 'block';
    }
    if (dom.symbolType?.parentElement) {
        dom.symbolType.parentElement.style.display = 'block';
    }
}

function resetCategoryModal() {
    if (!dom.categoryLabel) return;
    
    dom.categoryLabel.value = '';
    if (dom.categoryColor) dom.categoryColor.value = '#ffffff';
    if (dom.categoryIconSearchResults) dom.categoryIconSearchResults.innerHTML = '';
    if (dom.categoryIconQuery) dom.categoryIconQuery.value = '';
    
    // Reset selected icon URLs
    setSelectedArasaacCategoryIconUrl(null);
    setSelectedCustomCategoryIconUrl(null);
    
    // Reset image preview
    updateImagePreview(dom.categoryCustomImagePreview, null);
    
    // Reset color picker
    const colorPickers = getColorPickers();
    if (colorPickers.category) {
        colorPickers.category.color.hexString = '#ffffff';
    }
    
    // Reset modal title
    const modalTitle = dom.addCategoryModal?.querySelector('#addCategoryModalTitle');
    if (modalTitle) {
        modalTitle.textContent = 'Aggiungi Categoria';
    }
    
    // Reset confirm button text
    if (dom.confirmAddCategoryBtn) {
        dom.confirmAddCategoryBtn.textContent = 'Aggiungi';
    }
}

function openEditModal(itemId = null, itemType = 'symbol') {
    setEditingItemId(itemId);
    const isEditing = itemId !== null;
    const item = isEditing ? findItemById(itemId)?.item : null;
    itemType = item ? item.type : itemType;
    
    const modal = itemType === 'category' ? dom.addCategoryModal : dom.addSymbolModal;
    
    // Reset both modals first
    resetSymbolModal();
    resetCategoryModal();
    
    if (itemType === 'category') {
        if (isEditing && item) {
            const modalTitle = modal.querySelector('#addCategoryModalTitle');
            if (modalTitle) modalTitle.textContent = 'Modifica Categoria';
            
            dom.categoryLabel.value = item.label;
            setSelectedArasaacCategoryIconUrl(item.icon);
            updateImagePreview(dom.categoryCustomImagePreview, item.icon);
            dom.categoryIconSearchResults.innerHTML = `<img src="${item.icon}" alt="Icona corrente" class="icon-search-result selected">`;
            dom.categoryColor.value = item.color;
            
            const colorPickers = getColorPickers();
            if (colorPickers.category) {
                colorPickers.category.color.hexString = item.color;
            }
        }
        
        if (dom.confirmAddCategoryBtn) {
            dom.confirmAddCategoryBtn.textContent = isEditing ? 'Salva Modifiche' : 'Aggiungi';
        }
    } else {
        if (isEditing && item) {
            const modalTitle = modal.querySelector('#addSymbolModalTitle');
            if (modalTitle) {
                modalTitle.textContent = item.type === 'system' ? 'Modifica Controllo' : 'Modifica Simbolo';
            }
            
            dom.symbolLabel.value = item.label;
            
            // Handle different symbol types
            const isSystemControl = item.type === 'system';
            if (dom.symbolSpeak?.parentElement) {
                dom.symbolSpeak.parentElement.style.display = isSystemControl ? 'none' : 'block';
            }
            if (dom.symbolType?.parentElement) {
                dom.symbolType.parentElement.style.display = isSystemControl ? 'none' : 'block';
            }
            
            if (!isSystemControl) {
                if (dom.symbolSpeak) dom.symbolSpeak.value = item.speak || '';
                if (dom.symbolType) dom.symbolType.value = item.symbol_type || 'nome';
            }
            
            setSelectedArasaacIconUrl(item.icon);
            updateImagePreview(dom.symbolCustomImagePreview, item.icon);
            dom.iconSearchResults.innerHTML = `<img src="${item.icon}" alt="Icona corrente" class="icon-search-result selected">`;
            dom.symbolColor.value = item.color;
            
            const colorPickers = getColorPickers();
            if (colorPickers.symbol) {
                colorPickers.symbol.color.hexString = item.color;
            }
        }
        
        if (dom.confirmAddSymbolBtn) {
            dom.confirmAddSymbolBtn.textContent = isEditing ? 'Salva Modifiche' : 'Aggiungi';
        }
    }
    
    showModal(modal);
}

function requestEditorMode() {
    showModal(dom.passwordModal);
}

async function checkPassword() {
    const password = dom.passwordInput?.value;
    if (!password) {
        alert('Inserisci la password.');
        return;
    }
    
    try {
        await validateEditorPassword(password);
        setMode('editor');
        closeModal(dom.passwordModal);
    } catch (error) {
        alert(formatErrorMessage(error, 'Password non valida.'));
        dom.passwordInput.value = '';
        dom.passwordInput.focus();
    }
}

function openSystemControlsEditor() {
    if (!dom.systemControlsList || !dom.systemControlsModal) return;
    
    dom.systemControlsList.innerHTML = '';
    const categories = getCategories();
    const systemControls = categories.systemControls || [];
    
    systemControls.forEach(control => {
        const controlItem = createSystemControlItem(control);
        dom.systemControlsList.appendChild(controlItem);
    });
    
    showModal(dom.systemControlsModal);
}

// Show fullscreen mode
function openFullscreen() {
    const element = document.documentElement;
    if (element.requestFullscreen) {
        element.requestFullscreen();
    } else if (element.webkitRequestFullscreen) { // Safari
        element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) { // IE11
        element.msRequestFullscreen();
    }
}

// Exit fullscreen mode
function closeFullscreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.webkitExitFullscreen) { // Safari
        document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) { // IE11
        document.msExitFullscreen();
    }
}

// Handle fullscreen change events
function onFullscreenChange() {
    const isFullscreen = !!(document.fullscreenElement ||
                           document.webkitFullscreenElement ||
                           document.msFullscreenElement);
    
    // Update UI based on fullscreen state
    const fullscreenBtn = document.querySelector('[onclick="openFullscreen()"]');
    if (fullscreenBtn) {
        fullscreenBtn.style.display = isFullscreen ? 'none' : 'inline-block';
    }
    
    const exitFullscreenBtn = document.querySelector('[onclick="closeFullscreen()"]');
    if (exitFullscreenBtn) {
        exitFullscreenBtn.style.display = isFullscreen ? 'inline-block' : 'none';
    }
}

// Set up fullscreen event listeners
function setupFullscreenListeners() {
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    document.addEventListener('msfullscreenchange', onFullscreenChange);
}

// Handle escape key to close modals
function handleEscapeKey(event) {
    if (event.key === 'Escape') {
        // Close the topmost modal
        const activeModals = document.querySelectorAll('.modal.active');
        if (activeModals.length > 0) {
            const topModal = activeModals[activeModals.length - 1];
            closeModal(topModal);
        }
    }
}

// Set up modal event listeners
function setupModalEventListeners() {
    // Escape key handler
    document.addEventListener('keydown', handleEscapeKey);
    
    // Click outside modal to close
    document.addEventListener('click', (event) => {
        const activeModals = document.querySelectorAll('.modal.active');
        activeModals.forEach(modal => {
            if (event.target === modal) {
                closeModal(modal);
            }
        });
    });
    
    setupFullscreenListeners();
}

// Export functions for use in other modules
if (typeof window !== 'undefined') {
    window.showModal = showModal;
    window.closeModal = closeModal;
    window.resetSymbolModal = resetSymbolModal;
    window.resetCategoryModal = resetCategoryModal;
    window.openEditModal = openEditModal;
    window.requestEditorMode = requestEditorMode;
    window.checkPassword = checkPassword;
    window.openSystemControlsEditor = openSystemControlsEditor;
    window.openFullscreen = openFullscreen;
    window.closeFullscreen = closeFullscreen;
    window.onFullscreenChange = onFullscreenChange;
    window.setupFullscreenListeners = setupFullscreenListeners;
    window.setupModalEventListeners = setupModalEventListeners;
}
