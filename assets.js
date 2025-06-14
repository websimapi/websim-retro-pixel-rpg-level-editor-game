export class AssetManager {
    constructor() {
        this.assets = new Map();
        this.setupAssetGenerator();
    }
    
    setupAssetGenerator() {
        document.getElementById('generateAssetBtn').addEventListener('click', () => {
            this.generateAsset();
        });
        
        document.getElementById('addToTilesetBtn').addEventListener('click', () => {
            this.addToTileset();
        });
        
        document.getElementById('downloadAssetBtn').addEventListener('click', () => {
            this.downloadAsset();
        });
    }
    
    async generateAsset() {
        const prompt = document.getElementById('assetPrompt').value.trim();
        const assetType = document.getElementById('assetType').value;
        const transparent = document.getElementById('transparentBg').checked;
        
        if (!prompt) {
            alert('Please enter an asset description');
            return;
        }
        
        // Show loading overlay
        document.getElementById('loadingOverlay').style.display = 'flex';
        
        try {
            // Determine size based on asset type
            let width, height;
            switch (assetType) {
                case 'tile':
                    width = height = 32;
                    break;
                case 'character':
                    width = 32;
                    height = 48;
                    break;
                case 'item':
                    width = height = 24;
                    break;
                case 'object':
                    width = height = 64;
                    break;
                default:
                    width = height = 32;
            }
            
            // Enhanced prompt for better pixel art results
            const enhancedPrompt = `${prompt}, pixel art style, 16-bit game sprite, retro gaming, crisp pixels, no blur, detailed pixel work`;
            
            // Generate image using websim's AI image generation
            const result = await websim.imageGen({
                prompt: enhancedPrompt,
                width: width,
                height: height,
                transparent: transparent
            });
            
            // Process the generated image
            await this.processGeneratedAsset(result.url, assetType);
            
        } catch (error) {
            console.error('Error generating asset:', error);
            alert('Failed to generate asset. Please try again.');
        } finally {
            // Hide loading overlay
            document.getElementById('loadingOverlay').style.display = 'none';
        }
    }
    
    async processGeneratedAsset(imageUrl, assetType) {
        // Create image element
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        return new Promise((resolve, reject) => {
            img.onload = async () => {
                try {
                    // Apply transparency algorithm if needed
                    const processedCanvas = await this.makeBackgroundTransparent(img);
                    
                    // Store the asset
                    const assetId = `generated_${Date.now()}`;
                    this.assets.set(assetId, {
                        canvas: processedCanvas,
                        type: assetType,
                        url: processedCanvas.toDataURL()
                    });
                    
                    // Show preview
                    this.showAssetPreview(processedCanvas, assetId);
                    
                    // Update asset library
                    this.updateAssetLibrary();
                    
                    resolve();
                } catch (error) {
                    reject(error);
                }
            };
            
            img.onerror = reject;
            img.src = imageUrl;
        });
    }
    
    async makeBackgroundTransparent(img) {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        
        // Draw the image
        ctx.drawImage(img, 0, 0);
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Algorithm to detect and remove background
        // Sample corners to determine background color
        const corners = [
            [0, 0], // top-left
            [canvas.width - 1, 0], // top-right
            [0, canvas.height - 1], // bottom-left
            [canvas.width - 1, canvas.height - 1] // bottom-right
        ];
        
        // Get most common corner color as background
        const cornerColors = corners.map(([x, y]) => {
            const index = (y * canvas.width + x) * 4;
            return {
                r: data[index],
                g: data[index + 1],
                b: data[index + 2]
            };
        });
        
        // Use first corner as reference background color
        const bgColor = cornerColors[0];
        const threshold = 30; // Color similarity threshold
        
        // Make similar colors transparent
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Calculate color distance
            const colorDistance = Math.sqrt(
                Math.pow(r - bgColor.r, 2) +
                Math.pow(g - bgColor.g, 2) +
                Math.pow(b - bgColor.b, 2)
            );
            
            // If color is similar to background, make it transparent
            if (colorDistance < threshold) {
                data[i + 3] = 0; // Set alpha to 0
            }
        }
        
        // Put the modified image data back
        ctx.putImageData(imageData, 0, 0);
        
        return canvas;
    }
    
    showAssetPreview(canvas, assetId) {
        const preview = document.getElementById('assetPreview');
        const generatedAsset = document.getElementById('generatedAsset');
        
        preview.innerHTML = '';
        
        const img = document.createElement('img');
        img.src = canvas.toDataURL();
        img.style.maxWidth = '128px';
        img.style.maxHeight = '128px';
        img.style.imageRendering = 'pixelated';
        img.style.border = '2px solid #00ff88';
        img.style.background = 'rgba(255, 255, 255, 0.1)';
        
        preview.appendChild(img);
        generatedAsset.style.display = 'block';
        
        // Store current asset ID for actions
        this.currentAssetId = assetId;
    }
    
    addToTileset() {
        if (!this.currentAssetId) return;
        
        const asset = this.assets.get(this.currentAssetId);
        if (!asset) return;
        
        // Add to game's tileset (this would need to be implemented based on your tileset system)
        console.log('Adding to tileset:', asset);
        alert('Asset added to tileset! (Implementation needed)');
    }
    
    downloadAsset() {
        if (!this.currentAssetId) return;
        
        const asset = this.assets.get(this.currentAssetId);
        if (!asset) return;
        
        // Create download link
        const link = document.createElement('a');
        link.download = `asset_${this.currentAssetId}.png`;
        link.href = asset.canvas.toDataURL();
        link.click();
    }
    
    updateAssetLibrary() {
        const assetGrid = document.getElementById('assetGrid');
        assetGrid.innerHTML = '';
        
        this.assets.forEach((asset, id) => {
            const item = document.createElement('div');
            item.className = 'asset-item';
            item.style.backgroundImage = `url(${asset.url})`;
            item.style.backgroundSize = 'contain';
            item.style.backgroundRepeat = 'no-repeat';
            item.style.backgroundPosition = 'center';
            
            item.addEventListener('click', () => {
                this.selectAsset(id);
            });
            
            assetGrid.appendChild(item);
        });
    }
    
    selectAsset(assetId) {
        // Highlight selected asset
        document.querySelectorAll('.asset-item').forEach(item => {
            item.style.borderColor = '#333';
        });
        
        event.target.style.borderColor = '#00ff88';
        
        // Show in preview
        const asset = this.assets.get(assetId);
        if (asset) {
            this.showAssetPreview(asset.canvas, assetId);
        }
    }
    
    async loadDefaultAssets() {
        // Generate some default assets
        const defaultAssets = [
            { prompt: 'grass tile, green pixel art', type: 'tile' },
            { prompt: 'stone wall, gray pixel art', type: 'tile' },
            { prompt: 'tree, green brown pixel art', type: 'object' },
            { prompt: 'water tile, blue pixel art', type: 'tile' }
        ];
        
        for (let asset of defaultAssets) {
            document.getElementById('assetPrompt').value = asset.prompt;
            document.getElementById('assetType').value = asset.type;
            await this.generateAsset();
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait between generations
        }
    }
    
    async loadDefaultTileset() {
        // This creates a basic tileset for the game to start with
        // In a real implementation, you'd load actual sprite files
        console.log('Loading default tileset...');
    }
}

