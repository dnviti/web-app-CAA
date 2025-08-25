// web-app CAA/static/script/script.js
// --- Cached DOM Elements ---
const dom = {
    textBar: null, textContentEl: null, textBarControls: null,
    userModeBtn: null, editorModeBtn: null, symbolGrid: null, navigation: null, backBtn: null,
    currentCategoryEl: null, editorPanel: null, passwordModal: null, addSymbolModal: null,
    addCategoryModal: null, closeEditorBtn: null, addSymbolBtn: null, addCategoryBtn: null,
    cancelPasswordBtn: null, confirmPasswordBtn: null, cancelAddSymbolBtn: null,
    confirmAddSymbolBtn: null, cancelAddCategoryBtn: null, confirmAddCategoryBtn: null,
    searchIconBtn: null, searchCategoryIconBtn: null, passwordInput: null, symbolLabel: null,
    symbolSpeak: null, symbolIconQuery: null, iconSearchResults: null, symbolColor: null,
    symbolColorPickerContainer: null, symbolPastelPresets: null, categoryLabel: null,
    categoryIconQuery: null, categoryIconSearchResults: null, categoryColor: null,
    categoryColorPickerContainer: null, categoryPastelPresets: null, symbolContextMenu: null,
    contextMenuEdit: null, contextMenuCopy: null, contextMenuMove: null, contextMenuToggleVisibility: null, categorySelectionModal: null,
    categorySelectionList: null, cancelCategorySelection: null, symbolCustomImageInput: null,
    symbolUploadBtn: null, symbolTakePhotoBtn: null, symbolCustomImagePreview: null,
    categoryCustomImageInput: null, categoryUploadBtn: null, categoryTakePhotoBtn: null,
    categoryCustomImagePreview: null, cameraModal: null, cameraView: null, cameraCanvas: null,
    capturePhotoBtn: null, cancelCamera: null, trashCanContainer: null,
    editSystemControlsBtn: null,
    systemControlsModal: null,
    systemControlsList: null,
    closeSystemControlsModal: null,
    startSessionBtn: null,
    endSessionBtn: null,
    usernameDisplay: null,
    logoutBtn: null,
    symbolType: null, 
    pastModeBtn: null, 
    presentModeBtn: null, 
    futureModeBtn: null 
};
let originalSymbolForms = {}; // ADD THIS LINE

// --- Application State ---
let currentMode = 'user';
// MODIFIED: Replaced currentCategory string with a navigation stack for nesting.
let navigationStack = ['home']; 
let textContent = [];
let symbolColorPicker, categoryColorPicker;
let currentTense = 'presente';
let currentPageSize = 'medium';

// --- State for ARASAAC and Custom Icons ---
let selectedArasaacIconUrl = null;
let selectedArasaacCategoryIconUrl = null;
let selectedCustomSymbolIconUrl = null;
let selectedCustomCategoryIconUrl = null;

// --- State for Advanced Features ---
let draggedItemId = null;
let contextMenuSymbolId = null;
let contextMenuAction = null;
let cameraStream = null;
let cameraTarget = null; // 'symbol' or 'category'
let editingItemId = null; // To track which item is being edited

// === DATA: Will be loaded from the server ===
let categories = {}; // Start with an empty object.

// --- HELPER FUNCTIONS ---
// ADDED: Helper to get the current category from the navigation stack.
function getCurrentCategory() {
    return navigationStack[navigationStack.length - 1];
}

function findItemById(id) {
    for (const key in categories) {
        const itemIndex = categories[key].findIndex(item => item.id === id);
        if (itemIndex > -1) {
            return {
                item: categories[key][itemIndex],
                parentKey: key,
                index: itemIndex
            };
        }
    }
    return null;
}
function shadeColor(color, percent) {
    let R = parseInt(color.substring(1, 3), 16); let G = parseInt(color.substring(3, 5), 16); let B = parseInt(color.substring(5, 7), 16);
    R = parseInt(R * (100 + percent) / 100); G = parseInt(G * (100 + percent) / 100); B = parseInt(B * (100 + percent) / 100);
    R = (R < 255) ? R : 255; G = (G < 255) ? G : 255; B = (B < 255) ? B : 255;
    const RR = ((R.toString(16).length == 1) ? "0" + R.toString(16) : R.toString(16));
    const GG = ((G.toString(16).length == 1) ? "0" + G.toString(16) : G.toString(16));
    const BB = ((B.toString(16).length == 1) ? "0" + B.toString(16) : B.toString(16));
    return "#" + RR + GG + BB;
}
function generateUniqueId() { return Date.now().toString(36) + Math.random().toString(36).substr(2); }

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async () => {
    // Cache all DOM elements
    dom.textBar = document.getElementById('textBar');
    dom.textContentEl = document.getElementById('textContent');
    dom.textBarControls = document.getElementById('textBarControls');
    dom.userModeBtn = document.getElementById('userModeBtn');
    dom.editorModeBtn = document.getElementById('editorModeBtn');
    dom.symbolGrid = document.getElementById('symbolGrid');
    dom.navigation = document.getElementById('navigation');
    dom.backBtn = document.getElementById('backBtn');
    dom.currentCategoryEl = document.getElementById('currentCategory');
    dom.editorPanel = document.getElementById('editorPanel');
    dom.passwordModal = document.getElementById('passwordModal');
    dom.addSymbolModal = document.getElementById('addSymbolModal');
    dom.addCategoryModal = document.getElementById('addCategoryModal');
    dom.closeEditorBtn = document.getElementById('closeEditor');
    dom.addSymbolBtn = document.getElementById('addSymbolBtn');
    dom.addCategoryBtn = document.getElementById('addCategoryBtn');
    dom.cancelPasswordBtn = document.getElementById('cancelPassword');
    dom.confirmPasswordBtn = document.getElementById('confirmPassword');
    dom.cancelAddSymbolBtn = document.getElementById('cancelAddSymbol');
    dom.confirmAddSymbolBtn = document.getElementById('confirmAddSymbol');
    dom.cancelAddCategoryBtn = document.getElementById('cancelAddCategory');
    dom.confirmAddCategoryBtn = document.getElementById('confirmAddCategory');
    dom.searchIconBtn = document.getElementById('searchIconBtn');
    dom.searchCategoryIconBtn = document.getElementById('searchCategoryIconBtn');
    dom.passwordInput = document.getElementById('passwordInput');
    dom.symbolLabel = document.getElementById('symbolLabel');
    dom.symbolSpeak = document.getElementById('symbolSpeak');
    dom.symbolType = document.getElementById('symbolType'); // ADDED
    dom.symbolIconQuery = document.getElementById('symbolIconQuery');
    dom.iconSearchResults = document.getElementById('iconSearchResults');
    dom.symbolColor = document.getElementById('symbolColor');
    dom.symbolColorPickerContainer = document.getElementById('symbolColorPickerContainer');
    dom.symbolPastelPresets = document.getElementById('symbolPastelPresets');
    dom.categoryLabel = document.getElementById('categoryLabel');
    dom.categoryIconQuery = document.getElementById('categoryIconQuery');
    dom.categoryIconSearchResults = document.getElementById('categoryIconSearchResults');
    dom.categoryColor = document.getElementById('categoryColor');
    dom.categoryColorPickerContainer = document.getElementById('categoryColorPickerContainer');
    dom.categoryPastelPresets = document.getElementById('categoryPastelPresets');
    dom.symbolContextMenu = document.getElementById('symbolContextMenu');
    dom.contextMenuEdit = document.getElementById('contextMenuEdit');
    dom.contextMenuCopy = document.getElementById('contextMenuCopy');
    dom.contextMenuMove = document.getElementById('contextMenuMove');
    dom.contextMenuToggleVisibility = document.getElementById('contextMenuToggleVisibility');   
    dom.categorySelectionModal = document.getElementById('categorySelectionModal');
    dom.categorySelectionList = document.getElementById('categorySelectionList');
    dom.cancelCategorySelection = document.getElementById('cancelCategorySelection');
    dom.symbolCustomImageInput = document.getElementById('symbolCustomImageInput');
    dom.symbolUploadBtn = document.getElementById('symbolUploadBtn');
    dom.symbolTakePhotoBtn = document.getElementById('symbolTakePhotoBtn');
    dom.symbolCustomImagePreview = document.getElementById('symbolCustomImagePreview');
    dom.categoryCustomImageInput = document.getElementById('categoryCustomImageInput');
    dom.categoryUploadBtn = document.getElementById('categoryUploadBtn');
    dom.categoryTakePhotoBtn = document.getElementById('categoryTakePhotoBtn');
    dom.categoryCustomImagePreview = document.getElementById('categoryCustomImagePreview');
    dom.cameraModal = document.getElementById('cameraModal');
    dom.cameraView = document.getElementById('cameraView');
    dom.cameraCanvas = document.getElementById('cameraCanvas');
    dom.capturePhotoBtn = document.getElementById('capturePhotoBtn');
    dom.cancelCamera = document.getElementById('cancelCamera');
    dom.trashCanContainer = document.getElementById('trashCanContainer');
    dom.editSystemControlsBtn = document.getElementById('editSystemControlsBtn');
    dom.systemControlsModal = document.getElementById('systemControlsModal');
    dom.systemControlsList = document.getElementById('systemControlsList');
    dom.closeSystemControlsModal = document.getElementById('closeSystemControlsModal');
    dom.usernameDisplay = document.getElementById('usernameDisplay');
    dom.logoutBtn = document.getElementById('logoutBtn');
        // ADDED: Cache new session buttons
    dom.startSessionBtn = document.getElementById('startSessionBtn');
    dom.endSessionBtn = document.getElementById('endSessionBtn');
    dom.usernameDisplay = document.getElementById('usernameDisplay');
    dom.logoutBtn = document.getElementById('logoutBtn');
        // ADDED: Cache the new tense buttons.
    dom.pastModeBtn = document.getElementById('pastModeBtn');
    dom.presentModeBtn = document.getElementById('presentModeBtn');
    dom.futureModeBtn = document.getElementById('futureModeBtn');

    // --- Load Data & User Info ---
    displayUserInfo();
    loadSize();
    const loadedData = await loadGridFromDB();

    if (loadedData && Object.keys(loadedData).length > 0) {
        categories = loadedData;
        for (const key in categories) {
            categories[key].forEach(item => {
                if (item.type === 'symbol') {
                    originalSymbolForms[item.id] = {
                        label: item.label,
                        speak: item.speak,
                        text: item.text // Add this line
                    };
                }
            });
        }
    } else {
        console.error("Failed to load grid data from the server.");
        if(dom.symbolGrid) dom.symbolGrid.innerHTML = '<p style="color: white; text-align: center;">Error loading data. Please refresh.</p>';
        return; 
    }

    renderSystemControls();
    renderTenseButtons();
    renderSymbols();
    setupEventListeners();
    setupColorPickers();

    const isFirstLogin = localStorage.getItem('isFirstLogin');
    if (isFirstLogin === 'true') {
        const tutorialOverlay = document.getElementById('tutorialOverlay');
        if (tutorialOverlay) {
            tutorialOverlay.style.display = 'flex';
            
            const dismissTutorial = async () => {
                tutorialOverlay.style.display = 'none';
                localStorage.removeItem('isFirstLogin');

                const token = localStorage.getItem('jwt_token');
                if (token) {
                    try {
                        await fetch(`${API_BASE_URL}/api/complete-setup`, {
                            method: 'POST',
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                    } catch (error) {
                        console.error('Failed to update user status:', error);
                    }
                }

                tutorialOverlay.removeEventListener('click', dismissTutorial);
                dom.editorModeBtn?.removeEventListener('click', dismissTutorial);
            };

            tutorialOverlay.addEventListener('click', dismissTutorial);
            dom.editorModeBtn?.addEventListener('click', dismissTutorial);
        }
    }
});


// --- AUTH & USER INFO ---
function displayUserInfo() {
    const decodedToken = getDecodedToken(); // Assumes getDecodedToken is in checkAuth.js
    if (decodedToken && dom.usernameDisplay) {
        dom.usernameDisplay.textContent = decodedToken.username;
    }
}

function handleLogout() {
    localStorage.removeItem('jwt_token');
    window.location.href = '/login';
}


// --- DATABASE COMMUNICATION ---
async function loadGridFromDB(retries = 3, delay = 200) { // MODIFIED: Added retry logic
    const token = localStorage.getItem('jwt_token');
    if (!token) return null;

    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/grid`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                     handleLogout();
                     return null;
                }
                throw new Error(`Server error: ${response.statusText}`);
            }
            const data = await response.json();
            
            // If data is found and is not an empty object, success!
            if (data && Object.keys(data).length > 0) {
                console.log(`Grid data loaded from server on attempt ${i + 1}.`);
                return data;
            }

            // If data is empty, it might be the race condition. Wait and retry.
            console.warn(`Attempt ${i + 1}: Grid data not found, retrying after ${delay}ms...`);
            await new Promise(res => setTimeout(res, delay * (i + 1))); // increase delay each time

        } catch (error) {
            console.error('Could not fetch grid from DB:', error);
            alert('Could not connect to the server to load data.');
            return null; // Stop on network error
        }
    }
    // If all retries fail, return null
    return null;
}

async function saveGridToDB() {
    const token = localStorage.getItem('jwt_token');
    if (!token) return;
    try {
        await fetch(`${API_BASE_URL}/api/grid`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(categories),
        });
        console.log('Grid state saved to DB.');
    } catch (error) {
        console.error('Failed to save grid state:', error);
        alert('Failed to save changes. Check server connection.');
    }
}

// --- EVENT LISTENER SETUP ---
function setupEventListeners() {
    dom.userModeBtn?.addEventListener('click', () => setMode('user'));
    dom.editorModeBtn?.addEventListener('click', requestEditorMode);
    dom.closeEditorBtn?.addEventListener('click', closeEditor);
    dom.backBtn?.addEventListener('click', goBack);
    dom.addSymbolBtn?.addEventListener('click', () => openEditModal());
    dom.addCategoryBtn?.addEventListener('click', () => openEditModal(null, 'category'));
    dom.cancelPasswordBtn?.addEventListener('click', () => closeModal(dom.passwordModal));
    dom.confirmPasswordBtn?.addEventListener('click', checkPassword);
    dom.confirmAddSymbolBtn?.addEventListener('click', () => confirmEditItem('symbol'));
    dom.confirmAddCategoryBtn?.addEventListener('click', () => confirmEditItem('category'));
    dom.cancelAddSymbolBtn?.addEventListener('click', () => closeModal(dom.addSymbolModal));
    dom.cancelAddCategoryBtn?.addEventListener('click', () => closeModal(dom.addCategoryModal));
    dom.passwordInput?.addEventListener('keypress', e => { if (e.key === 'Enter') checkPassword(); });
    dom.searchIconBtn?.addEventListener('click', searchArasaacIcon);
    dom.searchCategoryIconBtn?.addEventListener('click', searchArasaacCategoryIcon);
    dom.passwordModal?.addEventListener('click', e => { if (e.target === dom.passwordModal) closeModal(dom.passwordModal); });
    dom.addSymbolModal?.addEventListener('click', e => { if (e.target === dom.addSymbolModal) closeModal(dom.addSymbolModal); });
    dom.addCategoryModal?.addEventListener('click', e => { if (e.target === dom.addCategoryModal) closeModal(dom.addCategoryModal); });
        // ADDED: Event listeners for parental control features
    dom.startSessionBtn?.addEventListener('click', openFullscreen);
    dom.endSessionBtn?.addEventListener('click', closeFullscreen);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    
    dom.categorySelectionModal?.addEventListener('click', e => { 
        if (e.target === dom.categorySelectionModal) {
            closeModal(dom.categorySelectionModal);
            clearContextMenuState();
        } 
    });
    dom.cancelCategorySelection.addEventListener('click', () => {
        closeModal(dom.categorySelectionModal)
        clearContextMenuState();
    });

    dom.cameraModal?.addEventListener('click', e => { if (e.target === dom.cameraModal) closeCamera(); });
    dom.symbolGrid.addEventListener('dragstart', handleDragStart);
    dom.symbolGrid.addEventListener('dragover', handleDragOver);
    dom.symbolGrid.addEventListener('dragleave', handleDragLeave);
    dom.symbolGrid.addEventListener('drop', handleDrop);
    dom.symbolGrid.addEventListener('dragend', handleDragEnd);

    dom.contextMenuEdit.addEventListener('click', (e) => {
        e.stopPropagation();
        handleContextMenuAction('edit');
    });

    dom.contextMenuCopy.addEventListener('click', (e) => {
        e.stopPropagation();
        handleContextMenuAction('copy');
    });
    dom.contextMenuMove.addEventListener('click', (e) => {
        e.stopPropagation();
        handleContextMenuAction('move');
    });
    dom.contextMenuToggleVisibility.addEventListener('click', (e) => {
        e.stopPropagation();
        handleContextMenuAction('toggleVisibility');
    });
    document.addEventListener('click', () => {
        hideContextMenu();
        clearContextMenuState();
    });

    dom.symbolUploadBtn?.addEventListener('click', () => dom.symbolCustomImageInput.click());
    dom.symbolCustomImageInput?.addEventListener('change', (e) => handleFileUpload(e, 'symbol'));
    dom.symbolTakePhotoBtn?.addEventListener('click', () => openCamera('symbol'));
    dom.categoryUploadBtn?.addEventListener('click', () => dom.categoryCustomImageInput.click());
    dom.categoryCustomImageInput?.addEventListener('change', (e) => handleFileUpload(e, 'category'));
    dom.categoryTakePhotoBtn?.addEventListener('click', () => openCamera('category'));
    dom.capturePhotoBtn?.addEventListener('click', capturePhoto);
    dom.cancelCamera?.addEventListener('click', closeCamera);
    if (dom.trashCanContainer) {
        dom.trashCanContainer.addEventListener('dragover', handleTrashDragOver);
        dom.trashCanContainer.addEventListener('dragleave', handleTrashDragLeave);
        dom.trashCanContainer.addEventListener('drop', handleTrashDrop);
    }
    dom.editSystemControlsBtn?.addEventListener('click', openSystemControlsEditor);
    dom.closeSystemControlsModal?.addEventListener('click', () => closeModal(dom.systemControlsModal));
    dom.systemControlsModal?.addEventListener('click', e => { if (e.target === dom.systemControlsModal) closeModal(dom.systemControlsModal); });
        // ADDED: Prompt user before leaving the page
    window.addEventListener('beforeunload', (e) => {
        // This will show a generic browser confirmation dialog.
        // Custom messages are no longer supported by modern browsers for security reasons.
        e.preventDefault();
        e.returnValue = '';
    });
    dom.logoutBtn?.addEventListener('click', handleLogout);
        // ADDED: Event listeners for the new tense buttons.
    dom.pastModeBtn?.addEventListener('click', () => setTense('passato'));
    dom.presentModeBtn?.addEventListener('click', () => setTense('presente'));
    dom.futureModeBtn?.addEventListener('click', () => setTense('futuro'));
    
    document.querySelectorAll('.size-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const size = btn.dataset.size;
            applySize(size);
            localStorage.setItem('pageSize', size);
        });
    });
    window.addEventListener('resize', adjustMainContainerPadding);
}

// --- DYNAMIC PADDING ADJUSTMENT ---
function adjustMainContainerPadding() {
    const mainContainer = document.querySelector('.main-container');
    if (window.innerWidth <= 768 && currentMode === 'editor') {
        const editorPanelHeight = dom.editorPanel.offsetHeight;
        mainContainer.style.paddingBottom = `${editorPanelHeight + 20}px`;
    } else {
        mainContainer.style.paddingBottom = '20px';
    }
}

// --- MODAL & UI MANAGEMENT ---
function showModal(modal) { modal?.classList.add('active'); }
function closeModal(modal) {
    modal?.classList.remove('active');
    if (modal === dom.passwordModal) {
        dom.passwordInput.value = '';
    }
    // Only reset the editing state when the main editing modals are closed.
    if (modal === dom.addSymbolModal) {
        resetSymbolModal();
        editingItemId = null; // Reset here
    }
    if (modal === dom.addCategoryModal) {
        resetCategoryModal();
        editingItemId = null; // And here
    }
}
function openFullscreen() {
  const elem = document.documentElement; // The entire page
  if (elem.requestFullscreen) {
    elem.requestFullscreen();
  } else if (elem.webkitRequestFullscreen) { /* Safari */
    elem.webkitRequestFullscreen();
  } else if (elem.msRequestFullscreen) { /* IE11 */
    elem.msRequestFullscreen();
  }
}

function closeFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.webkitExitFullscreen) { /* Safari */
    document.webkitExitFullscreen();
  } else if (document.msExitFullscreen) { /* IE11 */
    document.msExitFullscreen();
  }
}

function onFullscreenChange() {
    const isFullscreen = !!document.fullscreenElement;
    if (isFullscreen) {
        dom.startSessionBtn.style.display = 'none';
        dom.endSessionBtn.style.display = 'flex';
    } else {
        dom.startSessionBtn.style.display = 'flex';
        dom.endSessionBtn.style.display = 'none';
    }
}

function setTense(tense) {
    currentTense = tense;

    // Update button styles
    dom.pastModeBtn.classList.remove('active');
    dom.presentModeBtn.classList.remove('active');
    dom.futureModeBtn.classList.remove('active');

    if (tense === 'passato') {
        dom.pastModeBtn.classList.add('active');
    } else if (tense === 'presente') {
        dom.presentModeBtn.classList.add('active');
    } else if (tense === 'futuro') {
        dom.futureModeBtn.classList.add('active');
    }

    // Update the grid with the new tense
    updateGridForContext();
}

function resetSymbolModal() {
    dom.addSymbolModal.querySelector('#addSymbolModalTitle').textContent = 'Aggiungi Nuovo Simbolo';
    dom.symbolLabel.value = '';
    dom.symbolSpeak.value = '';
    dom.symbolSpeak.parentElement.style.display = 'block';
    dom.symbolType.value = 'nome'; // MODIFIED
    dom.symbolType.parentElement.style.display = 'block';
    dom.symbolIconQuery.value = '';
    dom.iconSearchResults.innerHTML = '';
    dom.symbolCustomImageInput.value = '';
    dom.symbolCustomImagePreview.innerHTML = '';
    if (selectedCustomSymbolIconUrl && selectedCustomSymbolIconUrl.startsWith('blob:')) URL.revokeObjectURL(selectedCustomSymbolIconUrl);
    selectedCustomSymbolIconUrl = null;
    selectedArasaacIconUrl = null;
    dom.symbolColor.value = '#FFADAD';
    if (symbolColorPicker) symbolColorPicker.color.hexString = '#FFADAD';
    dom.symbolPastelPresets?.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
    dom.symbolPastelPresets?.querySelector('.color-swatch')?.classList.add('selected');
    dom.confirmAddSymbolBtn.textContent = 'Aggiungi';
}
function resetCategoryModal() {
    dom.addCategoryModal.querySelector('#addCategoryModalTitle').textContent = 'Aggiungi Nuova Categoria';
    dom.categoryLabel.value = '';
    dom.categoryIconQuery.value = '';
    dom.categoryIconSearchResults.innerHTML = '';
    dom.categoryCustomImageInput.value = '';
    dom.categoryCustomImagePreview.innerHTML = '';
    if (selectedCustomCategoryIconUrl && selectedCustomCategoryIconUrl.startsWith('blob:')) URL.revokeObjectURL(selectedCustomCategoryIconUrl);
    selectedCustomCategoryIconUrl = null;
    selectedArasaacCategoryIconUrl = null;
    dom.categoryColor.value = '#FFADAD';
    if (categoryColorPicker) categoryColorPicker.color.hexString = '#FFADAD';
    dom.categoryPastelPresets?.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
    dom.categoryPastelPresets?.querySelector('.color-swatch')?.classList.add('selected');
    dom.confirmAddCategoryBtn.textContent = 'Aggiungi';
}
function setMode(mode) {
    currentMode = mode;
    document.body.classList.toggle('editor-mode-active', mode === 'editor');
    dom.userModeBtn?.classList.toggle('active', mode === 'user');
    dom.editorModeBtn?.classList.toggle('active', mode === 'editor');
    // FIX: Disable the editor button when editor mode is active
    if (dom.editorModeBtn) {
        dom.editorModeBtn.disabled = (mode === 'editor');
    }
    dom.editorPanel?.classList.toggle('active', mode === 'editor');
    dom.trashCanContainer?.classList.toggle('active', mode === 'editor');
    
    // Use a short timeout to ensure the panel is visible before calculating its height
    setTimeout(adjustMainContainerPadding, 50); 
    
    renderSymbols();
    renderSystemControls();
}

function applySize(size) {
    document.documentElement.classList.remove('size-small', 'size-medium', 'size-big');
    document.documentElement.classList.add(`size-${size}`);

    document.querySelectorAll('.size-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.size === size);
    });
    currentPageSize = size;
}

function loadSize() {
    const savedSize = localStorage.getItem('pageSize') || 'medium';
    applySize(savedSize);
}

// --- SYSTEM & SYMBOL RENDERING ---
function renderSystemControls() {
    if (!dom.textBarControls) return;
    dom.textBarControls.innerHTML = '';
    categories.systemControls?.forEach(control => {
        if(control.action === 'setTense') return;
        const btn = document.createElement('button');
        btn.className = 'control-btn';
        btn.title = control.label;
        btn.setAttribute('aria-label', control.label);
        btn.style.backgroundColor = control.color;
        btn.innerHTML = `<img src="${control.icon}" alt="" class="control-btn-icon"><span class="control-btn-label">${control.label}</span>`;
        const actionFunction = window[control.action];
        if (typeof actionFunction === 'function') btn.addEventListener('click', actionFunction);
        dom.textBarControls.appendChild(btn);
    });
}
function renderTenseButtons() {
    const tenseControls = categories.systemControls?.filter(control => control.action === 'setTense');
    if (!tenseControls) return;

    tenseControls.forEach(control => {
        let btn;
        if (control.text === 'passato') {
            btn = dom.pastModeBtn;
        } else if (control.text === 'presente') {
            btn = dom.presentModeBtn;
        } else if (control.text === 'futuro') {
            btn = dom.futureModeBtn;
        }

        if (btn) {
            btn.innerHTML = `<img src="${control.icon}" class="control-btn-icon" alt=""> <span class="control-btn-label">${control.label}</span>`;
            btn.style.backgroundColor = control.color;
        }
    });
}

function renderSymbols() {
    if (!dom.symbolGrid) return;
    const currentCategoryKey = getCurrentCategory();
    const isEditor = currentMode === 'editor';
    let items = categories[currentCategoryKey] || [];

    // In user mode, filter out hidden items
    if (!isEditor) {
        items = items.filter(item => item.isVisible);
    }

    dom.symbolGrid.innerHTML = '';
    items.forEach(item => dom.symbolGrid.appendChild(createSymbolCell(item)));
    // MODIFIED: Logic now depends on the navigation stack length.
    dom.navigation.style.display = navigationStack.length > 1 ? 'flex' : 'none';
    // MODIFIED: "Add Category" button is now always available in editor mode.
    dom.addCategoryBtn.style.display = isEditor ? 'flex' : 'none';
    dom.addSymbolBtn.style.display = isEditor ? 'flex' : 'none';

    if (navigationStack.length > 1) {
        if (dom.currentCategoryEl) dom.currentCategoryEl.textContent = getCategoryName(currentCategoryKey);
    }
}
function createSymbolCell(symbol) {
    const cell = document.createElement('div');
    cell.dataset.id = symbol.id;
    cell.draggable = (currentMode === 'editor');

    if (symbol.type === 'category') {
        cell.className = 'symbol-cell category';
        cell.innerHTML = `<div class="ffolder medium"><img src="${symbol.icon}" class="folder-icon" alt="${symbol.label}" onerror="this.src='https://placehold.co/53x53/ccc/fff?text=Error'"><span>${symbol.label}</span></div>`;
        const folderElement = cell.querySelector('.ffolder');
        if (folderElement && symbol.color) {
            folderElement.style.setProperty('--folder-bg', symbol.color);
            folderElement.style.setProperty('--folder-tab-bg', shadeColor(symbol.color, -15));
        }
        cell.addEventListener('click', () => { 
            if (!draggedItemId) navigateToCategory(symbol.target); 
        });
    } else {
        cell.className = 'symbol-cell symbol';
        if (symbol.color) cell.style.backgroundColor = symbol.color;
        cell.innerHTML = `<div class="symbol-icon"><img src="${symbol.icon}" alt="${symbol.label}" onerror="this.src='https://placehold.co/80x80/ccc/fff?text=Error'"></div><div class="symbol-label">${symbol.label}</div>`;
        cell.addEventListener('click', () => { if (currentMode === 'user') addSymbolToText(symbol); });
    }
    if (currentMode === 'editor' && !symbol.isVisible) {
        cell.classList.add('hidden-in-user-mode');
    }
    if (currentMode === 'editor') {
        cell.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation(); 
            showContextMenu(e, symbol.id);
        });
    }
    return cell;
}

// --- NAVIGATION & TEXT MANIPULATION ---
// MODIFIED: This function now pushes to the navigation stack.
function navigateToCategory(categoryName) { 
    navigationStack.push(categoryName);
    renderSymbols(); 
}
// MODIFIED: This function now pops from the navigation stack.
function goBack() { 
    if (navigationStack.length > 1) {
        navigationStack.pop();
    }
    renderSymbols(); 
}

// ADDED: New recursive helper to find a category by its target key anywhere in the data.
function findCategoryByTarget(targetKey) {
    if (targetKey === 'home') return { label: 'Pagina Principale' };
    for (const key in categories) {
        const category = categories[key].find(item => item.type === 'category' && item.target === targetKey);
        if (category) return category;
    }
    return null; // Not found
}

// MODIFIED: Uses the new recursive helper function.
function getCategoryName(key) { 
    const categoryInfo = findCategoryByTarget(key);
    return categoryInfo ? categoryInfo.label : 'Categoria'; 
}

function addSymbolToText(symbol) { textContent.push({ text: symbol.text, speak: symbol.speak, icon: symbol.icon }); updateTextDisplay(); if (symbol.symbol_type === 'nome' || symbol.symbol_type === 'altro') {updateGridForContext();} }
function updateTextDisplay() { if (dom.textContentEl) { dom.textContentEl.innerHTML = textContent.map(item => `<span class="text-bar-item"><img src="${item.icon}" alt="${item.text}" class="text-bar-symbol-icon"><span>${item.text}</span></span>`).join(' '); } }
function deleteLastWord() { if (textContent.length > 0) { textContent.pop(); updateTextDisplay(); updateGridForContext();} }
function deleteAllText() { textContent = []; updateTextDisplay(); updateGridForContext();}
async function speakText() { // Make the function async
    if (!textContent.length) return;

    const originalText = textContent.map(item => item.speak || item.text).join(' ');
    let textToSpeak = originalText;

    try {
        const token = localStorage.getItem('jwt_token');
        const response = await fetch(`${API_BASE_URL}/api/correct`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ sentence: originalText })
        });

        if (response.ok) {
            const data = await response.json();
            if (data.corrected_sentence) {
                textToSpeak = data.corrected_sentence;
            }
        } else {
            console.error('Failed to get corrected sentence from server, using original text.');
        }
    } catch (error) {
        console.error('Error calling correction API:', error);
        // Fallback to original text if API call fails
    }


    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = 'it-IT';
        utterance.rate = 0.9;
        speechSynthesis.speak(utterance);
    } else {
        alert('Sintesi vocale non supportata dal browser');
    }
}


// --- EDITOR MODE & PASSWORD ---
function requestEditorMode() { showModal(dom.passwordModal); dom.passwordInput?.focus(); }
async function checkPassword() {
    const password = dom.passwordInput?.value;
    if (!password) return;
    try {
        const token = localStorage.getItem('jwt_token');
        const response = await fetch(`${API_BASE_URL}/api/check-editor-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ password })
        });
        const data = await response.json();
        if (data.success) {
            setMode('editor');
            closeModal(dom.passwordModal);
        } else {
            alert('Password errata');
            dom.passwordInput.value = '';
        }
    } catch (error) {
        console.error('Error checking editor password:', error);
        alert('Si è verificato un errore di rete. Riprova.');
    }
}
function closeEditor() { setMode('user'); }

// --- ADD & EDIT ITEMS ---
function openEditModal(itemId = null, itemType = 'symbol') {
    editingItemId = itemId;
    const isEditing = itemId !== null;
    const item = isEditing ? findItemById(itemId)?.item : null;
    itemType = item ? item.type : itemType;

    const modal = itemType === 'category' ? dom.addCategoryModal : dom.addSymbolModal;
    
    resetSymbolModal();
    resetCategoryModal();

    if (itemType === 'category') {
        if (isEditing) {
            modal.querySelector('#addCategoryModalTitle').textContent = 'Modifica Categoria';
            dom.categoryLabel.value = item.label;
            selectedArasaacCategoryIconUrl = item.icon;
            updateImagePreview(dom.categoryCustomImagePreview, item.icon);
            dom.categoryIconSearchResults.innerHTML = `<img src="${item.icon}" alt="Icona corrente" class="icon-search-result selected">`;
            dom.categoryColor.value = item.color;
            if(categoryColorPicker) categoryColorPicker.color.hexString = item.color;
        }
        dom.confirmAddCategoryBtn.textContent = isEditing ? 'Salva Modifiche' : 'Aggiungi';
    } else { 
        if (isEditing) {
            modal.querySelector('#addSymbolModalTitle').textContent = item.type === 'system' ? 'Modifica Controllo' : 'Modifica Simbolo';
            dom.symbolLabel.value = item.label;
            
            dom.symbolSpeak.parentElement.style.display = item.type === 'system' ? 'none' : 'block';
            if(item.type !== 'system') {
                dom.symbolSpeak.value = item.speak || '';
                dom.symbolType.value = item.symbol_type || 'nome'; // MODIFIED
                dom.symbolType.parentElement.style.display = 'block';
            } else {
                dom.symbolType.parentElement.style.display = 'none';
            }
            
            selectedArasaacIconUrl = item.icon;
            updateImagePreview(dom.symbolCustomImagePreview, item.icon);
            dom.iconSearchResults.innerHTML = `<img src="${item.icon}" alt="Icona corrente" class="icon-search-result selected">`;
            dom.symbolColor.value = item.color;
            if(symbolColorPicker) symbolColorPicker.color.hexString = item.color;
        }
        dom.confirmAddSymbolBtn.textContent = isEditing ? 'Salva Modifiche' : 'Aggiungi';
    }
    showModal(modal);
}


// Add this new function anywhere in script.js
async function updateGridForContext() {
    const sentence = textContent.map(item => item.text).join(' ');

    // --- NEW: Collect ALL verbs from ALL categories ---
    const allVerbs = [];
    for (const key in categories) {
        if (Array.isArray(categories[key])) {
            categories[key].forEach(item => {
                // Find every item that is a verb and has its original form saved
                if (item.symbol_type === 'verbo' && originalSymbolForms[item.id]) {
                    allVerbs.push(item);
                }
            });
        }
    }

    // If the sentence is empty, revert all verbs globally.
    if (sentence.trim() === '') {
        let needsRender = false;
        allVerbs.forEach(verb => {
            const originalForm = originalSymbolForms[verb.id];
            if (originalForm && verb.label !== originalForm.label) {
                verb.label = originalForm.label;
                verb.speak = originalForm.speak;
                verb.text = originalForm.text;
                needsRender = true;
            }
        });
        // Only re-render if a change was actually made
        if (needsRender) renderSymbols();
        return;
    }

    if (allVerbs.length === 0) return; // Exit if there are no verbs anywhere
    
    const baseForms = allVerbs.map(verb => originalSymbolForms[verb.id].label);

    try {
        const token = localStorage.getItem('jwt_token');
        const response = await fetch(`${API_BASE_URL}/api/conjugate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ sentence, base_forms: baseForms, tense: currentTense })
        });

        if (!response.ok) throw new Error('AI request failed');

        const conjugations = await response.json();

        // Update ALL verbs across the entire application with the new conjugations
        allVerbs.forEach(verb => {
            const originalForm = originalSymbolForms[verb.id];
            const conjugatedResult = conjugations[originalForm.label];
            
            if (typeof conjugatedResult === 'string' && conjugatedResult) {
                verb.label = conjugatedResult;
                verb.speak = conjugatedResult;
                verb.text = conjugatedResult.toLowerCase();
            } else {
                // If anything goes wrong, revert the verb to its original state
                verb.label = originalForm.label;
                verb.speak = originalForm.speak;
                verb.text = originalForm.text;
            }
        });

        // Re-render the currently visible grid to show the changes
        renderSymbols();

    } catch (error) {
        console.error("Failed to update context:", error);
    }
}


async function confirmEditItem(itemType) {
    const isEditing = editingItemId !== null;
    const modal = itemType === 'category' ? dom.addCategoryModal : dom.addSymbolModal;
    const currentEditingId = editingItemId;
    const data = {};

    if (itemType === 'category') {
        data.label = dom.categoryLabel.value.trim();
        data.icon = selectedCustomCategoryIconUrl || selectedArasaacCategoryIconUrl;
        data.color = dom.categoryColor.value;
        if (!data.label || !data.icon) return alert("Nome e icona sono obbligatori.");
    } else { 
        data.label = dom.symbolLabel.value.trim();
        data.icon = selectedCustomSymbolIconUrl || selectedArasaacIconUrl;
        data.color = dom.symbolColor.value;
        const currentItem = isEditing ? findItemById(currentEditingId)?.item : null;
        if (currentItem?.type !== 'system') {
            data.speak = dom.symbolSpeak.value.trim() || data.label;
            data.text = data.label.toLowerCase();
            data.symbol_type = dom.symbolType.value; // MODIFIED
        }
        if (!data.label || !data.icon) return alert("Etichetta e icona sono obbligatorie.");
    }
    
    const authToken = localStorage.getItem('jwt_token');

    if (isEditing) {
        const itemToUpdateInfo = findItemById(currentEditingId);
        if (!itemToUpdateInfo) return alert("Error: Item to update not found.");

        const { item: itemToUpdate } = itemToUpdateInfo;
        const originalData = { ...itemToUpdate };

        Object.assign(itemToUpdate, data);

        if (itemToUpdate.type === 'symbol' && originalSymbolForms[currentEditingId]) {
            originalSymbolForms[currentEditingId] = {
                label: itemToUpdate.label,
                speak: itemToUpdate.speak,
                text: itemToUpdate.text,
                symbol_type: itemToUpdate.symbol_type
            };
        }

        if (itemToUpdate.type === 'system') {
            renderSystemControls();
            renderTenseButtons();
        } else {
            renderSymbols();
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/grid/item/${currentEditingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Server responded with an error.');
            const result = await response.json();
            if (result.updatedIcon && itemToUpdate.icon !== result.updatedIcon) {
                itemToUpdate.icon = result.updatedIcon;
                if (itemToUpdate.type === 'system') {
                    renderSystemControls();
                    renderTenseButtons();
                }
                else renderSymbols();
            }
            console.log('Item updated successfully.');
        } catch (error) {
            console.error('Failed to update item:', error);
            alert('Error updating item. Reverting changes.');
            Object.assign(itemToUpdate, originalData);
            if (itemToUpdate.type === 'system') {
                renderSystemControls();
                renderTenseButtons();
            }
            else renderSymbols();
        } finally {
            closeModal(modal);
        }

    } else {
        const newItem = { ...data, id: generateUniqueId(), isVisible: true };
        if (itemType === 'category') {
            newItem.type = 'category';
            newItem.target = newItem.label.toLowerCase().replace(/\s+/g, '-');
            if (categories[newItem.target]) return alert('A category with this name already exists.');
        } else {
            newItem.type = 'symbol';
        }

        const parentKey = getCurrentCategory();
        
        // Add the new item to its parent's array.
        if (!categories[parentKey]) categories[parentKey] = [];
        categories[parentKey].push(newItem);

        // If it's a new category, also create its own empty array for children.
        if (newItem.type === 'category') {
            categories[newItem.target] = [];
        }

        if (newItem.type === 'symbol') {
            originalSymbolForms[newItem.id] = {
                label: newItem.label,
                speak: newItem.speak,
                text: newItem.text, // Add this line
                symbol_type: newItem.symbol_type
            };
        }
        
        renderSymbols();

        try {
            const response = await fetch(`${API_BASE_URL}/api/grid/item`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
                body: JSON.stringify({ item: newItem, parentCategory: parentKey })
            });
            if (!response.ok) throw new Error('Server responded with an error.');
            const result = await response.json();
            if (result.icon && newItem.icon !== result.icon) {
                newItem.icon = result.icon;
                renderSymbols();
            }
            console.log('Item created successfully.');
        } catch (error) {
            console.error('Failed to create item:', error);
            alert('Error saving new item. Removing it from view.');
            categories[parentKey] = categories[parentKey].filter(i => i.id !== newItem.id);
            if (newItem.type === 'category') {
                delete categories[newItem.target];
            }
            renderSymbols();
        } finally {
            closeModal(modal);
        }
    }
}

function openSystemControlsEditor() {
    if (!dom.systemControlsList || !dom.systemControlsModal) return;

    dom.systemControlsList.innerHTML = '';
    categories.systemControls.forEach(control => {
        const div = document.createElement('div');
        div.className = 'system-control-item';
        div.innerHTML = `
            <img src="${control.icon}" style="background-color: ${control.color};">
            <span class="label">${control.label}</span>
            <button class="btn-primary">Modifica</button>
        `;
        div.querySelector('button').addEventListener('click', () => {
            closeModal(dom.systemControlsModal);
            openEditModal(control.id);
        });
        dom.systemControlsList.appendChild(div);
    });
    showModal(dom.systemControlsModal);
}

async function searchApi(query, container, callback) {
    if (!query) return alert('Per favore, inserisci un termine di ricerca.');
    container.innerHTML = '<i>Ricerca in corso...</i>';
    try {
        const response = await fetch(`https://api.arasaac.org/api/pictograms/it/search/${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        const data = await response.json();
        updateIconPicker(data, container, callback);
    } catch (error) {
        container.innerHTML = '<i>Errore nella ricerca. Riprova.</i>';
        console.error('Failed to fetch ARASAAC icons:', error);
    }
}
function searchArasaacIcon() { searchApi(dom.symbolIconQuery.value.trim(), dom.iconSearchResults, url => {
    selectedArasaacIconUrl = url;
    selectedCustomSymbolIconUrl = null;
    dom.symbolCustomImagePreview.innerHTML = '';
    updateImagePreview(dom.symbolCustomImagePreview, url);
});}
function searchArasaacCategoryIcon() { searchApi(dom.categoryIconQuery.value.trim(), dom.categoryIconSearchResults, url => {
    selectedArasaacCategoryIconUrl = url;
    selectedCustomCategoryIconUrl = null;
    dom.categoryCustomImagePreview.innerHTML = '';
    updateImagePreview(dom.categoryCustomImagePreview, url);
});}
function updateIconPicker(icons, container, selectCallback) {
    container.innerHTML = '';
    if (!icons.length) { container.innerHTML = '<i>Nessun risultato trovato.</i>'; return; }
    icons.slice(0, 10).forEach(icon => {
        const iconUrl = `https://api.arasaac.org/api/pictograms/${icon._id}`;
        const img = document.createElement('img');
        img.src = iconUrl; img.alt = icon.keywords[0]?.keyword || 'Icona'; img.className = 'icon-search-result';
        img.addEventListener('click', () => {
            selectCallback(iconUrl);
            container.querySelectorAll('.icon-search-result').forEach(el => el.classList.remove('selected'));
            img.classList.add('selected');
        });
        container.appendChild(img);
    });
}

// --- DRAG, DROP, CONTEXT MENU & OTHERS ---
function handleDragStart(e) {
    if (currentMode !== 'editor' || !e.target.closest('.symbol-cell')) return;
    draggedItemId = e.target.closest('.symbol-cell').dataset.id;
    e.dataTransfer.effectAllowed = 'move';
    dom.trashCanContainer?.classList.add('visible-for-drag');
    setTimeout(() => e.target.closest('.symbol-cell').classList.add('dragging'), 0);
}
function handleDragOver(e) { e.preventDefault();
    const target = e.target.closest('.symbol-cell');
    if (target && target.dataset.id !== draggedItemId) {
        document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
        target.classList.add('drag-over');
    }
}
function handleDragLeave(e) { if (!e.currentTarget.contains(e.relatedTarget)) document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));}

function handleDrop(e) {
    e.preventDefault();
    const targetCell = e.target.closest('.symbol-cell');
    
    document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));

    if (!targetCell || targetCell.dataset.id === draggedItemId) {
        return;
    }

    const draggedCell = dom.symbolGrid.querySelector(`.symbol-cell[data-id='${draggedItemId}']`);
    if (!draggedCell) {
        return; 
    }

    const arr = categories[getCurrentCategory()];
    const dragIdx = arr.findIndex(i => i.id === draggedItemId);
    const dropIdx = arr.findIndex(i => i.id === targetCell.dataset.id);

    if (dragIdx === -1 || dropIdx === -1) {
        return; 
    }

    const [draggedItem] = arr.splice(dragIdx, 1);
    arr.splice(dropIdx, 0, draggedItem);

    dom.symbolGrid.insertBefore(draggedCell, targetCell);

    saveGridToDB();
}

function handleDragEnd() {
    draggedItemId = null;
    document.querySelectorAll('.dragging, .drag-over').forEach(el => el.classList.remove('dragging', 'drag-over'));
    dom.trashCanContainer?.classList.remove('drag-over');
    dom.trashCanContainer?.classList.remove('visible-for-drag');
}
function handleTrashDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    dom.trashCanContainer.classList.add('drag-over');
}
function handleTrashDragLeave() {
    dom.trashCanContainer.classList.remove('drag-over');
}
async function handleTrashDrop(e) {
    e.preventDefault();
    if (!draggedItemId) return;
    const found = findItemById(draggedItemId);
    if (!found || found.item.type === 'system') return;
    
    const { item, parentKey } = found;
    const isCategory = item.type === 'category';
    let confirmationMessage = `Sei sicuro di voler eliminare in modo permanente "${item.label}"?`;
    if (isCategory) {
        confirmationMessage += "\n\nATTENZIONE: Verranno eliminati anche tutti i simboli contenuti in questa categoria.";
    }

    if (confirm(confirmationMessage)) {
        const originalParentItems = [...categories[parentKey]];
        const originalCategoryData = isCategory ? { ...categories[item.target] } : null;
        
        categories[parentKey] = categories[parentKey].filter(i => i.id !== draggedItemId);
        if (isCategory && categories[item.target]) {
            delete categories[item.target];
        }
        renderSymbols();

        try {
            const authToken = localStorage.getItem('jwt_token');
            const response = await fetch(`${API_BASE_URL}/api/grid/item/${draggedItemId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
                body: JSON.stringify({ categoryTarget: isCategory ? item.target : undefined })
            });
            if (!response.ok) throw new Error('Failed to delete on server.');
            console.log('Item deleted successfully from DB.');
        } catch (error) {
            console.error('Error deleting item:', error);
            alert('Could not delete the item from the server. Reverting changes.');
            categories[parentKey] = originalParentItems;
            if (isCategory) {
                categories[item.target] = originalCategoryData;
            }
            renderSymbols();
        }
    }
}
function showContextMenu(e, id) {
    hideContextMenu();
    clearContextMenuState();

    const found = findItemById(id);
    if (!found) return;

    if (found.item.type === 'system') {
        dom.contextMenuToggleVisibility.style.display = 'none';
        dom.contextMenuCopy.style.display = 'none';
        dom.contextMenuMove.style.display = 'none';
    } else {
        dom.contextMenuToggleVisibility.style.display = 'block';
        dom.contextMenuCopy.style.display = 'block';
        dom.contextMenuMove.style.display = 'block';
    }

    if(found.item.isHideable === false){
        dom.contextMenuToggleVisibility.style.display = 'none';
    }

    contextMenuSymbolId = id; 
    dom.symbolContextMenu.style.display = 'block';
    
    dom.symbolContextMenu.style.top = `${e.clientY}px`;
    dom.symbolContextMenu.style.left = `${e.clientX}px`;
}

function hideContextMenu() {
    if(dom.symbolContextMenu) dom.symbolContextMenu.style.display = 'none';
}

function clearContextMenuState() {
    contextMenuSymbolId = null;
    contextMenuAction = null;
}

function handleContextMenuAction(action) {
    if (!contextMenuSymbolId) return;

    hideContextMenu();

    if (action === 'edit') {
        openEditModal(contextMenuSymbolId);
        clearContextMenuState();
    } else if (action === 'toggleVisibility') {
        toggleItemVisibility(contextMenuSymbolId);
        clearContextMenuState();
    } else {
        contextMenuAction = action;
        populateCategorySelectionModal();
        showModal(dom.categorySelectionModal);
    }
}


// ADDED: Recursive helper to get a flat list of all categories for the move/copy modal.
function getAllCategories(parentKey = 'home', level = 0) {
    let allCats = [];
    const items = categories[parentKey] || [];
    items.forEach(item => {
        if (item.type === 'category') {
            allCats.push({ ...item, level: level });
            allCats = allCats.concat(getAllCategories(item.target, level + 1));
        }
    });
    return allCats;
}

// MODIFIED: This function now displays a nested list of all possible category destinations.
function populateCategorySelectionModal() {
    dom.categorySelectionList.innerHTML = '';
    const currentCategoryKey = getCurrentCategory();

    // Add "Main Page" (home) as an option if we are not already there.
    if (currentCategoryKey !== 'home') {
        const homeItem = document.createElement('div');
        homeItem.className = 'category-selection-item';
        homeItem.textContent = 'Pagina Principale';
        homeItem.addEventListener('click', () => executeCopyOrMove('home'));
        dom.categorySelectionList.appendChild(homeItem);
    }

    // Get all categories recursively and display them.
    const allCategories = getAllCategories();
    allCategories
        .filter(cat => cat.target !== currentCategoryKey) // Don't allow moving to the same category
        .forEach(cat => {
            const item = document.createElement('div');
            item.className = 'category-selection-item';
            // Indent nested categories for better readability
            item.style.paddingLeft = `${12 + (cat.level * 20)}px`;
            item.textContent = cat.label;
            item.addEventListener('click', () => executeCopyOrMove(cat.target));
            dom.categorySelectionList.appendChild(item);
        });
}

function executeCopyOrMove(targetKey) {
    const found = findItemById(contextMenuSymbolId);
    if (!found) {
        clearContextMenuState();
        return;
    }
    
    const itemToProcess = { ...found.item };
    if (contextMenuAction === 'copy') {
        itemToProcess.id = generateUniqueId();
        categories[targetKey].push(itemToProcess);
    } else if (contextMenuAction === 'move') {
        categories[found.parentKey] = categories[found.parentKey].filter(i => i.id !== contextMenuSymbolId);
        categories[targetKey].push(itemToProcess);
    }
    renderSymbols();
    closeModal(dom.categorySelectionModal);
    saveGridToDB();
    clearContextMenuState(); 
}

async function toggleItemVisibility(itemId) {
    const found = findItemById(itemId);
    if (!found || found.item.isHideable === false) return;

    const { item } = found;
    // Ensure isVisible property exists, default to true if not
    if (typeof item.isVisible !== 'boolean') {
        item.isVisible = true;
    }
    
    item.isVisible = !item.isVisible; // Toggle visibility

    renderSymbols(); // Re-render to apply visual changes immediately

    try {
        const authToken = localStorage.getItem('jwt_token');
        const response = await fetch(`${API_BASE_URL}/api/grid/item/${itemId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ isVisible: item.isVisible })
        });
        if (!response.ok) throw new Error('Failed to update visibility on server.');
        console.log(`Item ${itemId} visibility set to ${item.isVisible}`);
    } catch (error) {
        console.error('Error updating item visibility:', error);
        alert('Could not save visibility change. Reverting.');
        item.isVisible = !item.isVisible; // Revert on error
        renderSymbols();
    }
}

function handleFileUpload(e, type) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        const dataUrl = event.target.result;

        if (type === 'symbol') {
            selectedCustomSymbolIconUrl = dataUrl;
            updateImagePreview(dom.symbolCustomImagePreview, dataUrl);
            selectedArasaacIconUrl = null;
            dom.iconSearchResults.innerHTML = '';
        } else {
            selectedCustomCategoryIconUrl = dataUrl;
            updateImagePreview(dom.categoryCustomImagePreview, dataUrl);
            selectedArasaacCategoryIconUrl = null;
            dom.categoryIconSearchResults.innerHTML = '';
        }
    };
    reader.readAsDataURL(file);
}
async function openCamera(type) {
    cameraTarget = type;
    if (!('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices)) return alert('Accesso alla fotocamera non supportato.');
    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        dom.cameraView.srcObject = cameraStream;
        showModal(dom.cameraModal);
    } catch (err) { alert('Impossibile accedere alla fotocamera. Controlla i permessi.'); console.error("Camera Error:", err); }
}
function closeCamera() {
    if (cameraStream) cameraStream.getTracks().forEach(track => track.stop());
    closeModal(dom.cameraModal);
    dom.cameraView.srcObject = null; cameraStream = null; cameraTarget = null;
}
function capturePhoto() {
    const canvas = dom.cameraCanvas, video = dom.cameraView;
    if (!video.videoWidth) return;
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg');

    if (cameraTarget === 'symbol') {
        selectedCustomSymbolIconUrl = dataUrl;
        updateImagePreview(dom.symbolCustomImagePreview, dataUrl);
        selectedArasaacIconUrl = null;
        dom.iconSearchResults.innerHTML = '';
    } else {
        selectedCustomCategoryIconUrl = dataUrl;
        updateImagePreview(dom.categoryCustomImagePreview, dataUrl);
        selectedArasaacCategoryIconUrl = null;
        dom.categoryIconSearchResults.innerHTML = '';
    }

    closeCamera();
}

function dataURLtoFile(dataurl, filename) {
    let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--){ u8arr[n] = bstr.charCodeAt(n); }
    return new File([u8arr], filename, {type:mime});
}
function updateImagePreview(previewEl, url) { 
    if (url) {
        previewEl.innerHTML = `<img src="${url}" alt="Anteprima">`; 
    } else {
        previewEl.innerHTML = '';
    }
}
function setupColorPickers() {
    if (dom.symbolColorPickerContainer) {
        symbolColorPicker = new iro.ColorPicker(dom.symbolColorPickerContainer, { width: 150, color: '#FFADAD', borderWidth: 1, borderColor: '#fff' });
        setupColorPickerLogic(symbolColorPicker, dom.symbolColor, dom.symbolPastelPresets);
    }
    if (dom.categoryColorPickerContainer) {
        categoryColorPicker = new iro.ColorPicker(dom.categoryColorPickerContainer, { width: 150, color: '#FFADAD', borderWidth: 1, borderColor: '#fff' });
        setupColorPickerLogic(categoryColorPicker, dom.categoryColor, dom.categoryPastelPresets);
    }
}
function setupColorPickerLogic(picker, input, presets) {
    picker.on('color:change', c => { if (input) input.value = c.hexString; presets?.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected')); });
    const swatches = presets?.querySelectorAll('.color-swatch') || [];
    swatches.forEach(swatch => {
        swatch.style.backgroundColor = swatch.dataset.color;
        swatch.addEventListener('click', () => {
            const color = swatch.dataset.color;
            if (input) input.value = color;
            picker.color.hexString = color;
            swatches.forEach(s => s.classList.remove('selected'));
            swatch.classList.add('selected');
        });
    });
    if (swatches.length > 0) swatches[0].classList.add('selected');
}