// web-app-CAA/static/script/camera.js
// Camera functionality

async function openCamera(type) {
    setCameraTarget(type);
    
    if (!('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices)) {
        alert('Accesso alla fotocamera non supportato.');
        return;
    }
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" }
        });
        
        setCameraStream(stream);
        
        if (dom.cameraView) {
            dom.cameraView.srcObject = stream;
        }
        
        showModal(dom.cameraModal);
    } catch (err) {
        alert('Impossibile accedere alla fotocamera. Controlla i permessi.');
        console.error("Camera Error:", err);
    }
}

function closeCamera() {
    const cameraState = getCameraState();
    
    if (cameraState.stream) {
        cameraState.stream.getTracks().forEach(track => track.stop());
    }
    
    closeModal(dom.cameraModal);
    
    if (dom.cameraView) {
        dom.cameraView.srcObject = null;
    }
    
    clearCameraState();
}

function capturePhoto() {
    const canvas = dom.cameraCanvas;
    const video = dom.cameraView;
    
    if (!video || !canvas || !video.videoWidth) return;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw the video frame to canvas
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to data URL
    const dataUrl = canvas.toDataURL('image/jpeg');
    
    const cameraState = getCameraState();
    
    if (cameraState.target === 'symbol') {
        setSelectedCustomSymbolIconUrl(dataUrl);
        updateImagePreview(dom.symbolCustomImagePreview, dataUrl);
        setSelectedArasaacIconUrl(null);
        
        if (dom.iconSearchResults) {
            dom.iconSearchResults.innerHTML = '';
        }
    } else if (cameraState.target === 'category') {
        setSelectedCustomCategoryIconUrl(dataUrl);
        updateImagePreview(dom.categoryCustomImagePreview, dataUrl);
        setSelectedArasaacCategoryIconUrl(null);
        
        if (dom.categoryIconSearchResults) {
            dom.categoryIconSearchResults.innerHTML = '';
        }
    }
    
    closeCamera();
}

function handleFileUpload(e, type) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        alert('Per favore seleziona un file immagine valido.');
        return;
    }
    
    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
        alert('Il file è troppo grande. La dimensione massima consentita è 5MB.');
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (event) => {
        const dataUrl = event.target.result;
        
        if (type === 'symbol') {
            setSelectedCustomSymbolIconUrl(dataUrl);
            updateImagePreview(dom.symbolCustomImagePreview, dataUrl);
            setSelectedArasaacIconUrl(null);
            
            if (dom.iconSearchResults) {
                dom.iconSearchResults.innerHTML = '';
            }
        } else if (type === 'category') {
            setSelectedCustomCategoryIconUrl(dataUrl);
            updateImagePreview(dom.categoryCustomImagePreview, dataUrl);
            setSelectedArasaacCategoryIconUrl(null);
            
            if (dom.categoryIconSearchResults) {
                dom.categoryIconSearchResults.innerHTML = '';
            }
        }
    };
    
    reader.onerror = () => {
        alert('Errore durante la lettura del file. Riprova.');
    };
    
    reader.readAsDataURL(file);
}

function setupCameraListeners() {
    // Camera modal listeners
    if (dom.cameraModal) {
        dom.cameraModal.addEventListener('click', e => {
            if (e.target === dom.cameraModal) {
                closeCamera();
            }
        });
    }
    
    // Camera control buttons
    if (dom.capturePhotoBtn) {
        dom.capturePhotoBtn.addEventListener('click', capturePhoto);
    }
    
    if (dom.cancelCamera) {
        dom.cancelCamera.addEventListener('click', closeCamera);
    }
    
    // File upload buttons
    if (dom.symbolUploadBtn && dom.symbolCustomImageInput) {
        dom.symbolUploadBtn.addEventListener('click', () => {
            dom.symbolCustomImageInput.click();
        });
        
        dom.symbolCustomImageInput.addEventListener('change', (e) => {
            handleFileUpload(e, 'symbol');
        });
    }
    
    if (dom.categoryUploadBtn && dom.categoryCustomImageInput) {
        dom.categoryUploadBtn.addEventListener('click', () => {
            dom.categoryCustomImageInput.click();
        });
        
        dom.categoryCustomImageInput.addEventListener('change', (e) => {
            handleFileUpload(e, 'category');
        });
    }
    
    // Take photo buttons
    if (dom.symbolTakePhotoBtn) {
        dom.symbolTakePhotoBtn.addEventListener('click', () => openCamera('symbol'));
    }
    
    if (dom.categoryTakePhotoBtn) {
        dom.categoryTakePhotoBtn.addEventListener('click', () => openCamera('category'));
    }
}

// Utility function to resize image data URL
function resizeImage(dataUrl, maxWidth = 300, maxHeight = 300, quality = 0.8) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Calculate new dimensions
            let { width, height } = img;
            
            if (width > height) {
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width = (width * maxHeight) / height;
                    height = maxHeight;
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            
            // Draw and resize image
            ctx.drawImage(img, 0, 0, width, height);
            
            const resizedDataUrl = canvas.toDataURL('image/jpeg', quality);
            resolve(resizedDataUrl);
        };
        img.src = dataUrl;
    });
}

// Check camera permissions
async function checkCameraPermissions() {
    if (!('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices)) {
        return { supported: false, message: 'Camera not supported' };
    }
    
    try {
        const permissions = await navigator.permissions.query({ name: 'camera' });
        return {
            supported: true,
            granted: permissions.state === 'granted',
            denied: permissions.state === 'denied',
            state: permissions.state
        };
    } catch (error) {
        console.warn('Could not check camera permissions:', error);
        return { supported: true, granted: null };
    }
}

// Export functions for use in other modules
if (typeof window !== 'undefined') {
    window.openCamera = openCamera;
    window.closeCamera = closeCamera;
    window.capturePhoto = capturePhoto;
    window.handleFileUpload = handleFileUpload;
    window.setupCameraListeners = setupCameraListeners;
    window.resizeImage = resizeImage;
    window.checkCameraPermissions = checkCameraPermissions;
}
