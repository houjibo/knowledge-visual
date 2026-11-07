/* 测验按题记录本轮答案；页面负责提供题目与学段进度对象。 */
function initMathQuiz({questions, slug, progress}) {
  let index = 0, answers = Array(questions.length).fill(null);
  const question = document.getElementById('quizQ');
  const options = document.getElementById('quizOpts');
  const feedback = document.getElementById('quizFb');
  const result = document.getElementById('quizResult');
  const start = document.getElementById('quizStart');
  const prev = document.getElementById('quizPrev');
  const next = document.getElementById('quizNext');
  const mark = document.getElementById('done-mark');

  function render() {
    const q = questions[index], selected = answers[index];
    question.textContent = `第${index + 1}题 / 共${questions.length}题：${q.q}`;
    feedback.textContent = selected === null ? '' : (selected === q.ans ? '✅ ' : '❌ ') + q.ex;
    options.replaceChildren();
    q.opts.forEach((text, i) => {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'quiz-opt'; button.textContent = text;
      if (selected !== null) {
        button.disabled = true;
        if (i === q.ans) button.classList.add('correct');
        if (i === selected && selected !== q.ans) button.classList.add('wrong');
      }
      button.addEventListener('click', () => {
        if (answers[index] !== null) return;
        answers[index] = i; render();
      });
      options.appendChild(button);
    });
    prev.disabled = index === 0;
    next.disabled = false;
    next.textContent = index === questions.length - 1 ? '查看成绩' : '下一题';
  }
  function finish() {
    const score = answers.reduce((n, answer, i) => n + (answer === questions[i].ans ? 1 : 0), 0);
    const pass = score >= Math.ceil(questions.length * 0.8);
    question.textContent = '测验完成！'; options.replaceChildren(); feedback.textContent = '';
    result.classList.remove('hidden');
    result.innerHTML = `得分：<b>${score} / ${questions.length}</b>　${pass ? '🎉 通关！' : '继续加油，再试一次！'}`;
    next.disabled = true; prev.disabled = true;
    if (pass && progress) mark.textContent = progress.markDone(slug) ? '✓ 已完成' : '本次通关，进度未保存';
  }
  document.addEventListener('math-progress-saved', () => {
    if (progress && progress.isDone(slug)) mark.textContent = '✓ 已完成';
  });
  start.addEventListener('click', () => {
    index = 0; answers = Array(questions.length).fill(null);
    result.classList.add('hidden'); start.textContent = '重新答题'; render();
  });
  prev.addEventListener('click', () => { if (index > 0) { index--; render(); } });
  next.addEventListener('click', () => {
    if (index < questions.length - 1) { index++; render(); } else finish();
  });
  if (progress && progress.isDone(slug)) mark.textContent = '✓ 已完成';
}
