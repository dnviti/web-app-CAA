// web-app-CAA/static/script/ui-components.js
// UI component creation and manipulation

// --- SYSTEM & SYMBOL RENDERING ---
function renderSystemControls() {
    if (!dom.textBarControls) return;
    
    dom.textBarControls.innerHTML = '';
    const categories = getCategories();
    const systemControls = categories.systemControls || [];
    
    systemControls.forEach(control => {
        if (control.action === 'setTense') return;
        
        const btn = document.createElement('button');
        btn.className = 'control-btn';
        btn.title = control.label;
        btn.setAttribute('aria-label', control.label);
        btn.style.backgroundColor = control.color;
        btn.innerHTML = `<img src="${control.icon}" alt="" class="control-btn-icon"><span class="control-btn-label">${control.label}</span>`;
        
        const actionFunction = window[control.action];
        if (typeof actionFunction === 'function') {
            btn.addEventListener('click', actionFunction);
        }
        
        dom.textBarControls.appendChild(btn);
    });
}

function renderTenseButtons() {
    const tenseButtons = document.querySelectorAll('.tense-btn');
    tenseButtons.forEach(btn => btn.classList.remove('active'));
    
    const currentTense = getCurrentTense();
    const activeBtn = document.querySelector(`.tense-btn[data-tense="${currentTense}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
}

function renderSymbols() {
    if (!dom.symbolGrid) return;
    
    dom.symbolGrid.innerHTML = '';
    const currentCategory = getCurrentCategory();
    const categories = getCategories();
    const items = categories[currentCategory] || [];
    
    // Render the current category indicator
    if (dom.currentCategoryEl) {
        dom.currentCategoryEl.textContent = getCategoryName(currentCategory);
    }
    
    // Show/hide back button based on navigation stack
    const navigationStack = getNavigationStack();
    if (dom.backBtn) {
        dom.backBtn.style.display = navigationStack.length > 1 ? 'inline-block' : 'none';
    }
    
    items.forEach(item => {
        const cell = createSymbolCell(item);
        dom.symbolGrid.appendChild(cell);
    });
    
    renderSystemControls();
    renderTenseButtons();
}

function createSymbolCell(symbol) {
    const cell = document.createElement('div');
    cell.dataset.id = symbol.id;
    cell.draggable = (getCurrentMode() === 'editor');
    
    if (symbol.type === 'category') {
        cell.className = 'symbol-cell category';
        cell.innerHTML = `<div class="ffolder ${getCurrentPageSize()}"><img src="${symbol.icon}" class="folder-icon" alt="${symbol.label}" onerror="this.src='https://placehold.co/53x53/ccc/fff?text=Error'"><span>${symbol.label}</span></div>`;
        
        const folderElement = cell.querySelector('.ffolder');
        if (folderElement && symbol.color) {
            folderElement.style.setProperty('--folder-bg', symbol.color);
            folderElement.style.setProperty('--folder-tab-bg', shadeColor(symbol.color, -15));
        }
        
        cell.addEventListener('click', () => {
            if (!getDraggedItemId()) {
                navigateToCategory(symbol.target);
            }
        });
    } else {
        cell.className = 'symbol-cell symbol';
        if (symbol.color) {
            cell.style.backgroundColor = symbol.color;
        }
        
        const currentPageSize = getCurrentPageSize();
        cell.innerHTML = `<div class="symbol-content ${currentPageSize}"><img src="${symbol.icon}" alt="${symbol.label}" onerror="this.src='https://placehold.co/53x53/ccc/fff?text=Error'"><span>${symbol.label}</span></div>`;
        
        if (getCurrentMode() === 'user') {
            cell.addEventListener('click', () => addSymbolToText(symbol));
        }
    }
    
    // Add context menu for editor mode
    if (getCurrentMode() === 'editor') {
        cell.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            showContextMenu(e, symbol.id);
        });
    }
    
    // Add visibility indicator if hidden
    if (symbol.visible === false && getCurrentMode() === 'editor') {
        cell.classList.add('hidden-symbol');
        const hiddenIndicator = document.createElement('div');
        hiddenIndicator.className = 'hidden-indicator';
        hiddenIndicator.innerHTML = '👁️‍🗨️';
        hiddenIndicator.title = 'Elemento nascosto';
        cell.appendChild(hiddenIndicator);
    }
    
    return cell;
}

function updateTextDisplay() {
    if (!dom.textContentEl) return;
    
    const textContent = getTextContent();
    dom.textContentEl.innerHTML = '';
    
    textContent.forEach((symbol, index) => {
        const symbolDiv = document.createElement('div');
        symbolDiv.className = 'text-symbol';
        symbolDiv.innerHTML = `
            <img src="${symbol.icon}" alt="${symbol.label}" onerror="this.src='https://placehold.co/30x30/ccc/fff?text=?'">
            <span>${symbol.label}</span>
        `;
        
        // Add click handler to remove symbol
        symbolDiv.addEventListener('click', () => {
            const textContent = getTextContent();
            textContent.splice(index, 1);
            updateTextDisplay();
        });
        
        dom.textContentEl.appendChild(symbolDiv);
    });
}

function createIconSearchResult(icon, callback) {
    const img = document.createElement('img');
    img.src = icon.url || `https://api.arasaac.org/api/pictograms/${icon.id}`;
    img.alt = icon.keywords ? icon.keywords.join(', ') : icon.text || 'Icona';
    img.className = 'icon-search-result';
    
    img.addEventListener('click', () => {
        // Remove previous selections
        const container = img.parentElement;
        container.querySelectorAll('.icon-search-result').forEach(el => el.classList.remove('selected'));
        
        // Mark this as selected
        img.classList.add('selected');
        
        // Call the callback with the icon data
        if (callback) {
            callback(icon);
        }
    });
    
    return img;
}

function updateIconPicker(icons, container, callback) {
    if (!container) return;
    
    container.innerHTML = '';
    
    icons.forEach(icon => {
        const iconElement = createIconSearchResult(icon, callback);
        container.appendChild(iconElement);
    });
}

function createCategorySelectionItem(categoryData) {
    const div = document.createElement('div');
    div.className = 'category-selection-item';
    div.style.paddingLeft = `${categoryData.level * 20}px`;
    div.innerHTML = `
        <span class="category-name">${categoryData.name}</span>
        <span class="category-level-indicator">${'→'.repeat(categoryData.level)}</span>
    `;
    
    div.addEventListener('click', () => {
        executeCopyOrMove(categoryData.key);
    });
    
    return div;
}

function populateCategorySelectionModal() {
    if (!dom.categorySelectionList) return;
    
    dom.categorySelectionList.innerHTML = '';
    
    // Add home category
    const homeItem = document.createElement('div');
    homeItem.className = 'category-selection-item';
    homeItem.innerHTML = '<span class="category-name">Home</span>';
    homeItem.addEventListener('click', () => executeCopyOrMove('home'));
    dom.categorySelectionList.appendChild(homeItem);
    
    // Add all other categories
    const allCategories = getAllCategories();
    allCategories.forEach(categoryData => {
        const categoryItem = createCategorySelectionItem(categoryData);
        dom.categorySelectionList.appendChild(categoryItem);
    });
}

function createSystemControlItem(control) {
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
    
    return div;
}

function adjustMainContainerPadding() {
    const mainContainer = document.querySelector('.main-container');
    if (!mainContainer) return;
    
    if (window.innerWidth <= 768 && getCurrentMode() === 'editor') {
        const editorPanelHeight = dom.editorPanel.offsetHeight;
        mainContainer.style.paddingBottom = `${editorPanelHeight + 20}px`;
    } else {
        mainContainer.style.paddingBottom = '20px';
    }
}

function applySize(size) {
    setCurrentPageSize(size);
    
    const elements = document.querySelectorAll('.symbol-content, .ffolder');
    elements.forEach(el => {
        el.classList.remove('small', 'medium', 'large');
        el.classList.add(size);
    });
    
    localStorage.setItem('pageSize', size);
    renderSymbols();
}

function loadSize() {
    const savedSize = localStorage.getItem('pageSize') || 'medium';
    setCurrentPageSize(savedSize);
    applySize(savedSize);
}

// Display user information
function displayUserInfo() {
    const decodedToken = getDecodedToken(); // Assumes getDecodedToken is in checkAuth.js
    if (decodedToken && dom.usernameDisplay) {
        dom.usernameDisplay.textContent = decodedToken.username || 'Utente';
    }
}

// Export functions for use in other modules
if (typeof window !== 'undefined') {
    window.renderSystemControls = renderSystemControls;
    window.renderTenseButtons = renderTenseButtons;
    window.renderSymbols = renderSymbols;
    window.createSymbolCell = createSymbolCell;
    window.updateTextDisplay = updateTextDisplay;
    window.createIconSearchResult = createIconSearchResult;
    window.updateIconPicker = updateIconPicker;
    window.createCategorySelectionItem = createCategorySelectionItem;
    window.populateCategorySelectionModal = populateCategorySelectionModal;
    window.createSystemControlItem = createSystemControlItem;
    window.adjustMainContainerPadding = adjustMainContainerPadding;
    window.applySize = applySize;
    window.loadSize = loadSize;
    window.displayUserInfo = displayUserInfo;
}
