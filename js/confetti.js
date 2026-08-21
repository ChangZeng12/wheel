/**
 * Confetti & Particle Physics Celebration Engine - Nintendo Switch 2 Style
 * Features: Pure geometric shapes (rectangles, squares, triangles), solid vibrant Switch palette.
 */
class ConfettiEngine {
  constructor(canvasId = 'confettiCanvas') {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.particles = [];
    this.animationFrameId = null;
    
    // Flat Solid Colors (Nintendo Switch Palette, No blue/purple gradients)
    this.colors = [
      '#E60012', '#F5A623', '#00C389', '#FF6B00', 
      '#FF5A5F', '#FFCC00', '#2D2D2D', '#00B4D8'
    ];

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    if (!this.canvas) return;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * window.devicePixelRatio;
    this.canvas.height = this.height * window.devicePixelRatio;
    if (this.ctx) {
      this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
  }

  /**
   * Launch celebratory burst of flat geometric confetti
   */
  burst(count = 140) {
    if (!this.canvas || !this.ctx) return;
    this.resize();

    const originX = this.width / 2;
    const originY = this.height / 2 - 50;
    const shapes = ['rect', 'square', 'triangle'];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 16 + 6;
      const size = Math.random() * 8 + 6;
      const shape = shapes[Math.floor(Math.random() * shapes.length)];

      this.particles.push({
        x: originX + (Math.random() - 0.5) * 60,
        y: originY + (Math.random() - 0.5) * 60,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 5,
        size: size,
        color: this.colors[Math.floor(Math.random() * this.colors.length)],
        shape: shape,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
        gravity: 0.35,
        friction: 0.96,
        opacity: 1,
        life: 1.0,
        decay: Math.random() * 0.012 + 0.008
      });
    }

    // Side cannons
    for (let i = 0; i < 30; i++) {
      // Left cannon
      this.particles.push({
        x: 0,
        y: this.height * 0.7,
        vx: Math.random() * 12 + 8,
        vy: -(Math.random() * 15 + 10),
        size: Math.random() * 8 + 5,
        color: this.colors[Math.floor(Math.random() * this.colors.length)],
        shape: 'rect',
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 14,
        gravity: 0.36,
        friction: 0.97,
        opacity: 1,
        life: 1.0,
        decay: Math.random() * 0.01 + 0.008
      });

      // Right cannon
      this.particles.push({
        x: this.width,
        y: this.height * 0.7,
        vx: -(Math.random() * 12 + 8),
        vy: -(Math.random() * 15 + 10),
        size: Math.random() * 8 + 5,
        color: this.colors[Math.floor(Math.random() * this.colors.length)],
        shape: 'rect',
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 14,
        gravity: 0.36,
        friction: 0.97,
        opacity: 1,
        life: 1.0,
        decay: Math.random() * 0.01 + 0.008
      });
    }

    if (!this.animationFrameId) {
      this.loop();
    }
  }

  loop() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.width, this.height);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      p.vx *= p.friction;
      p.vy *= p.friction;
      p.vy += p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;
      p.life -= p.decay;
      p.opacity = Math.max(0, p.life);

      if (p.life <= 0 || p.y > this.height + 50) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate((p.rotation * Math.PI) / 180);
      this.ctx.globalAlpha = p.opacity;
      this.ctx.fillStyle = p.color;

      if (p.shape === 'rect') {
        this.ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      } else if (p.shape === 'square') {
        this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      } else if (p.shape === 'triangle') {
        this.ctx.beginPath();
        this.ctx.moveTo(0, -p.size / 2);
        this.ctx.lineTo(p.size / 2, p.size / 2);
        this.ctx.lineTo(-p.size / 2, p.size / 2);
        this.ctx.closePath();
        this.ctx.fill();
      }

      this.ctx.restore();
    }

    if (this.particles.length > 0) {
      this.animationFrameId = requestAnimationFrame(() => this.loop());
    } else {
      this.animationFrameId = null;
      this.ctx.clearRect(0, 0, this.width, this.height);
    }
  }

  stop() {
    this.particles = [];
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.width, this.height);
    }
  }
}

window.confettiEngine = new ConfettiEngine('confettiCanvas');
