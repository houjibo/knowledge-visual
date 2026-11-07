// animation.js - 知识可视化项目动画工具

// 动画控制器
class AnimationController {
  constructor() {
    this.animations = [];
    this.running = false;
  }
  
  add(animation) {
    this.animations.push(animation);
  }
  
  start() {
    this.running = true;
    this.loop();
  }
  
  stop() {
    this.running = false;
  }
  
  loop() {
    if (!this.running) return;
    this.animations.forEach(anim => anim.update());
    requestAnimationFrame(() => this.loop());
  }
}

// 粒子系统
class Particle {
  constructor(x, y, options = {}) {
    this.x = x;
    this.y = y;
    this.vx = options.vx || (Math.random() - 0.5) * 2;
    this.vy = options.vy || (Math.random() - 0.5) * 2;
    this.life = options.life || 100;
    this.maxLife = this.life;
    this.size = options.size || 3;
    this.color = options.color || '#4ecdc4';
    this.gravity = options.gravity || 0;
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;
    this.life--;
  }
  
  draw(ctx) {
    const alpha = this.life / this.maxLife;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  
  isDead() {
    return this.life <= 0;
  }
}

// 粒子发射器
class ParticleEmitter {
  constructor(x, y, options = {}) {
    this.x = x;
    this.y = y;
    this.particles = [];
    this.emitRate = options.emitRate || 5;
    this.particleOptions = options.particleOptions || {};
  }
  
  emit() {
    for (let i = 0; i < this.emitRate; i++) {
      this.particles.push(new Particle(this.x, this.y, this.particleOptions));
    }
  }
  
  update() {
    this.emit();
    this.particles = this.particles.filter(p => {
      p.update();
      return !p.isDead();
    });
  }
  
  draw(ctx) {
    this.particles.forEach(p => p.draw(ctx));
  }
}

// 路径动画
class PathAnimation {
  constructor(points, speed = 1) {
    this.points = points;
    this.speed = speed;
    this.progress = 0;
    this.currentPoint = 0;
  }
  
  update() {
    this.progress += this.speed;
    if (this.progress >= 1) {
      this.progress = 0;
      this.currentPoint = (this.currentPoint + 1) % (this.points.length - 1);
    }
  }
  
  getPosition() {
    const p1 = this.points[this.currentPoint];
    const p2 = this.points[this.currentPoint + 1] || this.points[0];
    return {
      x: p1.x + (p2.x - p1.x) * this.progress,
      y: p1.y + (p2.y - p1.y) * this.progress
    };
  }
}

// 波形动画
class WaveAnimation {
  constructor(options = {}) {
    this.amplitude = options.amplitude || 50;
    this.frequency = options.frequency || 0.02;
    this.phase = options.phase || 0;
    this.speed = options.speed || 0.05;
  }
  
  update() {
    this.phase += this.speed;
  }
  
  getY(x, baseY = 0) {
    return baseY + Math.sin(x * this.frequency + this.phase) * this.amplitude;
  }
  
  draw(ctx, width, baseY, color = '#4ecdc4') {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x < width; x++) {
      const y = this.getY(x, baseY);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

// 导出
window.AnimationController = AnimationController;
window.Particle = Particle;
window.ParticleEmitter = ParticleEmitter;
window.PathAnimation = PathAnimation;
window.WaveAnimation = WaveAnimation;
