import * as THREE from 'three';

export class Map {
    constructor() {
        this.width = 50;
        this.height = 50;
        this.tileSize = 32;
        
        // Multiple layers for different tile types
        this.layers = {
            background: [],
            objects: [],
            collision: []
        };
        
        this.tileset = null;
        this.tileMeshes = [];
        this.generateDefaultMap();
        this.loadTileset();
    }
    
    generateDefaultMap() {
        // Initialize all layers
        for (let layer in this.layers) {
            this.layers[layer] = [];
            for (let y = 0; y < this.height; y++) {
                this.layers[layer][y] = [];
                for (let x = 0; x < this.width; x++) {
                    this.layers[layer][y][x] = 0;
                }
            }
        }
        
        // Generate a simple test map
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                // Grass background
                this.layers.background[y][x] = 1;
                
                // Add some trees randomly
                if (Math.random() < 0.1 && (x < 20 || x > 30 || y < 15 || y > 35)) {
                    this.layers.objects[y][x] = 2;
                    this.layers.collision[y][x] = 1; // Trees are solid
                }
                
                // Add border walls
                if (x === 0 || x === this.width - 1 || y === 0 || y === this.height - 1) {
                    this.layers.objects[y][x] = 3;
                    this.layers.collision[y][x] = 1;
                }
            }
        }
    }
    
    async loadTileset() {
        // Create a basic tileset
        this.tileset = await this.createBasicTileset();
    }
    
    async createBasicTileset() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        // Tile 0: Empty/transparent
        // (leave empty)
        
        // Tile 1: Grass (0, 0)
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(0, 0, 32, 32);
        ctx.fillStyle = '#45A049';
        for (let i = 0; i < 8; i++) {
            const x = Math.random() * 30;
            const y = Math.random() * 30;
            ctx.fillRect(x, y, 2, 2);
        }
        
        // Tile 2: Tree (32, 0)
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(46, 20, 4, 12);
        ctx.fillStyle = '#228B22';
        ctx.fillRect(40, 8, 16, 16);
        
        // Tile 3: Stone wall (0, 32)
        ctx.fillStyle = '#808080';
        ctx.fillRect(0, 32, 32, 32);
        ctx.fillStyle = '#696969';
        ctx.fillRect(2, 34, 28, 28);
        ctx.fillStyle = '#A9A9A9';
        ctx.fillRect(4, 36, 24, 24);
        
        // Tile 4: Water (32, 32)
        ctx.fillStyle = '#1E90FF';
        ctx.fillRect(32, 32, 32, 32);
        ctx.fillStyle = '#4169E1';
        for (let i = 0; i < 6; i++) {
            const x = 32 + Math.random() * 30;
            const y = 32 + Math.random() * 30;
            ctx.fillRect(x, y, 2, 1);
        }
        
        return canvas;
    }
    
    getTile(layer, x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return 0;
        }
        return this.layers[layer][y][x];
    }
    
    setTile(layer, x, y, tileId) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return;
        }
        this.layers[layer][y][x] = tileId;
    }
    
    isSolid(x, y) {
        return this.getTile('collision', x, y) === 1;
    }
    
    update(deltaTime) {
        // Map animations, dynamic elements, etc.
    }
    
    render(renderer) {
        if (!this.tileset) return;
        
        // Clear existing meshes if they exist
        this.clearMeshes(renderer);
        
        // Generate 3D meshes for visible tiles
        this.generateTileMeshes(renderer);
    }
    
    clearMeshes(renderer) {
        this.tileMeshes.forEach(mesh => {
            renderer.removeFromScene(mesh);
            mesh.geometry.dispose();
            mesh.material.dispose();
        });
        this.tileMeshes = [];
    }
    
    generateTileMeshes(renderer) {
        // Calculate visible area (basic culling)
        const margin = 5;
        const startX = Math.max(0, -margin);
        const endX = Math.min(this.width, this.width + margin);
        const startY = Math.max(0, -margin);
        const endY = Math.min(this.height, this.height + margin);
        
        // Create tile meshes for each layer
        const layerHeights = {
            background: 0,
            objects: 0.5,
            collision: 0 // collision layer is invisible
        };
        
        for (let layer of ['background', 'objects']) {
            for (let y = startY; y < endY; y++) {
                for (let x = startX; x < endX; x++) {
                    const tileId = this.getTile(layer, x, y);
                    if (tileId > 0) {
                        const tileCanvas = this.createTileCanvas(tileId);
                        const height = layer === 'objects' ? 2 : 0.1;
                        const mesh = renderer.createTileMesh(
                            tileCanvas,
                            x * this.tileSize - this.width * this.tileSize / 2,
                            y * this.tileSize - this.height * this.tileSize / 2,
                            layerHeights[layer],
                            height
                        );
                        
                        renderer.addToScene(mesh);
                        this.tileMeshes.push(mesh);
                    }
                }
            }
        }
    }
    
    createTileCanvas(tileId) {
        const canvas = document.createElement('canvas');
        canvas.width = this.tileSize;
        canvas.height = this.tileSize;
        const ctx = canvas.getContext('2d');
        
        if (this.tileset) {
            // Calculate tile position in tileset
            const tilesPerRow = 4;
            const tileX = (tileId - 1) % tilesPerRow;
            const tileY = Math.floor((tileId - 1) / tilesPerRow);
            
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(
                this.tileset,
                tileX * this.tileSize, tileY * this.tileSize, this.tileSize, this.tileSize,
                0, 0, this.tileSize, this.tileSize
            );
        }
        
        return canvas;
    }
    
    serialize() {
        return {
            width: this.width,
            height: this.height,
            layers: this.layers
        };
    }
    
    deserialize(data) {
        this.width = data.width;
        this.height = data.height;
        this.layers = data.layers;
    }
}