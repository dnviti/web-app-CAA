// web-app-CAA/static/script/api.js
// API communication functions

// --- DATABASE COMMUNICATION ---
async function loadGridFromDB(retries = 3, delay = 200) {
    const token = localStorage.getItem('jwt_token');
    if (!token) return null;
    
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/grid`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.removeItem('jwt_token');
                    window.location.href = '/login';
                    return null;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Grid data loaded from DB.');
            return data;
        } catch (error) {
            console.error(`Attempt ${i + 1} failed:`, error);
            if (i < retries - 1) {
                console.log(`Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2; // Exponential backoff
            } else {
                console.error('All retry attempts failed.');
                alert('Failed to load grid data. Check server connection.');
                return null;
            }
        }
    }
}

async function saveGridToDB() {
    const token = localStorage.getItem('jwt_token');
    if (!token) return;
    
    try {
        const categories = getCategories();
        const response = await fetch(`${API_BASE_URL}/api/grid`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(categories),
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        console.log('Grid state saved to DB.');
    } catch (error) {
        console.error('Failed to save grid state:', error);
        alert('Failed to save changes. Check server connection.');
    }
}

async function searchArasaacAPI(query) {
    if (!query || query.trim().length === 0) {
        return [];
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/ai/search-arasaac?query=${encodeURIComponent(query)}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data.icons || [];
    } catch (error) {
        console.error('Failed to search ARASAAC API:', error);
        return [];
    }
}

async function deleteItemFromDB(itemId, categoryTarget = null) {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
        throw new Error('No authentication token');
    }
    
    const body = categoryTarget ? { categoryTarget } : {};
    
    const response = await fetch(`${API_BASE_URL}/api/grid/item/${itemId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
    });
    
    if (!response.ok) {
        throw new Error(`Failed to delete item: ${response.status}`);
    }
    
    return response.json();
}

async function updateItemVisibility(itemId, isVisible) {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
        throw new Error('No authentication token');
    }
    
    const response = await fetch(`${API_BASE_URL}/api/grid/item/${itemId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ visible: isVisible })
    });
    
    if (!response.ok) {
        throw new Error(`Failed to update item visibility: ${response.status}`);
    }
    
    return response.json();
}

async function completeUserSetup() {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
        throw new Error('No authentication token');
    }
    
    const response = await fetch(`${API_BASE_URL}/api/complete-setup`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) {
        throw new Error(`Failed to complete setup: ${response.status}`);
    }
    
    return response.json();
}

async function validateEditorPassword(password) {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
        throw new Error('No authentication token');
    }
    
    const response = await fetch(`${API_BASE_URL}/api/validate-editor-password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password })
    });
    
    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('Password non valida');
        }
        throw new Error(`Validation failed: ${response.status}`);
    }
    
    return response.json();
}

async function uploadCustomImage(file) {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
        throw new Error('No authentication token');
    }
    
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await fetch(`${API_BASE_URL}/api/upload-image`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    });
    
    if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
    }
    
    return response.json();
}

// Export functions for use in other modules
if (typeof window !== 'undefined') {
    window.loadGridFromDB = loadGridFromDB;
    window.saveGridToDB = saveGridToDB;
    window.searchArasaacAPI = searchArasaacAPI;
    window.deleteItemFromDB = deleteItemFromDB;
    window.updateItemVisibility = updateItemVisibility;
    window.completeUserSetup = completeUserSetup;
    window.validateEditorPassword = validateEditorPassword;
    window.uploadCustomImage = uploadCustomImage;
}
