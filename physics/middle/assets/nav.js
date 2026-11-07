/* kv-nav: 注入式返回导航（固定左上角，不干扰页面布局）
   用法: <script src="assets/nav.js" data-home="../../index.html" data-back="index.html" data-label="初中数学"></script> */
(function () {
  var s = document.currentScript;
  if (!s) return;
  var home = s.getAttribute('data-home') || '../../index.html';
  var back = s.getAttribute('data-back') || 'index.html';
  var label = s.getAttribute('data-label') || '返回列表';

  var wrap = document.createElement('nav');
  wrap.className = 'kv-nav';
  wrap.setAttribute('aria-label', '站点导航');
  wrap.style.cssText =
    'position:fixed;top:10px;left:10px;z-index:99999;display:flex;gap:6px;' +
    'font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;' +
    'opacity:0.55;transition:opacity .2s ease;';
  wrap.addEventListener('mouseenter', function () { wrap.style.opacity = '1'; });
  wrap.addEventListener('mouseleave', function () { wrap.style.opacity = '0.55'; });

  var linkCss =
    'display:inline-flex;align-items:center;gap:3px;padding:7px 13px;border-radius:18px;' +
    'background:rgba(15,23,42,0.6);color:#e2e8f0;text-decoration:none;' +
    'font-size:12px;font-weight:600;line-height:1;white-space:nowrap;' +
    'border:1px solid rgba(255,255,255,0.16);backdrop-filter:blur(8px);' +
    '-webkit-backdrop-filter:blur(8px);box-shadow:0 2px 10px rgba(0,0,0,0.25);';

  function makeLink(href, text, title) {
    var a = document.createElement('a');
    a.href = href;
    a.innerHTML = text;
    a.style.cssText = linkCss;
    if (title) a.title = title;
    a.addEventListener('mouseenter', function () { a.style.background = 'rgba(51,65,85,0.85)'; });
    a.addEventListener('mouseleave', function () { a.style.background = 'rgba(15,23,42,0.6)'; });
    return a;
  }

  wrap.appendChild(makeLink(back, '‹ ' + label, '返回' + label));
  wrap.appendChild(makeLink(home, '⌂', '首页'));

  function mount() { document.body.appendChild(wrap); }
  if (document.body) mount();
  else document.addEventListener('DOMContentLoaded', mount);
})();
