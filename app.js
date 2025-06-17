// Skeletal Dragon Interactive Animation
class SkeletalDragon {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.mouse = { x: 0, y: 0, active: false };
        this.particles = [];
        this.bones = [];
        this.frameCount = 0;
        this.lastTime = 0;
        this.fps = 60;
        
        // Dragon configuration
        this.config = {
            headSize: 60,
            spineSegments: 12,
            ribPairs: 8,
            tailSegments: 15,
            wingSpan: 200,
            smoothing: 0.15,
            maxDistance: 150,
            breathingSpeed: 0.02,
            glowIntensity: 0.8
        };
        
        this.init();
    }
    
    init() {
        this.resize();
        this.createDragonStructure();
        this.setupEventListeners();
        this.animate();
        
        // Initial position
        this.mouse.x = this.canvas.width / 2;
        this.mouse.y = this.canvas.height / 2;
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    createDragonStructure() {
        this.bones = [];
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Create head bone (follows mouse directly)
        this.bones.push({
            type: 'head',
            x: centerX,
            y: centerY,
            targetX: centerX,
            targetY: centerY,
            size: this.config.headSize,
            angle: 0,
            glow: 1
        });
        
        // Create spine segments
        for (let i = 1; i <= this.config.spineSegments; i++) {
            this.bones.push({
                type: 'spine',
                x: centerX,
                y: centerY + (i * 25),
                targetX: centerX,
                targetY: centerY + (i * 25),
                size: Math.max(20, this.config.headSize - (i * 3)),
                segmentIndex: i,
                angle: 0,
                glow: Math.max(0.3, 1 - (i * 0.05))
            });
        }
        
        // Create tail segments
        for (let i = 1; i <= this.config.tailSegments; i++) {
            const baseIndex = this.config.spineSegments;
            this.bones.push({
                type: 'tail',
                x: centerX,
                y: centerY + ((baseIndex + i) * 20),
                targetX: centerX,
                targetY: centerY + ((baseIndex + i) * 20),
                size: Math.max(5, 20 - (i * 1.2)),
                segmentIndex: i,
                angle: 0,
                glow: Math.max(0.1, 0.5 - (i * 0.02))
            });
        }
        
        // Create wing bones
        this.createWingBones(centerX, centerY);
        
        // Create rib bones
        this.createRibBones(centerX, centerY);
    }
    
    createWingBones(centerX, centerY) {
        const wingPositions = [
            { side: 'left', x: centerX - 80, y: centerY + 60 },
            { side: 'right', x: centerX + 80, y: centerY + 60 }
        ];
        
        wingPositions.forEach(wing => {
            // Wing shoulder
            this.bones.push({
                type: 'wing_shoulder',
                side: wing.side,
                x: wing.x,
                y: wing.y,
                targetX: wing.x,
                targetY: wing.y,
                size: 25,
                angle: 0,
                glow: 0.6
            });
            
            // Wing segments
            for (let i = 1; i <= 4; i++) {
                const wingX = wing.x + (wing.side === 'left' ? -30 * i : 30 * i);
                const wingY = wing.y + (10 * i);
                
                this.bones.push({
                    type: 'wing_bone',
                    side: wing.side,
                    x: wingX,
                    y: wingY,
                    targetX: wingX,
                    targetY: wingY,
                    size: Math.max(8, 20 - (i * 3)),
                    segmentIndex: i,
                    angle: 0,
                    glow: Math.max(0.2, 0.6 - (i * 0.1))
                });
            }
        });
    }
    
    createRibBones(centerX, centerY) {
        for (let i = 0; i < this.config.ribPairs; i++) {
            const ribY = centerY + 40 + (i * 25);
            const ribSize = Math.max(15, 40 - (i * 3));
            
            // Left rib
            this.bones.push({
                type: 'rib',
                side: 'left',
                x: centerX - ribSize,
                y: ribY,
                targetX: centerX - ribSize,
                targetY: ribY,
                size: 12,
                ribIndex: i,
                angle: 0,
                glow: 0.4
            });
            
            // Right rib
            this.bones.push({
                type: 'rib',
                side: 'right',
                x: centerX + ribSize,
                y: ribY,
                targetX: centerX + ribSize,
                targetY: ribY,
                size: 12,
                ribIndex: i,
                angle: 0,
                glow: 0.4
            });
        }
    }
    
    setupEventListeners() {
        // Mouse movement
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
            this.mouse.active = true;
            
            // Update custom cursor
            this.updateCustomCursor(e.clientX, e.clientY);
        });
        
        // Touch support
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = touch.clientX - rect.left;
            this.mouse.y = touch.clientY - rect.top;
            this.mouse.active = true;
        });
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.mouse.active = true;
        });
        
        this.canvas.addEventListener('mouseleave', () => {
            this.mouse.active = false;
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            this.resize();
            this.createDragonStructure();
        });
    }
    
    updateCustomCursor(x, y) {
        const cursor = document.getElementById('customCursor');
        if (cursor) {
            cursor.style.left = (x - 10) + 'px';
            cursor.style.top = (y - 10) + 'px';
        }
    }
    
    updatePhysics() {
        if (this.bones.length === 0) return;
        
        const breathing = Math.sin(this.frameCount * this.config.breathingSpeed) * 0.3;
        
        // Update head to follow mouse
        const head = this.bones[0];
        if (this.mouse.active) {
            head.targetX = this.mouse.x;
            head.targetY = this.mouse.y;
        }
        
        // Smooth head movement
        head.x += (head.targetX - head.x) * this.config.smoothing;
        head.y += (head.targetY - head.y) * this.config.smoothing;
        head.angle = Math.atan2(head.targetY - head.y, head.targetX - head.x);
        
        // Update spine and tail with following physics
        for (let i = 1; i < this.bones.length; i++) {
            const bone = this.bones[i];
            const prevBone = this.bones[i - 1];
            
            if (bone.type === 'spine' || bone.type === 'tail') {
                // Calculate ideal position behind previous bone
                const distance = bone.type === 'spine' ? 25 : 20;
                const angle = prevBone.angle || 0;
                
                bone.targetX = prevBone.x - Math.cos(angle) * distance;
                bone.targetY = prevBone.y - Math.sin(angle) * distance;
                
                // Add breathing effect
                if (bone.type === 'spine') {
                    bone.targetY += breathing * bone.segmentIndex;
                }
                
                // Smooth movement
                bone.x += (bone.targetX - bone.x) * (this.config.smoothing * 0.8);
                bone.y += (bone.targetY - bone.y) * (this.config.smoothing * 0.8);
                bone.angle = Math.atan2(bone.targetY - bone.y, bone.targetX - bone.x);
            }
        }
        
        // Update wing and rib positions relative to spine
        this.updateWingsAndRibs();
        
        // Create particles from dragon movement
        this.createMovementParticles();
        
        // Update existing particles
        this.updateParticles();
    }
    
    updateWingsAndRibs() {
        const spineCenter = this.bones.find(bone => bone.type === 'spine' && bone.segmentIndex === 3);
        if (!spineCenter) return;
        
        // Update wings relative to spine
        this.bones.forEach(bone => {
            if (bone.type === 'wing_shoulder') {
                const offset = bone.side === 'left' ? -80 : 80;
                bone.targetX = spineCenter.x + offset;
                bone.targetY = spineCenter.y + 20;
                bone.x += (bone.targetX - bone.x) * 0.1;
                bone.y += (bone.targetY - bone.y) * 0.1;
            }
            
            if (bone.type === 'wing_bone') {
                const shoulder = this.bones.find(b => 
                    b.type === 'wing_shoulder' && b.side === bone.side);
                if (shoulder) {
                    const wingSpread = Math.sin(this.frameCount * 0.03) * 0.3 + 0.7;
                    const offset = bone.side === 'left' ? -30 : 30;
                    bone.targetX = shoulder.x + (offset * bone.segmentIndex * wingSpread);
                    bone.targetY = shoulder.y + (15 * bone.segmentIndex);
                    bone.x += (bone.targetX - bone.x) * 0.12;
                    bone.y += (bone.targetY - bone.y) * 0.12;
                }
            }
            
            // Update ribs
            if (bone.type === 'rib') {
                const spineSegment = this.bones.find(b => 
                    b.type === 'spine' && b.segmentIndex === bone.ribIndex + 2);
                if (spineSegment) {
                    const ribExpansion = Math.sin(this.frameCount * this.config.breathingSpeed) * 5;
                    const baseOffset = 40 - (bone.ribIndex * 3);
                    const offset = bone.side === 'left' ? 
                        -(baseOffset + ribExpansion) : (baseOffset + ribExpansion);
                    
                    bone.targetX = spineSegment.x + offset;
                    bone.targetY = spineSegment.y;
                    bone.x += (bone.targetX - bone.x) * 0.15;
                    bone.y += (bone.targetY - bone.y) * 0.15;
                }
            }
        });
    }
    
    createMovementParticles() {
        if (Math.random() < 0.3) {
            const head = this.bones[0];
            const velocity = Math.sqrt(
                Math.pow(head.targetX - head.x, 2) + 
                Math.pow(head.targetY - head.y, 2)
            );
            
            if (velocity > 1) {
                this.particles.push({
                    x: head.x + (Math.random() - 0.5) * 20,
                    y: head.y + (Math.random() - 0.5) * 20,
                    vx: (Math.random() - 0.5) * 2,
                    vy: (Math.random() - 0.5) * 2,
                    life: 1,
                    decay: 0.02,
                    size: Math.random() * 3 + 1,
                    glow: Math.random() * 0.8 + 0.2
                });
            }
        }
    }
    
    updateParticles() {
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= particle.decay;
            particle.vx *= 0.98;
            particle.vy *= 0.98;
            return particle.life > 0;
        });
    }
    
    render() {
        // Clear canvas with fade effect
        this.ctx.fillStyle = 'rgba(26, 26, 46, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw connection line from mouse to head
        if (this.mouse.active && this.bones.length > 0) {
            this.drawConnectionLine();
        }
        
        // Draw bones
        this.drawSkeleton();
        
        // Draw particles
        this.drawParticles();
        
        // Draw detailed skull
        this.drawSkull();
    }
    
    drawConnectionLine() {
        const head = this.bones[0];
        this.ctx.save();
        this.ctx.strokeStyle = `rgba(50, 184, 198, 0.3)`;
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 10]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.mouse.x, this.mouse.y);
        this.ctx.lineTo(head.x, head.y);
        this.ctx.stroke();
        this.ctx.restore();
    }
    
    drawSkeleton() {
        this.bones.forEach(bone => {
            this.ctx.save();
            
            // Bone glow effect
            const glowRadius = bone.size * (1 + bone.glow * 0.5);
            const gradient = this.ctx.createRadialGradient(
                bone.x, bone.y, 0,
                bone.x, bone.y, glowRadius
            );
            gradient.addColorStop(0, `rgba(255, 248, 220, ${bone.glow * 0.8})`);
            gradient.addColorStop(0.5, `rgba(255, 248, 220, ${bone.glow * 0.4})`);
            gradient.addColorStop(1, 'rgba(255, 248, 220, 0)');
            
            // Draw glow
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(bone.x, bone.y, glowRadius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw bone
            this.ctx.fillStyle = '#f8f8dc';
            this.ctx.strokeStyle = '#e6e6b8';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(bone.x, bone.y, bone.size / 3, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
            
            // Draw bone connections
            if (bone.type === 'spine' || bone.type === 'tail') {
                const prevBone = this.bones[this.bones.indexOf(bone) - 1];
                if (prevBone) {
                    this.drawBoneConnection(prevBone, bone);
                }
            }
            
            this.ctx.restore();
        });
    }
    
    drawBoneConnection(bone1, bone2) {
        this.ctx.save();
        this.ctx.strokeStyle = '#e6e6b8';
        this.ctx.lineWidth = 8;
        this.ctx.lineCap = 'round';
        
        // Draw main connection
        this.ctx.beginPath();
        this.ctx.moveTo(bone1.x, bone1.y);
        this.ctx.lineTo(bone2.x, bone2.y);
        this.ctx.stroke();
        
        // Add bone texture
        this.ctx.strokeStyle = '#d4d4aa';
        this.ctx.lineWidth = 4;
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    drawSkull() {
        const head = this.bones[0];
        if (!head) return;
        
        this.ctx.save();
        this.ctx.translate(head.x, head.y);
        this.ctx.rotate(head.angle);
        
        // Skull outline
        this.ctx.fillStyle = '#f8f8dc';
        this.ctx.strokeStyle = '#e6e6b8';
        this.ctx.lineWidth = 3;
        
        // Main skull
        this.ctx.beginPath();
        this.ctx.arc(-10, 0, 25, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        
        // Snout
        this.ctx.beginPath();
        this.ctx.arc(15, 0, 15, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        
        // Eye sockets
        this.ctx.fillStyle = '#2a2a2a';
        this.ctx.beginPath();
        this.ctx.arc(-5, -8, 6, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(-5, 8, 6, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Horns
        this.ctx.strokeStyle = '#d4d4aa';
        this.ctx.lineWidth = 4;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(-25, -15);
        this.ctx.lineTo(-35, -25);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(-25, 15);
        this.ctx.lineTo(-35, 25);
        this.ctx.stroke();
        
        // Jaw
        this.ctx.fillStyle = '#f0f0c8';
        this.ctx.beginPath();
        this.ctx.arc(20, 5, 8, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    drawParticles() {
        this.particles.forEach(particle => {
            this.ctx.save();
            
            const alpha = particle.life * particle.glow;
            this.ctx.fillStyle = `rgba(255, 248, 220, ${alpha})`;
            
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.restore();
        });
    }
    
    animate(currentTime = 0) {
        // Calculate FPS
        if (currentTime - this.lastTime >= 1000) {
            this.fps = Math.round(this.frameCount * 1000 / (currentTime - this.lastTime));
            this.frameCount = 0;
            this.lastTime = currentTime;
            this.updateFPSDisplay();
        }
        this.frameCount++;
        
        this.updatePhysics();
        this.render();
        
        requestAnimationFrame((time) => this.animate(time));
    }
    
    updateFPSDisplay() {
        const fpsCounter = document.getElementById('fpsCounter');
        if (fpsCounter) {
            fpsCounter.textContent = `${this.fps} FPS`;
        }
    }
}

// Application initialization
class DragonApp {
    constructor() {
        this.dragon = null;
        this.init();
    }
    
    init() {
        const canvas = document.getElementById('dragonCanvas');
        this.dragon = new SkeletalDragon(canvas);
        this.setupUI();
    }
    
    setupUI() {
        // Get DOM elements
        const toggleBtn = document.getElementById('toggleInstructions');
        const overlay = document.getElementById('instructionsOverlay');
        const closeBtn = document.getElementById('closeInstructions');
        
        // Function to close the overlay
        const closeOverlay = () => {
            if (overlay) {
                overlay.classList.add('hidden');
            }
        };
        
        // Function to open the overlay
        const openOverlay = () => {
            if (overlay) {
                overlay.classList.remove('hidden');
            }
        };
        
        // Event listeners
        if (toggleBtn) {
            toggleBtn.addEventListener('click', openOverlay);
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('click', closeOverlay);
        }
        
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    closeOverlay();
                }
            });
        }
        
        // Close with ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeOverlay();
            }
        });
        
        // Show instructions on first load with a delay
        setTimeout(() => {
            openOverlay();
        }, 1000);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new DragonApp();
});