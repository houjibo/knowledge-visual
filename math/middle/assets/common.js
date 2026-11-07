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
     PageProgress.markDone('linear-function')        → 子页面完成时调用
     PageProgress.isDone('linear-function')          → 判断某知识点是否完成
     PageProgress.renderBadges('.topic-card')  → 索引页：给已完成卡片加 ✓ 角标
   旧进度保留在 kv-math-progress；新进度按学段写入 kv-math-progress-v2。
   ============================================ */
const PageProgress = (() => {
  // 旧记录没有学段，不删除；同名主题不能可靠分配给任一学段。
  const LEGACY_KEY = 'kv-math-progress';
  const KEY = 'kv-math-progress-v2';
  const AMBIGUOUS_MATH_SLUGS = ['circle', 'derivative', 'fractions', 'probability', 'sets', 'statistics'];
  const stage = 'middle';
  let cache = {};
  let pending = {};
  function load(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || '{}');
      return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    } catch (e) { return {}; }
  }
  function readStored() {
    try {
      const raw = localStorage.getItem(KEY);
      const value = raw === null ? {} : JSON.parse(raw);
      if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
      return value;
    } catch (e) { return null; }
  }
  function read() {
    const stored = readStored();
    // 无法读取或解析时只使用本页缓存，不修改原始数据。
    if (stored !== null) cache = stored;
    return { ...cache, ...pending };
  }
  function update(key, value) {
    pending[key] = value;
    const stored = readStored();
    // 原始数据损坏或读取受限时无法安全合并，保留待写入的本页状态。
    if (stored === null) return false;
    const merged = { ...stored, ...pending };
    try {
      localStorage.setItem(KEY, JSON.stringify(merged));
      cache = merged;
      pending = {};
      return true;
    } catch (e) { return false; }
  }
  function isDone(slug) {
    const data = read();
    const key = stage + ':' + slug;
    if (Object.prototype.hasOwnProperty.call(data, key)) return !!data[key];
    return !AMBIGUOUS_MATH_SLUGS.includes(slug) && !!load(LEGACY_KEY)[slug];
  }
  return {
    markDone(slug) {
      return update(stage + ':' + slug, Date.now());
    },
    clear(slug) {
      return update(stage + ':' + slug, false);
    },
    isDone,
    // 保持跨学段总数语义；旧同名记录只能作为一条保守计数。
    count() {
      const entries = Object.entries(read()).filter(([key]) => /^(primary|middle|high|uni):.+/.test(key));
      const represented = new Set(entries.map(([key]) => key.slice(key.indexOf(':') + 1)));
      const legacy = load(LEGACY_KEY);
      return entries.filter(([, value]) => !!value).length +
        Object.keys(legacy).filter(slug => !!legacy[slug] && !represented.has(slug)).length;
    },
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
