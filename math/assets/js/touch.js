/* ============================================
   小学数学互动可视化 - 触屏交互模块
   拖拽、点击、滑动，触屏优先
   ============================================ */

const Touch = {
  // === 拖拽系统 ===
  createDraggable(element, options = {}) {
    const {
      onDragStart,
      onDragMove,
      onDragEnd,
      onDrop,
      snapTo = null,
      axis = null, // 'x' | 'y' | null (both)
      revert = true // 未成功drop时是否回到原位
    } = options;

    let startX, startY, offsetX, offsetY;
    let dragging = false;
    const origPos = { left: 0, top: 0 };

    function getPosition(e) {
      const t = e.touches ? e.touches[0] : e;
      return { x: t.clientX, y: t.clientY };
    }

    function onStart(e) {
      e.preventDefault();
      const pos = getPosition(e);
      const rect = element.getBoundingClientRect();
      startX = pos.x;
      startY = pos.y;
      offsetX = pos.x - rect.left;
      offsetY = pos.y - rect.top;
      origPos.left = rect.left;
      origPos.top = rect.top;
      dragging = true;
      element.classList.add('dragging');
      element.style.position = 'fixed';
      element.style.zIndex = '1000';
      element.style.width = rect.width + 'px';
      element.style.left = (pos.x - offsetX) + 'px';
      element.style.top = (pos.y - offsetY) + 'px';
      if (onDragStart) onDragStart(element, pos);
    }

    function onMove(e) {
      if (!dragging) return;
      e.preventDefault();
      const pos = getPosition(e);
      let x = pos.x - offsetX;
      let y = pos.y - offsetY;
      if (axis === 'x') y = origPos.top;
      if (axis === 'y') x = origPos.left;
      element.style.left = x + 'px';
      element.style.top = y + 'px';
      if (onDragMove) onDragMove(element, pos);

      // 高亮drop zone
      updateDropZones(pos);
    }

    function onEnd(e) {
      if (!dragging) return;
      dragging = false;
      element.classList.remove('dragging');
      const pos = e.changedTouches ? 
        { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY } :
        { x: e.clientX, y: e.clientY };

      // 检测drop zone
      let dropped = false;
      const zones = document.querySelectorAll('.drop-zone');
      zones.forEach(zone => {
        const rect = zone.getBoundingClientRect();
        if (pos.x >= rect.left && pos.x <= rect.right && pos.y >= rect.top && pos.y <= rect.bottom) {
          dropped = true;
          if (onDrop) onDrop(element, zone, pos);
        }
        zone.classList.remove('drag-over');
      });

      // 回弹
      if (revert && !dropped) {
        element.style.transition = 'left 0.3s ease, top 0.3s ease';
        element.style.left = origPos.left + 'px';
        element.style.top = origPos.top + 'px';
        setTimeout(() => {
          element.style.position = '';
          element.style.zIndex = '';
          element.style.width = '';
          element.style.left = '';
          element.style.top = '';
          element.style.transition = '';
        }, 300);
      } else if (!dropped) {
        element.style.position = '';
        element.style.zIndex = '';
        element.style.width = '';
        element.style.left = '';
        element.style.top = '';
      }

      if (onDragEnd) onDragEnd(element, pos, dropped);
    }

    function updateDropZones(pos) {
      const zones = document.querySelectorAll('.drop-zone');
      zones.forEach(zone => {
        const rect = zone.getBoundingClientRect();
        const inside = pos.x >= rect.left && pos.x <= rect.right && pos.y >= rect.top && pos.y <= rect.bottom;
        zone.classList.toggle('drag-over', inside);
      });
    }

    element.addEventListener('touchstart', onStart, { passive: false });
    element.addEventListener('touchmove', onMove, { passive: false });
    element.addEventListener('touchend', onEnd);
    element.addEventListener('mousedown', onStart);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);

    return {
      destroy() {
        element.removeEventListener('touchstart', onStart);
        element.removeEventListener('touchmove', onMove);
        element.removeEventListener('touchend', onEnd);
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onEnd);
      }
    };
  },

  // === 滑动检测（左右翻页） ===
  createSwipe(element, options = {}) {
    const {
      onSwipeLeft,
      onSwipeRight,
      onSwipeUp,
      onSwipeDown,
      threshold = 50
    } = options;

    let startX, startY;
    let startTime;

    function onStart(e) {
      const t = e.touches[0];
      startX = t.clientX;
      startY = t.clientY;
      startTime = Date.now();
    }

    function onEnd(e) {
      const t = e.changedTouches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      const dt = Date.now() - startTime;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (Math.max(absDx, absDy) < threshold) return;
      if (dt > 1000) return; // 太慢不算滑动

      if (absDx > absDy) {
        if (dx > 0 && onSwipeRight) onSwipeRight(element);
        else if (dx < 0 && onSwipeLeft) onSwipeLeft(element);
      } else {
        if (dy > 0 && onSwipeDown) onSwipeDown(element);
        else if (dy < 0 && onSwipeUp) onSwipeUp(element);
      }
    }

    element.addEventListener('touchstart', onStart, { passive: true });
    element.addEventListener('touchend', onEnd, { passive: true });

    return { destroy() {
      element.removeEventListener('touchstart', onStart);
      element.removeEventListener('touchend', onEnd);
    }};
  },

  // === 长按检测 ===
  createLongPress(element, callback, duration = 500) {
    let timer = null;
    function onStart() {
      timer = setTimeout(() => callback(element), duration);
    }
    function onEnd() {
      clearTimeout(timer);
    }
    element.addEventListener('touchstart', onStart);
    element.addEventListener('touchend', onEnd);
    element.addEventListener('touchmove', onEnd);
    element.addEventListener('mousedown', onStart);
    element.addEventListener('mouseup', onEnd);
    element.addEventListener('mouseleave', onEnd);
    return { destroy() {
      element.removeEventListener('touchstart', onStart);
      element.removeEventListener('touchend', onEnd);
      element.removeEventListener('touchmove', onEnd);
      element.removeEventListener('mousedown', onStart);
      element.removeEventListener('mouseup', onEnd);
      element.removeEventListener('mouseleave', onEnd);
    }};
  }
};

window.Touch = Touch;
