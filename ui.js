export class UI {
    constructor() {
        this.setupInventory();
        this.setupMobileControls();
    }
    
    setupInventory() {
        document.getElementById('inventoryBtn').addEventListener('click', () => {
            this.toggleInventory();
        });
    }
    
    setupMobileControls() {
        // Check if on mobile device
        if ('ontouchstart' in window) {
            this.createMobileControls();
        }
    }
    
    createMobileControls() {
        const controlsDiv = document.createElement('div');
        controlsDiv.id = 'mobileControls';
        controlsDiv.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            right: 20px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            pointer-events: none;
            z-index: 100;
        `;
        
        // Virtual D-pad
        const dpad = document.createElement('div');
        dpad.id = 'virtualDpad';
        dpad.style.cssText = `
            width: 120px;
            height: 120px;
            background: rgba(0, 255, 136, 0.2);
            border: 2px solid #00ff88;
            border-radius: 50%;
            position: relative;
            pointer-events: auto;
        `;
        
        // Action buttons
        const actionButtons = document.createElement('div');
        actionButtons.id = 'actionButtons';
        actionButtons.style.cssText = `
            display: flex;
            gap: 10px;
            pointer-events: auto;
        `;
        
        const actionBtn = document.createElement('button');
        actionBtn.textContent = 'A';
        actionBtn.style.cssText = `
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: rgba(0, 255, 136, 0.2);
            border: 2px solid #00ff88;
            color: #00ff88;
            font-weight: bold;
            font-size: 18px;
        `;
        
        actionButtons.appendChild(actionBtn);
        controlsDiv.appendChild(dpad);
        controlsDiv.appendChild(actionButtons);
        
        document.body.appendChild(controlsDiv);
        
        this.setupVirtualDpad(dpad);
    }
    
    setupVirtualDpad(dpad) {
        let isPressed = false;
        let currentDirection = null;
        
        const handleTouch = (e) => {
            const rect = dpad.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const touch = e.touches[0] || e.changedTouches[0];
            
            const deltaX = touch.clientX - centerX;
            const deltaY = touch.clientY - centerY;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            if (distance < 60) { // Within d-pad radius
                const angle = Math.atan2(deltaY, deltaX);
                const direction = this.getDirectionFromAngle(angle);
                
                if (direction !== currentDirection) {
                    this.releaseAllKeys();
                    this.pressKey(direction);
                    currentDirection = direction;
                }
            } else {
                this.releaseAllKeys();
                currentDirection = null;
            }
        };
        
        dpad.addEventListener('touchstart', (e) => {
            e.preventDefault();
            isPressed = true;
            handleTouch(e);
        });
        
        dpad.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (isPressed) {
                handleTouch(e);
            }
        });
        
        dpad.addEventListener('touchend', (e) => {
            e.preventDefault();
            isPressed = false;
            this.releaseAllKeys();
            currentDirection = null;
        });
    }
    
    getDirectionFromAngle(angle) {
        const degrees = (angle * 180 / Math.PI + 360) % 360;
        
        if (degrees >= 315 || degrees < 45) return 'KeyD'; // Right
        if (degrees >= 45 && degrees < 135) return 'KeyS'; // Down
        if (degrees >= 135 && degrees < 225) return 'KeyA'; // Left
        if (degrees >= 225 && degrees < 315) return 'KeyW'; // Up
    }
    
    pressKey(keyCode) {
        if (window.game) {
            window.game.keys[keyCode] = true;
        }
    }
    
    releaseAllKeys() {
        if (window.game) {
            ['KeyW', 'KeyA', 'KeyS', 'KeyD'].forEach(key => {
                window.game.keys[key] = false;
            });
        }
    }
    
    toggleInventory() {
        // Create inventory modal if it doesn't exist
        let inventoryModal = document.getElementById('inventoryModal');
        
        if (!inventoryModal) {
            inventoryModal = this.createInventoryModal();
            document.body.appendChild(inventoryModal);
        }
        
        const isVisible = inventoryModal.style.display === 'block';
        inventoryModal.style.display = isVisible ? 'none' : 'block';
    }
    
    createInventoryModal() {
        const modal = document.createElement('div');
        modal.id = 'inventoryModal';
        modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 400px;
            height: 300px;
            background: rgba(20, 20, 40, 0.95);
            border: 2px solid #00ff88;
            border-radius: 10px;
            padding: 20px;
            z-index: 1000;
            display: none;
            backdrop-filter: blur(10px);
        `;
        
        const title = document.createElement('h3');
        title.textContent = '🎒 Inventory';
        title.style.color = '#00ff88';
        title.style.marginBottom = '20px';
        
        const inventoryGrid = document.createElement('div');
        inventoryGrid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(8, 1fr);
            gap: 5px;
            height: 200px;
        `;
        
        // Create inventory slots
        for (let i = 0; i < 32; i++) {
            const slot = document.createElement('div');
            slot.style.cssText = `
                width: 40px;
                height: 40px;
                border: 2px solid #333;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 3px;
            `;
            inventoryGrid.appendChild(slot);
        }
        
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✕ Close';
        closeBtn.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(255, 68, 68, 0.2);
            border: 1px solid #ff4444;
            color: #ff4444;
            padding: 5px 10px;
            border-radius: 3px;
            cursor: pointer;
        `;
        
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        modal.appendChild(title);
        modal.appendChild(inventoryGrid);
        modal.appendChild(closeBtn);
        
        return modal;
    }
    
    updateAssetLibrary(assets) {
        // Update the asset library display
        console.log('Updating asset library with:', assets.size, 'assets');
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'error' ? 'rgba(255, 68, 68, 0.9)' : 'rgba(0, 255, 136, 0.9)'};
            color: ${type === 'error' ? '#fff' : '#1a1a2e'};
            border-radius: 5px;
            font-weight: bold;
            z-index: 1000;
            animation: slideInFromRight 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutToRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Add notification animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInFromRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutToRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

