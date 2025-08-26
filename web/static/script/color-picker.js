// web-app-CAA/static/script/color-picker.js
// Color picker functionality

function setupColorPickers() {
    // Setup symbol color picker
    if (dom.symbolColorPickerContainer) {
        setupSymbolColorPicker();
    }
    
    // Setup category color picker
    if (dom.categoryColorPickerContainer) {
        setupCategoryColorPicker();
    }
    
    // Setup preset colors
    setupColorPresets();
}

function setupSymbolColorPicker() {
    // Initialize color picker library (assuming you're using a library like iro.js)
    try {
        const symbolColorPicker = new iro.ColorPicker(dom.symbolColorPickerContainer, {
            width: 200,
            color: "#ffffff",
            borderWidth: 1,
            borderColor: "#ccc"
        });
        
        setSymbolColorPicker(symbolColorPicker);
        
        // Update the input when color changes
        symbolColorPicker.on(['color:init', 'color:change'], function(color) {
            if (dom.symbolColor) {
                dom.symbolColor.value = color.hexString;
            }
        });
        
        // Update picker when input changes
        if (dom.symbolColor) {
            dom.symbolColor.addEventListener('change', function() {
                symbolColorPicker.color.hexString = this.value;
            });
        }
    } catch (error) {
        console.warn('Color picker library not available, falling back to basic color input');
        setupBasicColorInput('symbol');
    }
}

function setupCategoryColorPicker() {
    try {
        const categoryColorPicker = new iro.ColorPicker(dom.categoryColorPickerContainer, {
            width: 200,
            color: "#ffffff",
            borderWidth: 1,
            borderColor: "#ccc"
        });
        
        setCategoryColorPicker(categoryColorPicker);
        
        // Update the input when color changes
        categoryColorPicker.on(['color:init', 'color:change'], function(color) {
            if (dom.categoryColor) {
                dom.categoryColor.value = color.hexString;
            }
        });
        
        // Update picker when input changes
        if (dom.categoryColor) {
            dom.categoryColor.addEventListener('change', function() {
                categoryColorPicker.color.hexString = this.value;
            });
        }
    } catch (error) {
        console.warn('Color picker library not available, falling back to basic color input');
        setupBasicColorInput('category');
    }
}

function setupBasicColorInput(type) {
    const colorInput = type === 'symbol' ? dom.symbolColor : dom.categoryColor;
    if (colorInput) {
        colorInput.type = 'color';
        colorInput.style.width = '100%';
        colorInput.style.height = '40px';
    }
}

function setupColorPresets() {
    const pastelColors = [
        '#FFB3BA', '#BAFFC9', '#BAE1FF', '#FFFFBA', '#FFD1FF',
        '#FFC9B3', '#B3E5D1', '#E1B3FF', '#D1FFB3', '#FFE1B3',
        '#FFB3D1', '#B3D1FF', '#D1FFE1', '#E1FFB3', '#FFE1D1'
    ];
    
    // Setup symbol color presets
    if (dom.symbolPastelPresets) {
        setupColorPresetContainer(dom.symbolPastelPresets, pastelColors, 'symbol');
    }
    
    // Setup category color presets
    if (dom.categoryPastelPresets) {
        setupColorPresetContainer(dom.categoryPastelPresets, pastelColors, 'category');
    }
}

function setupColorPresetContainer(container, colors, type) {
    container.innerHTML = '';
    
    colors.forEach(color => {
        const colorBtn = document.createElement('button');
        colorBtn.type = 'button';
        colorBtn.className = 'color-preset-btn';
        colorBtn.style.backgroundColor = color;
        colorBtn.title = color;
        
        colorBtn.addEventListener('click', () => {
            applyColorPreset(color, type);
        });
        
        container.appendChild(colorBtn);
    });
}

function applyColorPreset(color, type) {
    const colorPickers = getColorPickers();
    
    if (type === 'symbol') {
        if (dom.symbolColor) {
            dom.symbolColor.value = color;
        }
        if (colorPickers.symbol) {
            colorPickers.symbol.color.hexString = color;
        }
    } else if (type === 'category') {
        if (dom.categoryColor) {
            dom.categoryColor.value = color;
        }
        if (colorPickers.category) {
            colorPickers.category.color.hexString = color;
        }
    }
}

function getRandomPastelColor() {
    const pastelColors = [
        '#FFB3BA', '#BAFFC9', '#BAE1FF', '#FFFFBA', '#FFD1FF',
        '#FFC9B3', '#B3E5D1', '#E1B3FF', '#D1FFB3', '#FFE1B3',
        '#FFB3D1', '#B3D1FF', '#D1FFE1', '#E1FFB3', '#FFE1D1'
    ];
    
    return pastelColors[Math.floor(Math.random() * pastelColors.length)];
}

function generateColorPalette(baseColor, count = 5) {
    const colors = [];
    const hsl = hexToHsl(baseColor);
    
    for (let i = 0; i < count; i++) {
        const newHue = (hsl.h + (i * 60)) % 360; // Spread colors across hue spectrum
        const newColor = hslToHex(newHue, hsl.s, hsl.l);
        colors.push(newColor);
    }
    
    return colors;
}

function hexToHsl(hex) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    
    if (max === min) {
        h = s = 0; // achromatic
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    
    return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;
    
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h * 6) % 2 - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;
    
    if (0 <= h && h < 1/6) {
        r = c; g = x; b = 0;
    } else if (1/6 <= h && h < 2/6) {
        r = x; g = c; b = 0;
    } else if (2/6 <= h && h < 3/6) {
        r = 0; g = c; b = x;
    } else if (3/6 <= h && h < 4/6) {
        r = 0; g = x; b = c;
    } else if (4/6 <= h && h < 5/6) {
        r = x; g = 0; b = c;
    } else if (5/6 <= h && h < 1) {
        r = c; g = 0; b = x;
    }
    
    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function isColorLight(color) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calculate relative luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    return luminance > 0.5;
}

function getContrastingTextColor(backgroundColor) {
    return isColorLight(backgroundColor) ? '#000000' : '#FFFFFF';
}

// Export functions for use in other modules
if (typeof window !== 'undefined') {
    window.setupColorPickers = setupColorPickers;
    window.setupSymbolColorPicker = setupSymbolColorPicker;
    window.setupCategoryColorPicker = setupCategoryColorPicker;
    window.setupColorPresets = setupColorPresets;
    window.applyColorPreset = applyColorPreset;
    window.getRandomPastelColor = getRandomPastelColor;
    window.generateColorPalette = generateColorPalette;
    window.hexToHsl = hexToHsl;
    window.hslToHex = hslToHex;
    window.isColorLight = isColorLight;
    window.getContrastingTextColor = getContrastingTextColor;
}
