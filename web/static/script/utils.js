// web-app-CAA/static/script/utils.js
// Utility functions

// --- HELPER FUNCTIONS ---
function findItemById(id) {
    const categories = getCategories();
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
    let R = parseInt(color.substring(1, 3), 16);
    let G = parseInt(color.substring(3, 5), 16);
    let B = parseInt(color.substring(5, 7), 16);
    
    R = parseInt(R * (100 + percent) / 100);
    G = parseInt(G * (100 + percent) / 100);
    B = parseInt(B * (100 + percent) / 100);
    
    R = (R < 255) ? R : 255;
    G = (G < 255) ? G : 255;
    B = (B < 255) ? B : 255;
    
    const RR = ((R.toString(16).length == 1) ? "0" + R.toString(16) : R.toString(16));
    const GG = ((G.toString(16).length == 1) ? "0" + G.toString(16) : G.toString(16));
    const BB = ((B.toString(16).length == 1) ? "0" + B.toString(16) : B.toString(16));
    
    return "#" + RR + GG + BB;
}

function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Recursive helper to find a category by its target key anywhere in the data
function findCategoryByTarget(targetKey) {
    const categories = getCategories();
    for (const parentKey in categories) {
        for (const item of categories[parentKey]) {
            if (item.type === 'category' && item.target === targetKey) {
                return { item, parentKey };
            }
        }
    }
    return null;
}

// Uses the recursive helper function
function getCategoryName(key) {
    if (key === 'home') return 'Home';
    const found = findCategoryByTarget(key);
    return found ? found.item.label : key;
}

// Recursive helper to get a flat list of all categories for the move/copy modal
function getAllCategories(parentKey = 'home', level = 0) {
    let result = [];
    const categories = getCategories();
    
    if (categories[parentKey]) {
        categories[parentKey].forEach(item => {
            if (item.type === 'category') {
                result.push({
                    key: item.target,
                    name: item.label,
                    level: level
                });
                // Recursively get subcategories
                result = result.concat(getAllCategories(item.target, level + 1));
            }
        });
    }
    
    return result;
}

// Convert data URL to File object
function dataURLtoFile(dataurl, filename) {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
}

// Update image preview element
function updateImagePreview(previewEl, url) {
    if (previewEl) {
        if (url) {
            previewEl.src = url;
            previewEl.style.display = 'block';
        } else {
            previewEl.style.display = 'none';
        }
    }
}

// Debounce function for search operations
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Check if element is in viewport
function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

// Scroll element into view smoothly
function scrollIntoView(element) {
    if (element && !isInViewport(element)) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'nearest'
        });
    }
}

// Format error messages for user display
function formatErrorMessage(error, defaultMessage = 'Si è verificato un errore.') {
    if (typeof error === 'string') {
        return error;
    }
    if (error.message) {
        return error.message;
    }
    return defaultMessage;
}

// Deep clone object
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    if (obj instanceof Date) {
        return new Date(obj.getTime());
    }
    if (obj instanceof Array) {
        return obj.map(item => deepClone(item));
    }
    if (typeof obj === 'object') {
        const clonedObj = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                clonedObj[key] = deepClone(obj[key]);
            }
        }
        return clonedObj;
    }
}

// Export functions for use in other modules
if (typeof window !== 'undefined') {
    window.findItemById = findItemById;
    window.shadeColor = shadeColor;
    window.generateUniqueId = generateUniqueId;
    window.findCategoryByTarget = findCategoryByTarget;
    window.getCategoryName = getCategoryName;
    window.getAllCategories = getAllCategories;
    window.dataURLtoFile = dataURLtoFile;
    window.updateImagePreview = updateImagePreview;
    window.debounce = debounce;
    window.isInViewport = isInViewport;
    window.scrollIntoView = scrollIntoView;
    window.formatErrorMessage = formatErrorMessage;
    window.deepClone = deepClone;
}
