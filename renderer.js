import * as THREE from 'three';

export class Renderer {
    constructor(container) {
        this.container = container;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, 800/600, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: false });
        this.tileSize = 32;
        this.pixelRatio = 1;
        
        this.setupRenderer();
        this.setupCamera();
        this.setupLighting();
        this.createPixelShader();
        this.setupPostProcessing();
    }
    
    setupRenderer() {
        this.renderer.setSize(800, 600);
        this.renderer.setPixelRatio(this.pixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        
        // Disable antialiasing for pixel art
        this.renderer.domElement.style.imageRendering = 'pixelated';
        this.renderer.domElement.style.imageRendering = 'crisp-edges';
        
        this.container.appendChild(this.renderer.domElement);
    }
    
    setupCamera() {
        // Position camera for top-down view with slight angle
        this.camera.position.set(0, 50, 30);
        this.camera.lookAt(0, 0, 0);
        this.camera.rotation.x = -Math.PI / 3; // 60 degree angle
    }
    
    setupLighting() {
        // Ambient light for overall illumination
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        // Directional light for shadows and depth
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 20, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -50;
        directionalLight.shadow.camera.right = 50;
        directionalLight.shadow.camera.top = 50;
        directionalLight.shadow.camera.bottom = -50;
        
        this.scene.add(directionalLight);
    }
    
    createPixelShader() {
        // Custom shader for retro pixel art effect
        this.pixelShaderMaterial = new THREE.ShaderMaterial({
            uniforms: {
                tDiffuse: { value: null },
                pixelSize: { value: 3.0 },
                resolution: { value: new THREE.Vector2(800, 600) }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform float pixelSize;
                uniform vec2 resolution;
                varying vec2 vUv;
                
                void main() {
                    vec2 dxy = pixelSize / resolution;
                    vec2 coord = dxy * floor(vUv / dxy);
                    
                    vec4 color = texture2D(tDiffuse, coord);
                    
                    // Quantize colors for retro effect
                    color.rgb = floor(color.rgb * 16.0) / 16.0;
                    
                    gl_FragColor = color;
                }
            `
        });
    }
    
    setupPostProcessing() {
        // Create render target for post-processing
        this.renderTarget = new THREE.WebGLRenderTarget(800, 600);
        
        // Create quad for post-processing
        const geometry = new THREE.PlaneGeometry(2, 2);
        this.postProcessQuad = new THREE.Mesh(geometry, this.pixelShaderMaterial);
        this.postProcessScene = new THREE.Scene();
        this.postProcessScene.add(this.postProcessQuad);
        
        this.postProcessCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    }
    
    createTileMesh(textureCanvas, x, y, z = 0, height = 0.1) {
        // Create texture from canvas
        const texture = new THREE.CanvasTexture(textureCanvas);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        texture.generateMipmaps = false;
        
        // Create geometry
        const geometry = new THREE.BoxGeometry(this.tileSize, height, this.tileSize);
        
        // Create material
        const material = new THREE.MeshLambertMaterial({ 
            map: texture,
            transparent: true
        });
        
        // Create mesh
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, z + height/2, y);
        mesh.receiveShadow = true;
        mesh.castShadow = true;
        
        return mesh;
    }
    
    createSpriteMesh(textureCanvas, x, y, z = 1, width = 32, height = 48) {
        // Create texture from canvas
        const texture = new THREE.CanvasTexture(textureCanvas);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        texture.generateMipmaps = false;
        
        // Create geometry - plane that faces the camera
        const geometry = new THREE.PlaneGeometry(width, height);
        
        // Create material
        const material = new THREE.MeshLambertMaterial({ 
            map: texture,
            transparent: true,
            alphaTest: 0.1
        });
        
        // Create mesh
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, z + height/2, y);
        mesh.castShadow = true;
        
        // Make sprite always face camera (billboard effect)
        mesh.lookAt(this.camera.position);
        
        return mesh;
    }
    
    updateCamera(playerX, playerY) {
        // Follow player with camera
        const cameraOffset = new THREE.Vector3(0, 50, 30);
        this.camera.position.set(
            playerX + cameraOffset.x,
            cameraOffset.y,
            playerY + cameraOffset.z
        );
        this.camera.lookAt(playerX, 0, playerY);
    }
    
    render() {
        // Render scene to render target
        this.renderer.setRenderTarget(this.renderTarget);
        this.renderer.render(this.scene, this.camera);
        
        // Apply pixel shader post-processing
        this.pixelShaderMaterial.uniforms.tDiffuse.value = this.renderTarget.texture;
        this.renderer.setRenderTarget(null);
        this.renderer.render(this.postProcessScene, this.postProcessCamera);
    }
    
    resize(width, height) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
        this.renderTarget.setSize(width, height);
        this.pixelShaderMaterial.uniforms.resolution.value.set(width, height);
    }
    
    addToScene(object) {
        this.scene.add(object);
    }
    
    removeFromScene(object) {
        this.scene.remove(object);
    }
    
    // Legacy methods for compatibility
    drawRect(x, y, width, height, color) {
        console.warn('drawRect is deprecated in 3D renderer');
    }
    
    drawCircle(x, y, radius, color) {
        console.warn('drawCircle is deprecated in 3D renderer');
    }
    
    drawText(text, x, y, color = '#fff', size = 16) {
        console.warn('drawText is deprecated in 3D renderer');
    }
    
    clear(color = '#000') {
        this.scene.background = new THREE.Color(color);
    }
}