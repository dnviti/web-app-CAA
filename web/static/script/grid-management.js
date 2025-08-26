// web-app-CAA/static/script/grid-management.js
// Grid and symbol management

// --- NAVIGATION & TEXT MANIPULATION ---
function navigateToCategory(categoryName) {
    pushToNavigationStack(categoryName);
    renderSymbols();
}

function goBack() {
    popFromNavigationStack();
    renderSymbols();
}

function addSymbolToText(symbol) {
    const currentTense = getCurrentTense();
    
    // Create a copy of the symbol to add to text
    let symbolToAdd = { ...symbol };
    
    // Handle tense conjugation if available
    if (symbol.tense_forms && symbol.tense_forms[currentTense]) {
        symbolToAdd.label = symbol.tense_forms[currentTense];
    }
    
    addToTextContent(symbolToAdd);
    updateTextDisplay();
}

function deleteLastWord() {
    removeLastFromTextContent();
    updateTextDisplay();
}

function deleteAllText() {
    clearTextContent();
    updateTextDisplay();
}

async function speakText() {
    const textContent = getTextContent();
    if (textContent.length === 0) return;
    
    // Create text to speak from symbols
    const textToSpeak = textContent
        .map(symbol => symbol.speak || symbol.label)
        .join(' ');
    
    if ('speechSynthesis' in window) {
        // Stop any ongoing speech
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = 'it-IT';
        utterance.rate = 0.8;
        utterance.pitch = 1;
        
        window.speechSynthesis.speak(utterance);
    } else {
        console.warn('Speech synthesis not supported');
        alert('La sintesi vocale non è supportata in questo browser.');
    }
}

// --- EDITOR MODE & PASSWORD ---
function closeEditor() {
    setMode('user');
}

function setMode(mode) {
    setCurrentMode(mode);
    
    if (dom.userModeBtn && dom.editorModeBtn) {
        dom.userModeBtn.classList.toggle('active', mode === 'user');
        dom.editorModeBtn.classList.toggle('active', mode === 'editor');
    }
    
    if (dom.editorPanel) {
        dom.editorPanel.style.display = (mode === 'editor') ? 'block' : 'none';
    }
    
    renderSymbols();
    adjustMainContainerPadding();
}

function setTense(tense) {
    setCurrentTense(tense);
    renderTenseButtons();
    
    // Update any displayed text with new tense
    updateTextDisplay();
}

// --- ADD & EDIT ITEMS ---
async function confirmEditItem(itemType) {
    const editingItemId = getEditingItemId();
    const isEditing = editingItemId !== null;
    
    let label, color, icon, speak = '', symbolType = 'nome';
    
    if (itemType === 'category') {
        label = dom.categoryLabel?.value?.trim();
        color = dom.categoryColor?.value;
        
        const iconUrls = getSelectedIconUrls();
        icon = iconUrls.customCategoryIcon || iconUrls.arasaacCategoryIcon;
    } else {
        label = dom.symbolLabel?.value?.trim();
        color = dom.symbolColor?.value;
        speak = dom.symbolSpeak?.value?.trim() || '';
        symbolType = dom.symbolType?.value || 'nome';
        
        const iconUrls = getSelectedIconUrls();
        icon = iconUrls.customSymbolIcon || iconUrls.arasaacIcon;
    }
    
    if (!label) {
        alert('Il campo etichetta è obbligatorio.');
        return;
    }
    
    if (!icon) {
        alert('Seleziona un\'icona.');
        return;
    }
    
    const currentCategory = getCurrentCategory();
    const categories = getCategories();
    
    if (isEditing) {
        // Update existing item
        const found = findItemById(editingItemId);
        if (found) {
            const item = found.item;
            item.label = label;
            item.color = color;
            item.icon = icon;
            
            if (itemType !== 'category') {
                item.speak = speak;
                item.symbol_type = symbolType;
            }
        }
    } else {
        // Add new item
        const newItem = {
            id: generateUniqueId(),
            label: label,
            color: color,
            icon: icon,
            type: itemType,
            visible: true
        };
        
        if (itemType === 'category') {
            const targetKey = generateUniqueId();
            newItem.target = targetKey;
            
            // Initialize empty category
            categories[targetKey] = [];
        } else {
            newItem.speak = speak;
            newItem.symbol_type = symbolType;
        }
        
        if (!categories[currentCategory]) {
            categories[currentCategory] = [];
        }
        
        categories[currentCategory].push(newItem);
    }
    
    // Update grid context if this affects tense forms
    if (itemType !== 'category' && symbolType !== 'nome') {
        await updateGridForContext();
    }
    
    renderSymbols();
    closeModal(itemType === 'category' ? dom.addCategoryModal : dom.addSymbolModal);
    saveGridToDB();
}

async function updateGridForContext() {
    // This function would handle updating tense forms for verbs
    // Implementation would depend on your AI service for conjugation
    console.log('Updating grid context for tense forms...');
}

// --- ICON SEARCH FUNCTIONALITY ---
const searchArasaacIcon = debounce(async () => {
    const query = dom.symbolIconQuery?.value?.trim();
    if (!query) {
        if (dom.iconSearchResults) {
            dom.iconSearchResults.innerHTML = '';
        }
        return;
    }
    
    try {
        const icons = await searchArasaacAPI(query);
        updateIconPicker(icons, dom.iconSearchResults, (icon) => {
            const iconUrl = `https://api.arasaac.org/api/pictograms/${icon.id}`;
            setSelectedArasaacIconUrl(iconUrl);
            setSelectedCustomSymbolIconUrl(null);
            updateImagePreview(dom.symbolCustomImagePreview, null);
        });
    } catch (error) {
        console.error('Error searching icons:', error);
        if (dom.iconSearchResults) {
            dom.iconSearchResults.innerHTML = '<p>Errore durante la ricerca delle icone.</p>';
        }
    }
}, 300);

const searchArasaacCategoryIcon = debounce(async () => {
    const query = dom.categoryIconQuery?.value?.trim();
    if (!query) {
        if (dom.categoryIconSearchResults) {
            dom.categoryIconSearchResults.innerHTML = '';
        }
        return;
    }
    
    try {
        const icons = await searchArasaacAPI(query);
        updateIconPicker(icons, dom.categoryIconSearchResults, (icon) => {
            const iconUrl = `https://api.arasaac.org/api/pictograms/${icon.id}`;
            setSelectedArasaacCategoryIconUrl(iconUrl);
            setSelectedCustomCategoryIconUrl(null);
            updateImagePreview(dom.categoryCustomImagePreview, null);
        });
    } catch (error) {
        console.error('Error searching category icons:', error);
        if (dom.categoryIconSearchResults) {
            dom.categoryIconSearchResults.innerHTML = '<p>Errore durante la ricerca delle icone.</p>';
        }
    }
}, 300);

// --- SESSION MANAGEMENT ---
function startSession() {
    console.log('Starting new session...');
    clearTextContent();
    updateTextDisplay();
    
    // Could add session tracking here
    const sessionStart = new Date().toISOString();
    localStorage.setItem('sessionStart', sessionStart);
    
    alert('Nuova sessione avviata!');
}

function endSession() {
    console.log('Ending current session...');
    
    const sessionStart = localStorage.getItem('sessionStart');
    if (sessionStart) {
        const duration = Date.now() - new Date(sessionStart).getTime();
        console.log(`Session duration: ${Math.round(duration / 1000)} seconds`);
        localStorage.removeItem('sessionStart');
    }
    
    clearTextContent();
    updateTextDisplay();
    
    alert('Sessione terminata!');
}

// --- USER MANAGEMENT ---
function handleLogout() {
    if (confirm('Sei sicuro di voler uscire?')) {
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('isFirstLogin');
        localStorage.removeItem('sessionStart');
        window.location.href = '/login';
    }
}

// Setup grid management event listeners
function setupGridManagementListeners() {
    // Mode buttons
    if (dom.userModeBtn) {
        dom.userModeBtn.addEventListener('click', () => setMode('user'));
    }
    
    if (dom.editorModeBtn) {
        dom.editorModeBtn.addEventListener('click', requestEditorMode);
    }
    
    // Navigation
    if (dom.backBtn) {
        dom.backBtn.addEventListener('click', goBack);
    }
    
    // Text controls
    const deleteLastBtn = document.querySelector('[onclick="deleteLastWord()"]');
    if (deleteLastBtn) {
        deleteLastBtn.addEventListener('click', deleteLastWord);
    }
    
    const deleteAllBtn = document.querySelector('[onclick="deleteAllText()"]');
    if (deleteAllBtn) {
        deleteAllBtn.addEventListener('click', deleteAllText);
    }
    
    const speakBtn = document.querySelector('[onclick="speakText()"]');
    if (speakBtn) {
        speakBtn.addEventListener('click', speakText);
    }
    
    // Tense buttons
    if (dom.pastModeBtn) {
        dom.pastModeBtn.addEventListener('click', () => setTense('passato'));
    }
    
    if (dom.presentModeBtn) {
        dom.presentModeBtn.addEventListener('click', () => setTense('presente'));
    }
    
    if (dom.futureModeBtn) {
        dom.futureModeBtn.addEventListener('click', () => setTense('futuro'));
    }
    
    // Session buttons
    if (dom.startSessionBtn) {
        dom.startSessionBtn.addEventListener('click', startSession);
    }
    
    if (dom.endSessionBtn) {
        dom.endSessionBtn.addEventListener('click', endSession);
    }
    
    // Logout button
    if (dom.logoutBtn) {
        dom.logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Add/Edit buttons
    if (dom.addSymbolBtn) {
        dom.addSymbolBtn.addEventListener('click', () => openEditModal());
    }
    
    if (dom.addCategoryBtn) {
        dom.addCategoryBtn.addEventListener('click', () => openEditModal(null, 'category'));
    }
    
    if (dom.confirmAddSymbolBtn) {
        dom.confirmAddSymbolBtn.addEventListener('click', () => confirmEditItem('symbol'));
    }
    
    if (dom.confirmAddCategoryBtn) {
        dom.confirmAddCategoryBtn.addEventListener('click', () => confirmEditItem('category'));
    }
    
    // Icon search
    if (dom.symbolIconQuery) {
        dom.symbolIconQuery.addEventListener('input', searchArasaacIcon);
    }
    
    if (dom.categoryIconQuery) {
        dom.categoryIconQuery.addEventListener('input', searchArasaacCategoryIcon);
    }
    
    // System controls
    if (dom.editSystemControlsBtn) {
        dom.editSystemControlsBtn.addEventListener('click', openSystemControlsEditor);
    }
}

// Export functions for use in other modules
if (typeof window !== 'undefined') {
    window.navigateToCategory = navigateToCategory;
    window.goBack = goBack;
    window.addSymbolToText = addSymbolToText;
    window.deleteLastWord = deleteLastWord;
    window.deleteAllText = deleteAllText;
    window.speakText = speakText;
    window.closeEditor = closeEditor;
    window.setMode = setMode;
    window.setTense = setTense;
    window.confirmEditItem = confirmEditItem;
    window.updateGridForContext = updateGridForContext;
    window.searchArasaacIcon = searchArasaacIcon;
    window.searchArasaacCategoryIcon = searchArasaacCategoryIcon;
    window.startSession = startSession;
    window.endSession = endSession;
    window.handleLogout = handleLogout;
    window.setupGridManagementListeners = setupGridManagementListeners;
}
