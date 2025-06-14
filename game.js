import { Renderer } from './renderer.js';
import { Player } from './player.js';
import { Map } from './map.js';
import { Editor } from './editor.js';
import { AssetManager } from './assets.js';
import { UI } from './ui.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.renderer = new Renderer(this.ctx);
        this.player = new Player(400, 300);
        this.map = new Map();
        this.editor = new Editor();
        this.assetManager = new AssetManager();
        this.ui = new UI();
        
        this.gameState = 'playing'; // playing, paused, editor
        this.lastTime = 0;
        this.keys = {};
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadDefaultAssets();
        this.gameLoop();
    }
    
    setupEventListeners() {
        // Keyboard input
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            this.handleKeyDown(e);
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // UI navigation
        document.getElementById('gameMode').addEventListener('click', () => {
            this.setMode('game');
        });
        
        document.getElementById('editorMode').addEventListener('click', () => {
            this.setMode('editor');
        });
        
        document.getElementById('assetGen').addEventListener('click', () => {
            this.setMode('assets');
        });
        
        // Game controls
        document.getElementById('pauseBtn').addEventListener('click', () => {
            this.togglePause();
        });
        
        document.getElementById('saveGameBtn').addEventListener('click', () => {
            this.saveGame();
        });
        
        // Prevent context menu on canvas
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    handleKeyDown(e) {
        switch(e.code) {
            case 'Escape':
                this.togglePause();
                break;
            case 'KeyE':
                if (e.ctrlKey) {
                    this.setMode('editor');
                    e.preventDefault();
                }
                break;
        }
    }
    
    setMode(mode) {
        // Update nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        
        // Hide all views
        document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
        
        switch(mode) {
            case 'game':
                document.getElementById('gameMode').classList.add('active');
                document.getElementById('gameView').classList.add('active');
                this.gameState = 'playing';
                break;
            case 'editor':
                document.getElementById('editorMode').classList.add('active');
                document.getElementById('editorView').classList.add('active');
                this.gameState = 'editor';
                this.editor.activate();
                break;
            case 'assets':
                document.getElementById('assetGen').classList.add('active');
                document.getElementById('assetView').classList.add('active');
                break;
        }
    }
    
    togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            document.getElementById('pauseBtn').textContent = '▶️ Resume';
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
            document.getElementById('pauseBtn').textContent = '⏸️ Pause';
        }
    }
    
    async loadDefaultAssets() {
        // Load some basic pixel art assets
        await this.assetManager.loadDefaultTileset();
        this.ui.updateAssetLibrary(this.assetManager.assets);
    }
    
    update(deltaTime) {
        if (this.gameState !== 'playing') return;
        
        // Handle input
        this.handleMovement();
        
        // Update game objects
        this.player.update(deltaTime, this.map);
        this.map.update(deltaTime);
        
        // Update UI
        this.updateUI();
    }
    
    handleMovement() {
        const speed = 150; // pixels per second
        let dx = 0;
        let dy = 0;
        
        if (this.keys['KeyW'] || this.keys['ArrowUp']) dy -= speed;
        if (this.keys['KeyS'] || this.keys['ArrowDown']) dy += speed;
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) dx -= speed;
        if (this.keys['KeyD'] || this.keys['ArrowRight']) dx += speed;
        
        // Normalize diagonal movement
        if (dx !== 0 && dy !== 0) {
            dx *= 0.707;
            dy *= 0.707;
        }
        
        this.player.setVelocity(dx, dy);
    }
    
    updateUI() {
        // Update health bar
        const healthPercent = (this.player.health / this.player.maxHealth) * 100;
        document.getElementById('healthFill').style.width = `${healthPercent}%`;
        
        // Update level
        document.getElementById('playerLevel').textContent = this.player.level;
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Calculate camera offset based on player position
        const camera = {
            x: this.canvas.width / 2 - this.player.x,
            y: this.canvas.height / 2 - this.player.y
        };
        
        // Render game world
        this.ctx.save();
        this.ctx.translate(camera.x, camera.y);
        
        this.map.render(this.renderer);
        this.player.render(this.renderer);
        
        this.ctx.restore();
        
        // Render UI overlay
        this.renderGameUI();
    }
    
    renderGameUI() {
        // Draw minimap
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(this.canvas.width - 150, 10, 140, 100);
        this.ctx.strokeStyle = '#00ff88';
        this.ctx.strokeRect(this.canvas.width - 150, 10, 140, 100);
        
        // Draw player dot on minimap
        this.ctx.fillStyle = '#ff4444';
        this.ctx.fillRect(this.canvas.width - 80, 55, 4, 4);
    }
    
    saveGame() {
        const gameData = {
            player: this.player.serialize(),
            map: this.map.serialize(),
            timestamp: Date.now()
        };
        
        localStorage.setItem('retro-rpg-save', JSON.stringify(gameData));
        
        // Show save confirmation
        this.showNotification('Game saved!');
    }
    
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: rgba(0, 255, 136, 0.9);
            color: #1a1a2e;
            padding: 1rem;
            border-radius: 5px;
            font-weight: bold;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    gameLoop(currentTime = 0) {
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});

// Add slide-in animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

