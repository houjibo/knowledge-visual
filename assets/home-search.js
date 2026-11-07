(() => {
  const catalog = window.KV_TOPIC_CATALOG;
  if (!Array.isArray(catalog)) return;
  const section = document.getElementById('site-search');
  const query = document.getElementById('site-query');
  const subject = document.getElementById('site-subject');
  const stage = document.getElementById('site-stage');
  const clear = document.getElementById('site-clear');
  const status = document.getElementById('site-search-status');
  const results = document.getElementById('site-results');
  const subjectNames = {math: '数学', physics: '物理', chemistry: '化学', science: '科学'};
  const stageNames = {primary: '小学', middle: '初中', high: '高中', uni: '大学'};

  function update() {
    const terms = query.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const searching = terms.length > 0 || subject.value || stage.value;
    results.replaceChildren();
    results.hidden = !searching;
    if (!searching) {
      status.textContent = '输入关键词，或选择学科和学段';
      return;
    }
    const matches = catalog.filter(item => {
      const text = [item.title, ...(item.aliases || []), subjectNames[item.subject], stageNames[item.stage]]
        .join(' ').toLowerCase();
      return (!subject.value || item.subject === subject.value) &&
        (!stage.value || item.stage === stage.value) && terms.every(term => text.includes(term));
    });
    matches.forEach(item => {
      const link = document.createElement('a');
      link.className = 'site-result';
      link.href = item.path;
      const title = document.createElement('strong');
      title.textContent = item.title;
      const meta = document.createElement('span');
      meta.textContent = `${subjectNames[item.subject]} · ${stageNames[item.stage]}`;
      link.append(title, meta);
      results.appendChild(link);
    });
    status.textContent = matches.length ? `找到 ${matches.length} 个主题` : '没有找到相关主题，请尝试其他关键词或筛选条件';
  }
  query.addEventListener('input', update);
  subject.addEventListener('change', update);
  stage.addEventListener('change', update);
  clear.addEventListener('click', () => {
    query.value = '';
    subject.value = '';
    stage.value = '';
    update();
    query.focus();
  });
  section.hidden = false;
})();
