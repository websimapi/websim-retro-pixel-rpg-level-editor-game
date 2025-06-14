export class Renderer {
    constructor(ctx) {
        this.ctx = ctx;
        this.tileSize = 32;
    }
    
    drawSprite(image, x, y, width = null, height = null) {
        if (!image) return;
        
        const w = width || image.width;
        const h = height || image.height;
        
        this.ctx.save();
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.drawImage(image, Math.floor(x), Math.floor(y), w, h);
        this.ctx.restore();
    }
    
    drawTile(image, tileX, tileY, x, y, tileSize = this.tileSize) {
        if (!image) return;
        
        this.ctx.save();
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.drawImage(
            image,
            tileX * tileSize, tileY * tileSize, tileSize, tileSize,
            Math.floor(x), Math.floor(y), tileSize, tileSize
        );
        this.ctx.restore();
    }
    
    drawRect(x, y, width, height, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, width, height);
    }
    
    drawCircle(x, y, radius, color) {
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawText(text, x, y, color = '#fff', size = 16) {
        this.ctx.fillStyle = color;
        this.ctx.font = `${size}px 'Courier New', monospace`;
        this.ctx.fillText(text, x, y);
    }
    
    clear(color = '#000') {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }
}

