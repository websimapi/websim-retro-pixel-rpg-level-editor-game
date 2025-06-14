import * as THREE from 'three';

export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.z = 0;
        this.width = 32;
        this.height = 48;
        this.vx = 0;
        this.vy = 0;
        
        this.health = 100;
        this.maxHealth = 100;
        this.level = 1;
        this.experience = 0;
        
        this.sprite = null;
        this.mesh = null;
        this.animationFrame = 0;
        this.animationTime = 0;
        this.direction = 'down'; // up, down, left, right
        
        this.loadSprite();
    }
    
    async loadSprite() {
        // Create a basic pixel character sprite
        this.sprite = await this.createCharacterSprite();
    }
    
    async createCharacterSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 192;
        const ctx = canvas.getContext('2d');
        
        // Create a simple pixel character (4 directions, 4 frames each)
        // This is a placeholder - in a real game you'd load proper sprites
        ctx.fillStyle = '#8B4513'; // Brown hair
        ctx.fillRect(8, 8, 16, 8);
        ctx.fillRect(40, 8, 16, 8);
        ctx.fillRect(8, 56, 16, 8);
        ctx.fillRect(40, 56, 16, 8);
        
        ctx.fillStyle = '#FFDBAC'; // Skin tone
        ctx.fillRect(8, 16, 16, 16);
        ctx.fillRect(40, 16, 16, 16);
        ctx.fillRect(8, 64, 16, 16);
        ctx.fillRect(40, 64, 16, 16);
        
        ctx.fillStyle = '#0066CC'; // Blue shirt
        ctx.fillRect(8, 32, 16, 16);
        ctx.fillRect(40, 32, 16, 16);
        ctx.fillRect(8, 80, 16, 16);
        ctx.fillRect(40, 80, 16, 16);
        
        return canvas;
    }
    
    setVelocity(vx, vy) {
        this.vx = vx;
        this.vy = vy;
        
        // Update direction based on movement
        if (Math.abs(vx) > Math.abs(vy)) {
            this.direction = vx > 0 ? 'right' : 'left';
        } else if (vy !== 0) {
            this.direction = vy > 0 ? 'down' : 'up';
        }
    }
    
    update(deltaTime, map) {
        // Store old position for collision detection
        const oldX = this.x;
        const oldY = this.y;
        
        // Apply velocity
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        
        // Check collisions with map
        if (map && this.checkCollision(map)) {
            this.x = oldX;
            this.y = oldY;
        }
        
        // Update 3D mesh position
        if (this.mesh) {
            this.mesh.position.set(this.x, this.z + this.height/2, this.y);
            
            // Update sprite animation
            if (this.vx !== 0 || this.vy !== 0) {
                this.animationTime += deltaTime;
                if (this.animationTime > 0.2) {
                    this.animationFrame = (this.animationFrame + 1) % 4;
                    this.animationTime = 0;
                    this.updateSpriteTexture();
                }
            } else {
                this.animationFrame = 0;
                this.updateSpriteTexture();
            }
        }
    }
    
    updateSpriteTexture() {
        if (!this.sprite || !this.mesh) return;
        
        // Create new texture with current animation frame
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 48;
        const ctx = canvas.getContext('2d');
        
        // Calculate sprite position based on direction and animation frame
        let spriteX = this.animationFrame * 32;
        let spriteY = 0;
        
        switch(this.direction) {
            case 'down': spriteY = 0; break;
            case 'left': spriteY = 48; break;
            case 'right': spriteY = 96; break;
            case 'up': spriteY = 144; break;
        }
        
        ctx.drawImage(
            this.sprite,
            spriteX, spriteY, 32, 48,
            0, 0, 32, 48
        );
        
        // Update mesh texture
        const texture = new THREE.CanvasTexture(canvas);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        texture.generateMipmaps = false;
        this.mesh.material.map = texture;
        this.mesh.material.needsUpdate = true;
    }
    
    checkCollision(map) {
        // Check if player position collides with solid tiles
        const tileX = Math.floor(this.x / 32);
        const tileY = Math.floor(this.y / 32);
        
        return map.isSolid(tileX, tileY);
    }
    
    render(renderer) {
        if (!this.mesh && this.sprite) {
            // Create 3D mesh for player
            this.mesh = renderer.createSpriteMesh(
                this.createCurrentFrameCanvas(), 
                this.x, this.y, this.z, 
                this.width, this.height
            );
            renderer.addToScene(this.mesh);
        }
        
        // Update camera to follow player
        renderer.updateCamera(this.x, this.y);
    }
    
    createCurrentFrameCanvas() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 48;
        const ctx = canvas.getContext('2d');
        
        if (this.sprite) {
            let spriteX = this.animationFrame * 32;
            let spriteY = 0;
            
            switch(this.direction) {
                case 'down': spriteY = 0; break;
                case 'left': spriteY = 48; break;
                case 'right': spriteY = 96; break;
                case 'up': spriteY = 144; break;
            }
            
            ctx.drawImage(
                this.sprite,
                spriteX, spriteY, 32, 48,
                0, 0, 32, 48
            );
        } else {
            // Fallback rectangle
            ctx.fillStyle = '#ff4444';
            ctx.fillRect(8, 12, 16, 36);
        }
        
        return canvas;
    }
    
    serialize() {
        return {
            x: this.x,
            y: this.y,
            health: this.health,
            maxHealth: this.maxHealth,
            level: this.level,
            experience: this.experience
        };
    }
    
    deserialize(data) {
        this.x = data.x;
        this.y = data.y;
        this.health = data.health;
        this.maxHealth = data.maxHealth;
        this.level = data.level;
        this.experience = data.experience;
    }
}