// web-app-CAA/static/script/state.js
// Application state management

// --- Application State ---
let currentMode = 'user';
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
let originalSymbolForms = {};

// State management functions
function getCurrentMode() {
    return currentMode;
}

function setCurrentMode(mode) {
    currentMode = mode;
}

function getCurrentCategory() {
    return navigationStack[navigationStack.length - 1];
}

function getNavigationStack() {
    return navigationStack;
}

function pushToNavigationStack(category) {
    navigationStack.push(category);
}

function popFromNavigationStack() {
    if (navigationStack.length > 1) {
        return navigationStack.pop();
    }
    return navigationStack[0];
}

function getTextContent() {
    return textContent;
}

function addToTextContent(symbol) {
    textContent.push(symbol);
}

function clearTextContent() {
    textContent = [];
}

function removeLastFromTextContent() {
    return textContent.pop();
}

function getCurrentTense() {
    return currentTense;
}

function setCurrentTense(tense) {
    currentTense = tense;
}

function getCurrentPageSize() {
    return currentPageSize;
}

function setCurrentPageSize(size) {
    currentPageSize = size;
}

function getCategories() {
    return categories;
}

function setCategories(newCategories) {
    categories = newCategories;
}

function getCategoryData(key) {
    return categories[key] || [];
}

function setCategoryData(key, data) {
    categories[key] = data;
}

function getDraggedItemId() {
    return draggedItemId;
}

function setDraggedItemId(id) {
    draggedItemId = id;
}

function getEditingItemId() {
    return editingItemId;
}

function setEditingItemId(id) {
    editingItemId = id;
}

function getContextMenuState() {
    return {
        symbolId: contextMenuSymbolId,
        action: contextMenuAction
    };
}

function setContextMenuState(symbolId, action) {
    contextMenuSymbolId = symbolId;
    contextMenuAction = action;
}

function clearContextMenuState() {
    contextMenuSymbolId = null;
    contextMenuAction = null;
}

function getCameraState() {
    return {
        stream: cameraStream,
        target: cameraTarget
    };
}

function setCameraStream(stream) {
    cameraStream = stream;
}

function setCameraTarget(target) {
    cameraTarget = target;
}

function clearCameraState() {
    cameraStream = null;
    cameraTarget = null;
}

function getSelectedIconUrls() {
    return {
        arasaacIcon: selectedArasaacIconUrl,
        arasaacCategoryIcon: selectedArasaacCategoryIconUrl,
        customSymbolIcon: selectedCustomSymbolIconUrl,
        customCategoryIcon: selectedCustomCategoryIconUrl
    };
}

function setSelectedArasaacIconUrl(url) {
    selectedArasaacIconUrl = url;
}

function setSelectedArasaacCategoryIconUrl(url) {
    selectedArasaacCategoryIconUrl = url;
}

function setSelectedCustomSymbolIconUrl(url) {
    selectedCustomSymbolIconUrl = url;
}

function setSelectedCustomCategoryIconUrl(url) {
    selectedCustomCategoryIconUrl = url;
}

function clearSelectedIconUrls() {
    selectedArasaacIconUrl = null;
    selectedArasaacCategoryIconUrl = null;
    selectedCustomSymbolIconUrl = null;
    selectedCustomCategoryIconUrl = null;
}

function getColorPickers() {
    return {
        symbol: symbolColorPicker,
        category: categoryColorPicker
    };
}

function setSymbolColorPicker(picker) {
    symbolColorPicker = picker;
}

function setCategoryColorPicker(picker) {
    categoryColorPicker = picker;
}

function getOriginalSymbolForms() {
    return originalSymbolForms;
}

function setOriginalSymbolForm(id, form) {
    originalSymbolForms[id] = form;
}

// Export functions for use in other modules
if (typeof window !== 'undefined') {
    // Mode functions
    window.getCurrentMode = getCurrentMode;
    window.setCurrentMode = setCurrentMode;
    
    // Navigation functions
    window.getCurrentCategory = getCurrentCategory;
    window.getNavigationStack = getNavigationStack;
    window.pushToNavigationStack = pushToNavigationStack;
    window.popFromNavigationStack = popFromNavigationStack;
    
    // Text content functions
    window.getTextContent = getTextContent;
    window.addToTextContent = addToTextContent;
    window.clearTextContent = clearTextContent;
    window.removeLastFromTextContent = removeLastFromTextContent;
    
    // Tense functions
    window.getCurrentTense = getCurrentTense;
    window.setCurrentTense = setCurrentTense;
    
    // Size functions
    window.getCurrentPageSize = getCurrentPageSize;
    window.setCurrentPageSize = setCurrentPageSize;
    
    // Categories functions
    window.getCategories = getCategories;
    window.setCategories = setCategories;
    window.getCategoryData = getCategoryData;
    window.setCategoryData = setCategoryData;
    
    // Drag state functions
    window.getDraggedItemId = getDraggedItemId;
    window.setDraggedItemId = setDraggedItemId;
    
    // Edit state functions
    window.getEditingItemId = getEditingItemId;
    window.setEditingItemId = setEditingItemId;
    
    // Context menu functions
    window.getContextMenuState = getContextMenuState;
    window.setContextMenuState = setContextMenuState;
    window.clearContextMenuState = clearContextMenuState;
    
    // Camera state functions
    window.getCameraState = getCameraState;
    window.setCameraStream = setCameraStream;
    window.setCameraTarget = setCameraTarget;
    window.clearCameraState = clearCameraState;
    
    // Icon selection functions
    window.getSelectedIconUrls = getSelectedIconUrls;
    window.setSelectedArasaacIconUrl = setSelectedArasaacIconUrl;
    window.setSelectedArasaacCategoryIconUrl = setSelectedArasaacCategoryIconUrl;
    window.setSelectedCustomSymbolIconUrl = setSelectedCustomSymbolIconUrl;
    window.setSelectedCustomCategoryIconUrl = setSelectedCustomCategoryIconUrl;
    window.clearSelectedIconUrls = clearSelectedIconUrls;
    
    // Color picker functions
    window.getColorPickers = getColorPickers;
    window.setSymbolColorPicker = setSymbolColorPicker;
    window.setCategoryColorPicker = setCategoryColorPicker;
    
    // Original forms functions
    window.getOriginalSymbolForms = getOriginalSymbolForms;
    window.setOriginalSymbolForm = setOriginalSymbolForm;
}
