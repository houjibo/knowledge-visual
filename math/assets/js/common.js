/* ============================================
   小学数学互动可视化 - 公共工具函数
   ============================================ */

// === 页面完成进度追踪（localStorage） ===
// 用法：
//   PageProgress.markDone('addition')           → 子页面完成时调用
//   PageProgress.isDone('addition')             → 判断某知识点是否完成
//   PageProgress.renderBadges('.topic-card')    → 索引页：给已完成卡片加 ✓ 角标
// 存储 key：kv-math-progress  →  { "addition": 1, "multiplication": 1, ... }
const PageProgress = (() => {
  const KEY = 'kv-math-progress';
  let cache = null;
  function read() {
    if (cache) return cache;
    try { cache = JSON.parse(localStorage.getItem(KEY) || '{}'); }
    catch (e) { cache = {}; }
    return cache;
  }
  function write(data) {
    cache = data;
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* 隐私模式容错 */ }
  }
  return {
    // 标记某知识点完成（在子页面调用，例如 quiz/practice 通过时）
    markDone(slug) {
      const d = read(); d[slug] = Date.now(); write(d);
    },
    // 取消完成标记
    clear(slug) {
      const d = read(); delete d[slug]; write(d);
    },
    // 是否已完成
    isDone(slug) { return !!read()[slug]; },
    // 已完成数量
    count() { return Object.keys(read()).length; },
    // 在索引页给卡片加 ✓ 角标：从卡片 href 提取 slug
    // 兼容两种链接：topics/<slug>/... （小学目录式） 和 <slug>.html（初/高/大平铺式）
    renderBadges(cardSelector = '.topic-card') {
      document.querySelectorAll(cardSelector).forEach(card => {
        const href = card.getAttribute('href') || '';
        let m = href.match(/topics\/([^/]+)\//);
        if (!m) m = href.match(/^([\w-]+)\.html(?:[?#].*)?$/);
        if (!m) return;
        if (!this.isDone(m[1])) return;
        if (card.querySelector('.progress-badge')) return; // 幂等
        card.style.position = card.style.position || 'relative';
        const badge = document.createElement('span');
        badge.className = 'progress-badge';
        badge.textContent = '✓';
        badge.setAttribute('aria-label', '已完成');
        badge.style.cssText = [
          'position:absolute', 'top:8px', 'right:8px',
          'width:22px', 'height:22px', 'border-radius:50%',
          'background:#34C759', 'color:#fff',
          'display:flex', 'align-items:center', 'justify-content:center',
          'font-size:14px', 'font-weight:700', 'line-height:1',
          'box-shadow:0 1px 3px rgba(0,0,0,0.2)'
        ].join(';');
        card.appendChild(badge);
      });
    }
  };
})();

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

// === 页面卸载清理（防止内存泄漏） ===
window.addEventListener('beforeunload', () => {
  // 清理所有定时器
  const highestId = window.setTimeout(() => {}, 0);
  for (let i = 0; i < highestId; i++) {
    window.clearInterval(i);
    window.clearTimeout(i);
  }
  
  // 清理所有事件监听器（通过重新克隆节点）
  document.querySelectorAll('[data-listener]').forEach(el => {
    const clone = el.cloneNode(true);
    el.parentNode.replaceChild(clone, el);
  });
});

// 页面可见性变化时暂停/恢复动画
let animationFrameId = null;
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // 页面隐藏时暂停所有动画
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }
});

// === 页面卸载清理（防止内存泄漏） ===
window.addEventListener('pagehide', () => {
  // 清理所有定时器（防止 setInterval 泄漏）
  const highestId = window.setTimeout(() => {}, 0);
  for (let i = 0; i < highestId; i++) {
    window.clearInterval(i);
    window.clearTimeout(i);
  }
});

// 页面隐藏时暂停动画（节省 CPU）
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // 暂停所有 CSS 动画
    document.querySelectorAll('.star-burst, .animate, [style*="animation"]').forEach(el => {
      el.style.animationPlayState = 'paused';
    });
  }
});
