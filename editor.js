export class Editor {
    constructor() {
        this.canvas = document.getElementById('levelCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.active = false;
        
        this.currentTool = 'brush';
        this.currentLayer = 'background';
        this.selectedTile = 1;
        
        this.map = null;
        this.tileset = null;
        
        this.setupEventListeners();
        this.loadTiles();
    }
    
    setupEventListeners() {
        // Tool selection
        document.getElementById('brushTool').addEventListener('click', () => {
            this.setTool('brush');
        });
        
        document.getElementById('eraseTool').addEventListener('click', () => {
            this.setTool('erase');
        });
        
        document.getElementById('fillTool').addEventListener('click', () => {
            this.setTool('fill');
        });
        
        // Layer selection
        document.getElementById('layerSelect').addEventListener('change', (e) => {
            this.currentLayer = e.target.value;
        });
        
        // Canvas interaction
        this.canvas.addEventListener('mousedown', (e) => {
            if (!this.active) return;
            this.startDrawing(e);
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.active) return;
            this.draw(e);
        });
        
        this.canvas.addEventListener('mouseup', () => {
            this.stopDrawing();
        });
        
        // Map operations
        document.getElementById('newMapBtn').addEventListener('click', () => {
            this.newMap();
        });
        
        document.getElementById('saveMapBtn').addEventListener('click', () => {
            this.saveMap();
        });
        
        document.getElementById('loadMapBtn').addEventListener('click', () => {
            this.loadMap();
        });
        
        this.isDrawing = false;
    }
    
    setTool(tool) {
        this.currentTool = tool;
        
        // Update UI
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(tool + 'Tool').classList.add('active');
    }
    
    activate() {
        this.active = true;
        this.map = window.game.map; // Get reference to main game map
        this.tileset = this.map.tileset;
        this.render();
    }
    
    async loadTiles() {
        // Load tileset for tile picker
        const tilesetGrid = document.getElementById('tilesetGrid');
        
        // Wait for game to initialize tileset
        setTimeout(() => {
            if (window.game && window.game.map.tileset) {
                this.populateTileset(window.game.map.tileset);
            }
        }, 1000);
    }
    
    populateTileset(tileset) {
        const tilesetGrid = document.getElementById('tilesetGrid');
        tilesetGrid.innerHTML = '';
        
        const tilesPerRow = 4;
        const totalTiles = 16; // Assuming 4x4 tileset
        
        for (let i = 0; i < totalTiles; i++) {
            const tile = document.createElement('canvas');
            tile.width = 32;
            tile.height = 32;
            tile.className = 'tileset-tile';
            
            const ctx = tile.getContext('2d');
            ctx.imageSmoothingEnabled = false;
            
            // Draw tile from tileset
            const tileX = i % tilesPerRow;
            const tileY = Math.floor(i / tilesPerRow);
            
            ctx.drawImage(
                tileset,
                tileX * 32, tileY * 32, 32, 32,
                0, 0, 32, 32
            );
            
            tile.addEventListener('click', () => {
                document.querySelectorAll('.tileset-tile').forEach(t => {
                    t.classList.remove('selected');
                });
                tile.classList.add('selected');
                this.selectedTile = i + 1;
            });
            
            tilesetGrid.appendChild(tile);
        }
        
        // Select first tile by default
        if (tilesetGrid.firstChild) {
            tilesetGrid.firstChild.classList.add('selected');
        }
    }
    
    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / 32);
        const y = Math.floor((e.clientY - rect.top) / 32);
        return { x, y };
    }
    
    startDrawing(e) {
        this.isDrawing = true;
        this.draw(e);
    }
    
    draw(e) {
        if (!this.isDrawing || !this.map) return;
        
        const pos = this.getMousePos(e);
        
        switch (this.currentTool) {
            case 'brush':
                this.placeTile(pos.x, pos.y);
                break;
            case 'erase':
                this.eraseTile(pos.x, pos.y);
                break;
            case 'fill':
                if (this.isDrawing) {
                    this.floodFill(pos.x, pos.y);
                    this.isDrawing = false; // Only fill once per click
                }
                break;
        }
        
        this.render();
    }
    
    stopDrawing() {
        this.isDrawing = false;
    }
    
    placeTile(x, y) {
        this.map.setTile(this.currentLayer, x, y, this.selectedTile);
        
        // Auto-set collision for certain tiles
        if (this.currentLayer === 'objects' && this.selectedTile > 1) {
            this.map.setTile('collision', x, y, 1);
        }
    }
    
    eraseTile(x, y) {
        this.map.setTile(this.currentLayer, x, y, 0);
        
        // Clear collision when erasing objects
        if (this.currentLayer === 'objects') {
            this.map.setTile('collision', x, y, 0);
        }
    }
    
    floodFill(startX, startY) {
        const targetTile = this.map.getTile(this.currentLayer, startX, startY);
        if (targetTile === this.selectedTile) return;
        
        const stack = [[startX, startY]];
        const visited = new Set();
        
        while (stack.length > 0) {
            const [x, y] = stack.pop();
            const key = `${x},${y}`;
            
            if (visited.has(key)) continue;
            if (x < 0 || x >= this.map.width || y < 0 || y >= this.map.height) continue;
            if (this.map.getTile(this.currentLayer, x, y) !== targetTile) continue;
            
            visited.add(key);
            this.map.setTile(this.currentLayer, x, y, this.selectedTile);
            
            // Add neighbors
            stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
        }
    }
    
    render() {
        if (!this.map || !this.tileset) return;
        
        // Clear canvas
        this.ctx.fillStyle = '#222';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Calculate visible area
        const tilesX = Math.ceil(this.canvas.width / 32);
        const tilesY = Math.ceil(this.canvas.height / 32);
        
        // Render layers
        const layerOrder = ['background', 'objects'];
        
        for (let layer of layerOrder) {
            // Skip collision layer in normal view
            if (layer === 'collision' && this.currentLayer !== 'collision') continue;
            
            for (let y = 0; y < tilesY && y < this.map.height; y++) {
                for (let x = 0; x < tilesX && x < this.map.width; x++) {
                    const tileId = this.map.getTile(layer, x, y);
                    if (tileId > 0) {
                        this.renderTile(tileId, x * 32, y * 32);
                    }
                }
            }
        }
        
        // Render collision overlay if collision layer is selected
        if (this.currentLayer === 'collision') {
            this.ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            for (let y = 0; y < tilesY && y < this.map.height; y++) {
                for (let x = 0; x < tilesX && x < this.map.width; x++) {
                    if (this.map.getTile('collision', x, y) === 1) {
                        this.ctx.fillRect(x * 32, y * 32, 32, 32);
                    }
                }
            }
        }
        
        // Draw grid
        this.drawGrid();
    }
    
    renderTile(tileId, x, y) {
        const tilesPerRow = 4;
        const tileX = (tileId - 1) % tilesPerRow;
        const tileY = Math.floor((tileId - 1) / tilesPerRow);
        
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.drawImage(
            this.tileset,
            tileX * 32, tileY * 32, 32, 32,
            x, y, 32, 32
        );
    }
    
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 1;
        
        // Vertical lines
        for (let x = 0; x <= this.canvas.width; x += 32) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = 0; y <= this.canvas.height; y += 32) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }
    
    newMap() {
        if (confirm('Create a new map? This will lose any unsaved changes.')) {
            this.map.generateDefaultMap();
            this.render();
        }
    }
    
    saveMap() {
        const mapData = this.map.serialize();
        const dataStr = JSON.stringify(mapData, null, 2);
        
        // Create download link
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'map.json';
        a.click();
        
        URL.revokeObjectURL(url);
    }
    
    loadMap() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const mapData = JSON.parse(e.target.result);
                    this.map.deserialize(mapData);
                    this.render();
                } catch (err) {
                    alert('Error loading map: ' + err.message);
                }
            };
            reader.readAsText(file);
        };
        
        input.click();
    }
}

