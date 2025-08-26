// web-app-CAA/static/script/constants.js
// DOM element references and application constants

// --- Cached DOM Elements ---
const dom = {
    textBar: null,
    textContentEl: null,
    textBarControls: null,
    userModeBtn: null,
    editorModeBtn: null,
    symbolGrid: null,
    navigation: null,
    backBtn: null,
    currentCategoryEl: null,
    editorPanel: null,
    passwordModal: null,
    addSymbolModal: null,
    addCategoryModal: null,
    closeEditorBtn: null,
    addSymbolBtn: null,
    addCategoryBtn: null,
    cancelPasswordBtn: null,
    confirmPasswordBtn: null,
    cancelAddSymbolBtn: null,
    confirmAddSymbolBtn: null,
    cancelAddCategoryBtn: null,
    confirmAddCategoryBtn: null,
    searchIconBtn: null,
    searchCategoryIconBtn: null,
    passwordInput: null,
    symbolLabel: null,
    symbolSpeak: null,
    symbolIconQuery: null,
    iconSearchResults: null,
    symbolColor: null,
    symbolColorPickerContainer: null,
    symbolPastelPresets: null,
    categoryLabel: null,
    categoryIconQuery: null,
    categoryIconSearchResults: null,
    categoryColor: null,
    categoryColorPickerContainer: null,
    categoryPastelPresets: null,
    symbolContextMenu: null,
    contextMenuEdit: null,
    contextMenuCopy: null,
    contextMenuMove: null,
    contextMenuToggleVisibility: null,
    categorySelectionModal: null,
    categorySelectionList: null,
    cancelCategorySelection: null,
    symbolCustomImageInput: null,
    symbolUploadBtn: null,
    symbolTakePhotoBtn: null,
    symbolCustomImagePreview: null,
    categoryCustomImageInput: null,
    categoryUploadBtn: null,
    categoryTakePhotoBtn: null,
    categoryCustomImagePreview: null,
    cameraModal: null,
    cameraView: null,
    cameraCanvas: null,
    capturePhotoBtn: null,
    cancelCamera: null,
    trashCanContainer: null,
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

// Initialize DOM elements
function initializeDOMElements() {
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
    dom.closeEditorBtn = document.getElementById('closeEditorBtn');
    dom.addSymbolBtn = document.getElementById('addSymbolBtn');
    dom.addCategoryBtn = document.getElementById('addCategoryBtn');
    dom.cancelPasswordBtn = document.getElementById('cancelPasswordBtn');
    dom.confirmPasswordBtn = document.getElementById('confirmPasswordBtn');
    dom.cancelAddSymbolBtn = document.getElementById('cancelAddSymbolBtn');
    dom.confirmAddSymbolBtn = document.getElementById('confirmAddSymbolBtn');
    dom.cancelAddCategoryBtn = document.getElementById('cancelAddCategoryBtn');
    dom.confirmAddCategoryBtn = document.getElementById('confirmAddCategoryBtn');
    dom.searchIconBtn = document.getElementById('searchIconBtn');
    dom.searchCategoryIconBtn = document.getElementById('searchCategoryIconBtn');
    dom.passwordInput = document.getElementById('passwordInput');
    dom.symbolLabel = document.getElementById('symbolLabel');
    dom.symbolSpeak = document.getElementById('symbolSpeak');
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
    dom.startSessionBtn = document.getElementById('startSessionBtn');
    dom.endSessionBtn = document.getElementById('endSessionBtn');
    dom.usernameDisplay = document.getElementById('usernameDisplay');
    dom.logoutBtn = document.getElementById('logoutBtn');
    dom.pastModeBtn = document.getElementById('pastModeBtn');
    dom.presentModeBtn = document.getElementById('presentModeBtn');
    dom.futureModeBtn = document.getElementById('futureModeBtn');
    dom.symbolType = document.getElementById('symbolType');
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.dom = dom;
    window.initializeDOMElements = initializeDOMElements;
}
