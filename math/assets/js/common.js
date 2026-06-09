/* ============================================
   小学数学互动可视化 - 公共工具函数
   ============================================ */

// === 随机数 ===
const Random = {
  int(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
  pick(arr) {
    return arr[this.int(0, arr.length - 1)];
  },
  shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = this.int(0, i);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
};

// === Toast 消息提示 ===
function showToast(message, type = '', duration = 2000) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = 'toast show' + (type ? ` ${type}` : '');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), duration);
}

// === 庆祝动画（星星烟花） ===
function celebrate(container = document.body) {
  const emojis = ['⭐', '🎉', '✨', '🌟', '💫', '🎊'];
  const count = 12;
  for (let i = 0; i < count; i++) {
    const star = document.createElement('div');
    star.className = 'star-burst';
    star.textContent = emojis[i % emojis.length];
    star.style.left = '50%';
    star.style.top = '50%';
    const angle = (Math.PI * 2 * i) / count;
    const dist = Random.int(60, 150);
    star.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
    star.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);
    star.style.animationDelay = `${i * 0.05}s`;
    container.appendChild(star);
    setTimeout(() => star.remove(), 1200);
  }
}

// === 音效（可选，使用 Web Audio API 生成简单音效） ===
const Sound = (() => {
  let ctx = null;
  function getCtx() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return ctx;
  }
  return {
    play(type = 'correct') {
      try {
        const ac = getCtx();
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.connect(gain);
        gain.connect(ac.destination);
        if (type === 'correct') {
          osc.frequency.setValueAtTime(523.25, ac.currentTime); // C5
          osc.frequency.setValueAtTime(659.25, ac.currentTime + 0.1); // E5
          osc.frequency.setValueAtTime(783.99, ac.currentTime + 0.2); // G5
          gain.gain.setValueAtTime(0.15, ac.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.4);
          osc.start(ac.currentTime);
          osc.stop(ac.currentTime + 0.4);
        } else if (type === 'wrong') {
          osc.frequency.setValueAtTime(200, ac.currentTime);
          osc.frequency.setValueAtTime(150, ac.currentTime + 0.15);
          gain.gain.setValueAtTime(0.1, ac.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.3);
          osc.start(ac.currentTime);
          osc.stop(ac.currentTime + 0.3);
        } else if (type === 'click') {
          osc.frequency.setValueAtTime(800, ac.currentTime);
          gain.gain.setValueAtTime(0.05, ac.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.05);
          osc.start(ac.currentTime);
          osc.stop(ac.currentTime + 0.05);
        }
      } catch (e) {
        // 音频不可用时静默
      }
    }
  };
})();

// === 进度管理 ===
function createProgressTracker(storageKey) {
  const data = JSON.parse(localStorage.getItem(storageKey) || '{}');
  return {
    get(key) { return data[key] || 0; },
    set(key, value) {
      data[key] = value;
      localStorage.setItem(storageKey, JSON.stringify(data));
    },
    total() { return Object.values(data).reduce((s, v) => s + v, 0); }
  };
}

// === 倒计时 ===
function createTimer(duration, onTick, onEnd) {
  let remaining = duration;
  let interval = null;
  return {
    start() {
      if (interval) return;
      interval = setInterval(() => {
        remaining--;
        onTick(remaining);
        if (remaining <= 0) {
          this.stop();
          if (onEnd) onEnd();
        }
      }, 1000);
    },
    stop() { clearInterval(interval); interval = null; },
    get value() { return remaining; }
  };
}

// === 页面初始化辅助 ===
function initPage(options = {}) {
  const { title, backUrl = '../', onReady } = options;
  
  // 确保有 nav-bar
  let navBar = document.querySelector('.nav-bar');
  if (!navBar && title) {
    navBar = document.createElement('nav');
    navBar.className = 'nav-bar';
    navBar.innerHTML = `
      <button class="nav-btn nav-back" aria-label="返回">←</button>
      <span class="nav-title">${title}</span>
      <div style="width:56px"></div>
    `;
    document.body.prepend(navBar);
    
    navBar.querySelector('.nav-back').addEventListener('click', () => {
      window.location.href = backUrl;
    });
  }
  
  if (onReady) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', onReady);
    } else {
      onReady();
    }
  }
}

// === 动画缓动函数 ===
const Easing = {
  linear(t) { return t; },
  easeOut(t) { return 1 - Math.pow(1 - t, 3); },
  easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; },
  bounce(t) {
    const n1 = 7.5625, d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  }
};

// === 平滑动画工具 ===
function animate(duration, onUpdate, easing = 'easeOut', onComplete) {
  const easeFn = typeof easing === 'function' ? easing : Easing[easing] || Easing.easeOut;
  const start = performance.now();
  function frame(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    onUpdate(easeFn(progress), progress);
    if (progress < 1) {
      requestAnimationFrame(frame);
    } else if (onComplete) {
      onComplete();
    }
  }
  requestAnimationFrame(frame);
}

// === 对象池（高性能动画） ===
function createObjectPool(createFn, resetFn, initialSize = 20) {
  const pool = [];
  for (let i = 0; i < initialSize; i++) pool.push(createFn());
  return {
    get() {
      if (pool.length > 0) {
        const obj = pool.pop();
        resetFn(obj);
        return obj;
      }
      return createFn();
    },
    release(obj) {
      resetFn(obj);
      pool.push(obj);
    }
  };
}
