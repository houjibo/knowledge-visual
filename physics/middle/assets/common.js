// common.js - 知识可视化项目公共脚本

// Tab 切换通用函数
function initTabs(tabSelector, sectionSelector, activeClass = 'active') {
  const tabs = document.querySelectorAll(tabSelector);
  const sections = document.querySelectorAll(sectionSelector);
  
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove(activeClass));
      sections.forEach(s => s.classList.remove(activeClass));
      tab.classList.add(activeClass);
      if (sections[index]) sections[index].classList.add(activeClass);
    });
  });
}

// 响应式 Canvas 设置
function setupCanvas(canvasId, width, height) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;
  const ctx = canvas.getContext('2d');
  canvas.width = width || canvas.offsetWidth;
  canvas.height = height || canvas.offsetHeight;
  return { canvas, ctx };
}

// 颜色工具
function hslToRgb(h, s, l) {
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

// 动画循环
function animationLoop(callback) {
  let animId;
  function loop() {
    callback();
    animId = requestAnimationFrame(loop);
  }
  loop();
  return () => cancelAnimationFrame(animId);
}

// 缓动函数
const ease = {
  linear: t => t,
  easeIn: t => t * t,
  easeOut: t => t * (2 - t),
  easeInOut: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
};

// 数值插值
function lerp(a, b, t) {
  return a + (b - a) * t;
}

// 限制范围
function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

/* ============================================
   页面完成进度追踪（localStorage）
   用法：
     PageProgress.markDone('motion')           → 子页面完成时调用
     PageProgress.isDone('motion')             → 判断某知识点是否完成
     PageProgress.renderBadges('.topic-card')  → 索引页：给已完成卡片加 ✓ 角标
   存储 key：kv-physics-middle-progress → { "motion": ts, ... }
   ============================================ */
const PageProgress = (() => {
  const KEY = 'kv-physics-middle-progress';
  let cache = {};
  let pending = {};
  let removed = new Set();
  let canWrite = true;
  function read() {
    try {
      const raw = localStorage.getItem(KEY);
      const value = raw === null ? {} : JSON.parse(raw);
      if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('invalid progress');
      cache = Object.assign({}, value, pending);
      removed.forEach(slug => delete cache[slug]);
      canWrite = true;
    } catch (e) {
      // 保留原始异常数据，当前页面继续使用内存状态。
      canWrite = false;
    }
    return cache;
  }
  function write(data) {
    cache = data;
    if (!canWrite) return false;
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      pending = {}; removed.clear();
      return true;
    }
    catch (e) { return false; }
  }
  return {
    markDone(slug) {
      const d = read(); d[slug] = Date.now();
      const saved = write(d);
      if (!saved) { pending[slug] = d[slug]; removed.delete(slug); }
      return saved;
    },
    clear(slug) {
      const d = read(); delete d[slug];
      const saved = write(d);
      if (!saved) { delete pending[slug]; removed.add(slug); }
      return saved;
    },
    isDone(slug) { return !!read()[slug]; },
    count() { return Object.keys(read()).length; },
    // 索引页角标渲染：从卡片 href 提取 slug，兼容 topics/<slug>/ 与 <slug>.html 两种链接
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
