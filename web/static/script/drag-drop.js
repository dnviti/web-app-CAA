// web-app-CAA/static/script/drag-drop.js
// Drag and drop functionality

// --- DRAG, DROP, CONTEXT MENU & OTHERS ---
function handleDragStart(e) {
    if (getCurrentMode() !== 'editor' || !e.target.closest('.symbol-cell')) return;
    
    const draggedItemId = e.target.closest('.symbol-cell').dataset.id;
    setDraggedItemId(draggedItemId);
    
    e.dataTransfer.effectAllowed = 'move';
    
    // Show trash can during drag
    if (dom.trashCanContainer) {
        dom.trashCanContainer.classList.add('visible-for-drag');
    }
    
    // Add dragging class after a small delay to allow drag start
    setTimeout(() => {
        const cell = e.target.closest('.symbol-cell');
        if (cell) {
            cell.classList.add('dragging');
        }
    }, 0);
}

function handleDragOver(e) {
    e.preventDefault();
    
    const target = e.target.closest('.symbol-cell');
    const draggedItemId = getDraggedItemId();
    
    if (target && target.dataset.id !== draggedItemId) {
        // Remove previous drag-over indicators
        document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
        // Add drag-over class to current target
        target.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    // Only remove drag-over class if we're actually leaving the element
    if (!e.currentTarget.contains(e.relatedTarget)) {
        document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    }
}

function handleDrop(e) {
    e.preventDefault();
    
    const targetCell = e.target.closest('.symbol-cell');
    const draggedItemId = getDraggedItemId();
    
    // Clean up drag-over indicators
    document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    
    if (!targetCell || targetCell.dataset.id === draggedItemId) {
        return;
    }
    
    const draggedCell = dom.symbolGrid.querySelector(`.symbol-cell[data-id='${draggedItemId}']`);
    if (!draggedCell) {
        return;
    }
    
    // Reorder items in the current category
    const currentCategory = getCurrentCategory();
    const categories = getCategories();
    const arr = categories[currentCategory];
    
    if (!arr) return;
    
    const dragIdx = arr.findIndex(i => i.id === draggedItemId);
    const dropIdx = arr.findIndex(i => i.id === targetCell.dataset.id);
    
    if (dragIdx === -1 || dropIdx === -1) {
        return;
    }
    
    // Move the dragged item to new position
    const [draggedItem] = arr.splice(dragIdx, 1);
    arr.splice(dropIdx, 0, draggedItem);
    
    // Update DOM order
    dom.symbolGrid.insertBefore(draggedCell, targetCell);
    
    // Save changes
    saveGridToDB();
}

function handleDragEnd() {
    setDraggedItemId(null);
    
    // Clean up all drag-related classes
    document.querySelectorAll('.dragging, .drag-over').forEach(el => {
        el.classList.remove('dragging', 'drag-over');
    });
    
    // Hide trash can
    if (dom.trashCanContainer) {
        dom.trashCanContainer.classList.remove('drag-over', 'visible-for-drag');
    }
}

function handleTrashDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (dom.trashCanContainer) {
        dom.trashCanContainer.classList.add('drag-over');
    }
}

function handleTrashDragLeave() {
    if (dom.trashCanContainer) {
        dom.trashCanContainer.classList.remove('drag-over');
    }
}

async function handleTrashDrop(e) {
    e.preventDefault();
    
    const draggedItemId = getDraggedItemId();
    if (!draggedItemId) return;
    
    const found = findItemById(draggedItemId);
    if (!found || found.item.type === 'system') return;
    
    const { item, parentKey } = found;
    const isCategory = item.type === 'category';
    
    let confirmationMessage = `Sei sicuro di voler eliminare in modo permanente "${item.label}"?`;
    if (isCategory) {
        confirmationMessage += "\n\nATTENZIONE: Verranno eliminati anche tutti i simboli contenuti in questa categoria.";
    }
    
    if (!confirm(confirmationMessage)) return;
    
    // Store original data for potential rollback
    const categories = getCategories();
    const originalParentItems = [...categories[parentKey]];
    const originalCategoryData = isCategory ? { ...categories[item.target] } : null;
    
    // Remove item from UI immediately
    categories[parentKey] = categories[parentKey].filter(i => i.id !== draggedItemId);
    if (isCategory && categories[item.target]) {
        delete categories[item.target];
    }
    
    renderSymbols();
    
    try {
        // Attempt to delete on server
        await deleteItemFromDB(draggedItemId, isCategory ? item.target : undefined);
        console.log('Item deleted successfully from DB.');
    } catch (error) {
        console.error('Error deleting item:', error);
        alert('Could not delete the item from the server. Reverting changes.');
        
        // Rollback changes on error
        categories[parentKey] = originalParentItems;
        if (isCategory && originalCategoryData) {
            categories[item.target] = originalCategoryData;
        }
        renderSymbols();
    }
}

function showContextMenu(e, id) {
    e.preventDefault();
    e.stopPropagation();
    
    setContextMenuState(id, null);
    
    if (!dom.symbolContextMenu) return;
    
    const found = findItemById(id);
    if (!found) return;
    
    const { item } = found;
    
    // Update context menu options based on item type
    if (dom.contextMenuToggleVisibility) {
        const isVisible = item.visible !== false;
        dom.contextMenuToggleVisibility.textContent = isVisible ? 'Nascondi' : 'Mostra';
    }
    
    // Position the context menu
    const rect = dom.symbolGrid.getBoundingClientRect();
    const x = Math.min(e.clientX - rect.left, rect.width - 200); // 200px is approximate menu width
    const y = Math.min(e.clientY - rect.top, rect.height - 150); // 150px is approximate menu height
    
    dom.symbolContextMenu.style.left = `${x}px`;
    dom.symbolContextMenu.style.top = `${y}px`;
    dom.symbolContextMenu.classList.add('active');
    
    // Prevent the menu from closing immediately
    setTimeout(() => {
        document.addEventListener('click', hideContextMenu, { once: true });
    }, 10);
}

function hideContextMenu() {
    if (dom.symbolContextMenu) {
        dom.symbolContextMenu.classList.remove('active');
    }
}

function handleContextMenuAction(action) {
    const contextState = getContextMenuState();
    const symbolId = contextState.symbolId;
    
    if (!symbolId) return;
    
    switch (action) {
        case 'edit':
            hideContextMenu();
            openEditModal(symbolId);
            break;
            
        case 'copy':
        case 'move':
            setContextMenuState(symbolId, action);
            populateCategorySelectionModal();
            showModal(dom.categorySelectionModal);
            hideContextMenu();
            break;
            
        case 'toggleVisibility':
            toggleItemVisibility(symbolId);
            hideContextMenu();
            break;
    }
    
    clearContextMenuState();
}

function executeCopyOrMove(targetKey) {
    const contextState = getContextMenuState();
    const found = findItemById(contextState.symbolId);
    
    if (!found) {
        clearContextMenuState();
        return;
    }
    
    const itemToProcess = { ...found.item };
    const categories = getCategories();
    
    if (contextState.action === 'copy') {
        itemToProcess.id = generateUniqueId();
        categories[targetKey].push(itemToProcess);
    } else if (contextState.action === 'move') {
        categories[found.parentKey] = categories[found.parentKey].filter(i => i.id !== contextState.symbolId);
        categories[targetKey].push(itemToProcess);
    }
    
    renderSymbols();
    closeModal(dom.categorySelectionModal);
    saveGridToDB();
    clearContextMenuState();
}

async function toggleItemVisibility(itemId) {
    const found = findItemById(itemId);
    if (!found) return;
    
    const currentVisibility = found.item.visible !== false;
    const newVisibility = !currentVisibility;
    
    try {
        // Update locally first
        found.item.visible = newVisibility;
        renderSymbols();
        
        // Update on server
        await updateItemVisibility(itemId, newVisibility);
        console.log(`Item visibility updated: ${newVisibility}`);
        
        saveGridToDB();
    } catch (error) {
        console.error('Error updating item visibility:', error);
        // Revert local change
        found.item.visible = currentVisibility;
        renderSymbols();
        alert('Could not update item visibility on server.');
    }
}

// Set up drag and drop event listeners
function setupDragDropListeners() {
    if (!dom.symbolGrid) return;
    
    dom.symbolGrid.addEventListener('dragstart', handleDragStart);
    dom.symbolGrid.addEventListener('dragover', handleDragOver);
    dom.symbolGrid.addEventListener('dragleave', handleDragLeave);
    dom.symbolGrid.addEventListener('drop', handleDrop);
    dom.symbolGrid.addEventListener('dragend', handleDragEnd);
    
    // Trash can listeners
    if (dom.trashCanContainer) {
        dom.trashCanContainer.addEventListener('dragover', handleTrashDragOver);
        dom.trashCanContainer.addEventListener('dragleave', handleTrashDragLeave);
        dom.trashCanContainer.addEventListener('drop', handleTrashDrop);
    }
    
    // Context menu listeners
    if (dom.contextMenuEdit) {
        dom.contextMenuEdit.addEventListener('click', (e) => {
            e.stopPropagation();
            handleContextMenuAction('edit');
        });
    }
    
    if (dom.contextMenuCopy) {
        dom.contextMenuCopy.addEventListener('click', (e) => {
            e.stopPropagation();
            handleContextMenuAction('copy');
        });
    }
    
    if (dom.contextMenuMove) {
        dom.contextMenuMove.addEventListener('click', (e) => {
            e.stopPropagation();
            handleContextMenuAction('move');
        });
    }
    
    if (dom.contextMenuToggleVisibility) {
        dom.contextMenuToggleVisibility.addEventListener('click', (e) => {
            e.stopPropagation();
            handleContextMenuAction('toggleVisibility');
        });
    }
    
    // Hide context menu on document click
    document.addEventListener('click', () => {
        hideContextMenu();
        clearContextMenuState();
    });
}

// Export functions for use in other modules
if (typeof window !== 'undefined') {
    window.handleDragStart = handleDragStart;
    window.handleDragOver = handleDragOver;
    window.handleDragLeave = handleDragLeave;
    window.handleDrop = handleDrop;
    window.handleDragEnd = handleDragEnd;
    window.handleTrashDragOver = handleTrashDragOver;
    window.handleTrashDragLeave = handleTrashDragLeave;
    window.handleTrashDrop = handleTrashDrop;
    window.showContextMenu = showContextMenu;
    window.hideContextMenu = hideContextMenu;
    window.handleContextMenuAction = handleContextMenuAction;
    window.executeCopyOrMove = executeCopyOrMove;
    window.toggleItemVisibility = toggleItemVisibility;
    window.setupDragDropListeners = setupDragDropListeners;
}
