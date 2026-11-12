/* 分类加法与分步乘法的有限路线图。图形和文字均由同一条路线数据生成。 */
(() => {
  const baseCounts = [2, 3, 4, 2];
  const width = 780;
  const height = 360;
  const start = {x: 78, y: height / 2};
  const finish = {x: width - 78, y: height / 2};
  let groups = [];
  let paths = [];
  let mode = 'sum';
  let context = null;

  function createGroups(counts) {
    return counts.map((count, groupIndex) => {
      const x = 198 + groupIndex * (384 / Math.max(1, counts.length - 1));
      return Array.from({length: count}, (_, choiceIndex) => ({
        x,
        y: height / 2 + (choiceIndex - (count - 1) / 2) * 56,
        label: `${groupIndex + 1}-${choiceIndex + 1}`,
        groupIndex,
      }));
    });
  }

  function enumerate(groupsToUse, method) {
    if (method === 'sum') return groupsToUse.flatMap(group => group.map(choice => [choice]));
    const result = [];
    function visit(groupIndex, path) {
      if (groupIndex === groupsToUse.length) {
        result.push([...path]);
        return;
      }
      for (const choice of groupsToUse[groupIndex]) {
        path.push(choice);
        visit(groupIndex + 1, path);
        path.pop();
      }
    }
    visit(0, []);
    return result;
  }

  function line(from, to, color, lineWidth = 1) {
    context.strokeStyle = color;
    context.lineWidth = lineWidth;
    context.beginPath();
    context.moveTo(from.x, from.y);
    context.lineTo(to.x, to.y);
    context.stroke();
  }

  function drawBase(selectedPath = null) {
    if (!context) return;
    context.clearRect(0, 0, width, height);
    context.lineCap = 'butt';
    if (mode === 'sum') {
      groups.forEach(group => group.forEach(choice => {
        line(start, choice, 'rgba(255,255,255,.24)');
        line(choice, finish, 'rgba(255,255,255,.24)');
      }));
    } else {
      groups[0].forEach(choice => line(start, choice, 'rgba(255,255,255,.24)'));
      for (let groupIndex = 0; groupIndex < groups.length - 1; groupIndex++) {
        groups[groupIndex].forEach(from => groups[groupIndex + 1].forEach(to =>
          line(from, to, 'rgba(255,255,255,.24)')));
      }
      groups[groups.length - 1].forEach(choice => line(choice, finish, 'rgba(255,255,255,.24)'));
    }

    if (selectedPath) {
      context.lineCap = 'round';
      for (let index = 0; index <= selectedPath.length; index++) {
        line(index === 0 ? start : selectedPath[index - 1],
          index === selectedPath.length ? finish : selectedPath[index], '#fff36b', 5);
      }
    }

    context.font = 'bold 14px sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    [[start, 'A', '#2ecc71'], [finish, 'B', '#e74c3c']].forEach(([node, label, fill]) => {
      context.fillStyle = fill;
      context.beginPath();
      context.arc(node.x, node.y, 22, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = '#101b26';
      context.fillText(label, node.x, node.y);
    });
    groups.forEach((group, groupIndex) => {
      context.fillStyle = '#f8d781';
      context.font = '13px sans-serif';
      context.fillText(`第${groupIndex + 1}${mode === 'sum' ? '类' : '步'} · ${group.length}条`, group[0].x, 28);
      group.forEach(choice => {
        context.fillStyle = '#e68d18';
        context.beginPath();
        context.arc(choice.x, choice.y, 21, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = '#101b26';
        context.font = 'bold 13px sans-serif';
        context.fillText(choice.label, choice.x, choice.y);
      });
    });
  }

  function showPath(path, selectedButton) {
    drawBase(path);
    document.querySelectorAll('#pathList .path-item').forEach(button => {
      const chosen = button === selectedButton;
      button.classList.toggle('active', chosen);
      button.setAttribute('aria-pressed', String(chosen));
    });
  }

  function buildTree() {
    const count = Number(document.getElementById('treeCategories').value);
    mode = document.getElementById('countMode').value;
    const counts = baseCounts.slice(0, count);
    groups = createGroups(counts);
    paths = enumerate(groups, mode);
    document.getElementById('treeCatVal').textContent = count;
    document.getElementById('pathList').replaceChildren();
    const isSum = mode === 'sum';
    document.getElementById('treeExplanation').textContent = isSum
      ? `每次只选一类、再选该类中的一条路线；各类互不重复，共 ${counts.join('、')} 条，使用加法。`
      : `必须依次完成 ${count} 步，每步可任选一条，任意两步选择均可组合；各步有 ${counts.join('、')} 条，使用乘法。`;
    document.getElementById('pathResult').textContent =
      `${isSum ? '分类相加' : '分步相乘'}：${counts.join(isSum ? ' + ' : ' × ')} = ${paths.length} 条路线`;
    const canvas = document.getElementById('treeCanvas');
    canvas.setAttribute('aria-label', `${isSum ? '分类相加' : '分步相乘'}路线图：${counts.join(isSum ? '加' : '乘')}等于${paths.length}条；下方可列出并选择每条路线`);
    try { context = canvas.getContext('2d'); } catch (_) { context = null; }
    drawBase();
  }

  function showAllPaths() {
    const list = document.getElementById('pathList');
    const buttons = paths.map((path, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'path-item';
      button.setAttribute('aria-pressed', 'false');
      button.textContent = `路线 ${index + 1}：A → ${path.map(choice => choice.label).join(' → ')} → B`;
      button.addEventListener('click', () => showPath(path, button));
      return button;
    });
    list.replaceChildren(...buttons);
  }

  function resetTree() {
    document.getElementById('countMode').value = 'sum';
    document.getElementById('treeCategories').value = '2';
    buildTree();
  }

  window.buildTree = buildTree;
  window.showAllPaths = showAllPaths;
  window.resetTree = resetTree;
})();
