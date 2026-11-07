// touch.js - 知识可视化项目触摸/手势工具

class TouchHandler {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.onTap = options.onTap || (() => {});
    this.onDrag = options.onDrag || (() => {});
    this.onPinch = options.onPinch || (() => {});
    this.onSwipe = options.onSwipe || (() => {});
    
    this.startPos = null;
    this.lastPos = null;
    this.startTime = 0;
    this.pinchStart = 0;
    
    this.bindEvents();
  }
  
  bindEvents() {
    // 触摸事件
    this.canvas.addEventListener('touchstart', e => this.handleStart(e), { passive: false });
    this.canvas.addEventListener('touchmove', e => this.handleMove(e), { passive: false });
    this.canvas.addEventListener('touchend', e => this.handleEnd(e), { passive: false });
    
    // 鼠标事件（兼容）
    this.canvas.addEventListener('mousedown', e => this.handleStart(e));
    this.canvas.addEventListener('mousemove', e => this.handleMove(e));
    this.canvas.addEventListener('mouseup', e => this.handleEnd(e));
    
    // 滚轮缩放
    this.canvas.addEventListener('wheel', e => this.handleWheel(e), { passive: false });
  }
  
  getPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    };
  }
  
  handleStart(e) {
    if (e.touches && e.touches.length === 2) {
      // 双指缩放开始
      this.pinchStart = this.getPinchDistance(e);
    } else {
      this.startPos = this.getPos(e);
      this.lastPos = this.startPos;
      this.startTime = Date.now();
    }
  }
  
  handleMove(e) {
    e.preventDefault();
    
    if (e.touches && e.touches.length === 2) {
      // 双指缩放
      const dist = this.getPinchDistance(e);
      const scale = dist / this.pinchStart;
      this.onPinch(scale);
    } else if (this.startPos) {
      // 拖拽
      const pos = this.getPos(e);
      const dx = pos.x - this.lastPos.x;
      const dy = pos.y - this.lastPos.y;
      this.onDrag(dx, dy, pos);
      this.lastPos = pos;
    }
  }
  
  handleEnd(e) {
    if (this.startPos) {
      const endPos = this.lastPos;
      const dt = Date.now() - this.startTime;
      const dx = endPos.x - this.startPos.x;
      const dy = endPos.y - this.startPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 10 && dt < 300) {
        // 点击
        this.onTap(this.startPos);
      } else if (dist > 50 && dt < 500) {
        // 滑动
        const angle = Math.atan2(dy, dx);
        let direction = 'right';
        if (angle > Math.PI / 4 && angle < 3 * Math.PI / 4) direction = 'down';
        else if (angle < -Math.PI / 4 && angle > -3 * Math.PI / 4) direction = 'up';
        else if (Math.abs(angle) > 3 * Math.PI / 4) direction = 'left';
        this.onSwipe(direction, dist, dt);
      }
    }
    this.startPos = null;
  }
  
  handleWheel(e) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    this.onPinch(delta);
  }
  
  getPinchDistance(e) {
    const t1 = e.touches[0];
    const t2 = e.touches[1];
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }
}

// 导出
window.TouchHandler = TouchHandler;
