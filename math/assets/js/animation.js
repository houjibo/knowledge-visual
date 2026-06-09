/* ============================================
   小学数学互动可视化 - 动画引擎
   轻量级，基于 Web Animations API + requestAnimationFrame
   ============================================ */

const Animator = {
  // === 弹性出现动画 ===
  popIn(element, delay = 0, duration = 300) {
    return element.animate([
      { opacity: 0, transform: 'scale(0.3)', offset: 0 },
      { opacity: 1, transform: 'scale(1.08)', offset: 0.7 },
      { opacity: 1, transform: 'scale(1)', offset: 1 }
    ], { duration, delay, easing: 'ease-out', fill: 'both' });
  },

  // === 逐个出现 ===
  staggerPopIn(elements, gap = 80, duration = 300) {
    elements.forEach((el, i) => {
      this.popIn(el, i * gap, duration);
    });
  },

  // === 弹跳 ===
  bounce(element, duration = 600) {
    return element.animate([
      { transform: 'translateY(0)', offset: 0 },
      { transform: 'translateY(-24px)', offset: 0.5 },
      { transform: 'translateY(0)', offset: 1 }
    ], { duration, easing: 'ease-out', fill: 'forwards' });
  },

  // === 滑动进入 ===
  slideIn(element, direction = 'right', duration = 350) {
    const dx = direction === 'right' ? 50 : direction === 'left' ? -50 : 0;
    const dy = direction === 'up' ? 50 : direction === 'down' ? -50 : 0;
    return element.animate([
      { opacity: 0, transform: `translate(${dx}px, ${dy}px)` },
      { opacity: 1, transform: 'translate(0, 0)' }
    ], { duration, easing: 'ease-out', fill: 'both' });
  },

  // === 数字跳动 ===
  numberPop(element, duration = 200) {
    return element.animate([
      { transform: 'scale(1)', offset: 0 },
      { transform: 'scale(1.3)', offset: 0.4 },
      { transform: 'scale(1)', offset: 1 }
    ], { duration, easing: 'ease-out' });
  },

  // === 颜色闪烁（正确/错误反馈） ===
  flashColor(element, color, duration = 400) {
    return element.animate([
      { backgroundColor: '', offset: 0 },
      { backgroundColor: color, offset: 0.3 },
      { backgroundColor: '', offset: 1 }
    ], { duration, easing: 'ease-out' });
  },

  // === 摇晃（错误反馈） ===
  shake(element, duration = 400) {
    return element.animate([
      { transform: 'translateX(0)' },
      { transform: 'translateX(-10px)' },
      { transform: 'translateX(10px)' },
      { transform: 'translateX(-8px)' },
      { transform: 'translateX(8px)' },
      { transform: 'translateX(0)' }
    ], { duration, easing: 'ease-out' });
  },

  // === 旋转 ===
  spin(element, turns = 1, duration = 600) {
    return element.animate([
      { transform: `rotate(0deg)` },
      { transform: `rotate(${360 * turns}deg)` }
    ], { duration, easing: 'ease-in-out', fill: 'forwards' });
  },

  // === 淡入淡出 ===
  fadeIn(element, duration = 300) {
    element.style.opacity = '0';
    return element.animate([
      { opacity: 0 },
      { opacity: 1 }
    ], { duration, easing: 'ease-out', fill: 'forwards' });
  },

  fadeOut(element, duration = 300) {
    return element.animate([
      { opacity: 1 },
      { opacity: 0 }
    ], { duration, easing: 'ease-in', fill: 'forwards' });
  },

  // === 路径动画（沿曲线移动） ===
  moveAlong(element, points, duration = 800) {
    if (points.length < 2) return;
    const keyframes = points.map((p, i) => ({
      offset: i / (points.length - 1),
      transform: `translate(${p.x}px, ${p.y}px)`
    }));
    return element.animate(keyframes, { duration, easing: 'ease-in-out', fill: 'forwards' });
  },

  // === 数字递增动画 ===
  countUp(element, from, to, duration = 500, format = v => v) {
    const startTime = performance.now();
    const step = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(from + (to - from) * eased);
      element.textContent = format(current);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  },

  // === 连续动画序列 ===
  sequence(animations) {
    let i = 0;
    function next() {
      if (i < animations.length) {
        const anim = animations[i]();
        i++;
        if (anim && anim.finished) {
          anim.finished.then(next);
        } else {
          next();
        }
      }
    }
    next();
  }
};

// === Canvas 动画辅助 ===
class CanvasAnimator {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.objects = [];
    this.running = false;
    this._resize();
    window.addEventListener('resize', () => this._resize());
  }

  _resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * window.devicePixelRatio;
    this.canvas.height = rect.height * window.devicePixelRatio;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    this.width = rect.width;
    this.height = rect.height;
  }

  // 添加一个动画对象
  add(obj) {
    this.objects.push({
      x: obj.x || 0,
      y: obj.y || 0,
      vx: obj.vx || 0,
      vy: obj.vy || 0,
      radius: obj.radius || 20,
      color: obj.color || '#4A90D9',
      text: obj.text || '',
      fontSize: obj.fontSize || 24,
      fontWeight: obj.fontWeight || 'bold',
      draw: obj.draw || null,
      onUpdate: obj.onUpdate || null,
      opacity: obj.opacity ?? 1
    });
  }

  // 清除所有
  clear() {
    this.objects = [];
  }

  // 启动渲染循环
  start() {
    if (this.running) return;
    this.running = true;
    this._frame();
  }

  stop() {
    this.running = false;
  }

  _frame = () => {
    if (!this.running) return;
    this.ctx.clearRect(0, 0, this.width, this.height);

    for (const obj of this.objects) {
      obj.x += obj.vx;
      obj.y += obj.vy;

      if (obj.onUpdate) obj.onUpdate(obj);

      this.ctx.save();
      this.ctx.globalAlpha = obj.opacity;

      if (obj.draw) {
        obj.draw(this.ctx, obj);
      } else {
        // 默认绘制：彩色圆形
        this.ctx.beginPath();
        this.ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = obj.color;
        this.ctx.fill();
        this.ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        if (obj.text) {
          this.ctx.fillStyle = '#fff';
          this.ctx.font = `${obj.fontWeight} ${obj.fontSize}px -apple-system, sans-serif`;
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText(obj.text, obj.x, obj.y);
        }
      }
      this.ctx.restore();
    }

    requestAnimationFrame(this._frame);
  }
}

// 导出
window.Animator = Animator;
window.CanvasAnimator = CanvasAnimator;
