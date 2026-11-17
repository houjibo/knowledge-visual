/* Interaction controller for the four fundamental subspaces workbench. */
(() => {
  'use strict';
  const model = FourSubspacesModel;
  const presets = {
    rank1:[[1,2,2],[2,4,4]],
    wide:[[1,2,0],[0,0,1]],
    tall:[[1,0],[0,1],[1,1]],
    zero:[[0,0],[0,0],[0,0]],
    identity:[[1,0,0],[0,1,0],[0,0,1]]
  };
  const $ = id => document.getElementById(id);
  let currentMatrix = presets.rank1.map(row => row.slice());
  let currentSolution = null;

  function renderEditor() {
    const m=currentMatrix.length, n=currentMatrix[0].length;
    $('rowCount').value=String(m);
    $('colCount').value=String(n);
    const editor=$('matrixEditor');
    editor.replaceChildren();
    editor.style.gridTemplateColumns=`repeat(${n}, minmax(0, 1fr))`;
    for (let row=0;row<m;row++) for (let col=0;col<n;col++) {
      const label=document.createElement('label');
      const input=document.createElement('input');
      input.id=`cell-${row}-${col}`;
      input.type='number'; input.min='-5'; input.max='5'; input.step='1';
      input.value=String(currentMatrix[row][col]);
      input.addEventListener('input', matrixEdited);
      label.htmlFor=input.id;
      label.append(`a${row+1}${col+1}`,input);
      editor.append(label);
    }
  }

  function options(select, max) {
    select.replaceChildren();
    const placeholder=document.createElement('option');
    placeholder.value=''; placeholder.textContent='请选择';
    select.append(placeholder);
    for (let value=0;value<=max;value++) {
      const option=document.createElement('option');
      option.value=String(value); option.textContent=String(value);
      select.append(option);
    }
  }

  function renderPredictions() {
    const m=currentMatrix.length,n=currentMatrix[0].length;
    options($('rankGuess'),Math.min(m,n));
    options($('nullGuess'),n);
    options($('leftGuess'),m);
  }

  function renderSelections() {
    const m=currentMatrix.length,n=currentMatrix[0].length;
    const groups=[
      ['column','C(A)：选原矩阵的列作基',n,'列'],
      ['row','C(Aᵀ)：选原矩阵的行作基',m,'行'],
      ['null','N(A)：选 x 的自由变量',n,'x'],
      ['left','N(Aᵀ)：选 y 的自由变量',m,'y']
    ];
    const container=$('selectionGroups');
    container.replaceChildren();
    for (const [key,title,count,prefix] of groups) {
      const fieldset=document.createElement('fieldset');
      const legend=document.createElement('legend'); legend.textContent=title;
      const choices=document.createElement('div'); choices.className='choices';
      for (let index=0;index<count;index++) {
        const label=document.createElement('label');
        const input=document.createElement('input'); input.type='checkbox';
        input.dataset.group=key; input.value=String(index);
        label.append(input,`${prefix}${index+1}`);
        choices.append(label);
      }
      fieldset.append(legend,choices);
      container.append(fieldset);
    }
  }

  function renderMap(solution=null) {
    const m=Number($('rowCount').value),n=Number($('colCount').value);
    const dims=solution ? solution.dimensions : null;
    const leftText=dims ? `${dims.row} + ${dims.null} = ${n}` : 'r + (n−r) = n';
    const rightText=dims ? `${dims.column} + ${dims.left} = ${m}` : 'r + (m−r) = m';
    $('spaceMap').innerHTML=`
      <div class="space-box"><h3>输入空间 R<sup>${n}</sup></h3>
        <div class="space-row"><strong>行空间 C(Aᵀ)</strong><br>维数 ${dims ? dims.row : 'r'}</div>
        <div class="space-row"><strong>零空间 N(A)</strong><br>维数 ${dims ? dims.null : 'n−r'}</div>
        <div class="space-row formula">两者正交 · ${leftText}</div></div>
      <div class="map-arrow" aria-label="矩阵 A 从输入空间映到输出空间">A →</div>
      <div class="space-box"><h3>输出空间 R<sup>${m}</sup></h3>
        <div class="space-row"><strong>列空间 C(A)</strong><br>维数 ${dims ? dims.column : 'r'}</div>
        <div class="space-row"><strong>左零空间 N(Aᵀ)</strong><br>维数 ${dims ? dims.left : 'm−r'}</div>
        <div class="space-row formula">两者正交 · ${rightText}</div></div>`;
  }

  function clearOutcome(clearChoices=true) {
    currentSolution=null;
    $('answer').hidden=true;
    $('constructionFeedback').textContent='';
    $('nullCandidateResult').textContent='';
    $('leftCandidateResult').textContent='';
    renderMap();
    if (clearChoices) {
      for (const id of ['rankGuess','nullGuess','leftGuess']) $(id).value='';
      $('selectionGroups').querySelectorAll('input:checked').forEach(input => {input.checked=false;});
    }
  }

  function readMatrix() {
    const m=Number($('rowCount').value),n=Number($('colCount').value);
    let valid=true;
    const matrix=Array.from({length:m},(_,row) => Array.from({length:n},(_,col) => {
      const input=$(`cell-${row}-${col}`);
      const raw=input.value.trim(), value=Number(raw);
      const okay=raw!=='' && Number.isInteger(value) && Math.abs(value)<=5;
      input.setAttribute('aria-invalid',String(!okay));
      if (!okay) valid=false;
      return value;
    }));
    $('matrixStatus').textContent=valid ? '' : '矩阵输入无效：每项必须是 −5 到 5 的整数，空值不能当作 0。';
    return valid ? matrix : null;
  }

  function matrixEdited() {
    $('preset').value='custom';
    clearOutcome();
    readMatrix();
  }

  function setMatrix(matrix) {
    currentMatrix=matrix.map(row => row.slice());
    renderEditor(); renderPredictions(); renderSelections(); clearOutcome();
    $('matrixStatus').textContent='';
  }

  function resizeMatrix() {
    const m=Number($('rowCount').value),n=Number($('colCount').value);
    const old=Array.from($('matrixEditor').querySelectorAll('input')).map(input => {
      const value=Number(input.value);
      return input.value.trim()!=='' && Number.isInteger(value) && Math.abs(value)<=5 ? value : 0;
    });
    const oldN=currentMatrix[0].length;
    const next=Array.from({length:m},(_,row) => Array.from({length:n},(_,col) => old[row*oldN+col] ?? 0));
    $('preset').value='custom';
    setMatrix(next);
  }

  function selections() {
    const result={column:[],row:[],null:[],left:[]};
    $('selectionGroups').querySelectorAll('input:checked').forEach(input => result[input.dataset.group].push(Number(input.value)));
    return result;
  }

  function prediction() {
    return {rank:$('rankGuess').value,nullDimension:$('nullGuess').value,leftDimension:$('leftGuess').value};
  }

  function vectorText(vector) { return `[${vector.join(', ')}]`; }
  function basisText(vectors) { return vectors.length ? vectors.map(vectorText) : ['∅（只有零向量）']; }

  function answerCard(title,ambient,dimension,vectors,note) {
    const card=document.createElement('div'); card.className='answer-card';
    const heading=document.createElement('h3'); heading.textContent=title;
    const context=document.createElement('p'); context.textContent=`位于 R${ambient} · 维数 ${dimension} · ${note}`;
    card.append(heading,context);
    for (const value of basisText(vectors)) {
      const span=document.createElement('span'); span.className='basis-vector'; span.textContent=value;
      card.append(span);
    }
    return card;
  }

  function renderCandidateInputs(id,prefix,values) {
    const holder=$(id); holder.replaceChildren();
    values.forEach((value,index) => {
      const label=document.createElement('label');
      const input=document.createElement('input');
      input.type='text'; input.value=value; input.inputMode='text';
      input.setAttribute('aria-label',`${prefix}${index+1} 分量`);
      label.append(`${prefix}${index+1}`,input);
      holder.append(label);
    });
  }

  function showAnswer(solution,chosen=null) {
    currentSolution=solution;
    $('answer').hidden=false;
    renderMap(solution);
    const basis=solution.bases;
    const chosenColumn=chosen ? chosen.column.map(index => solution.matrix.map(row => String(row[index]))) : basis.column;
    const chosenRow=chosen ? chosen.row.map(index => solution.matrix[index].map(String)) : basis.row;
    $('rrefInfo').textContent=`RREF(A) = [${solution.rref.map(row => row.join(', ')).join(' ; ')}]；RREF(Aᵀ) = [${solution.rrefTranspose.map(row => row.join(', ')).join(' ; ')}]。`;
    const grid=$('answerGrid'); grid.replaceChildren(
      answerCard('列空间 C(A)',solution.m,solution.rank,chosenColumn,chosen?'你选的原列':'主元原列示范'),
      answerCard('零空间 N(A)',solution.n,solution.dimensions.null,basis.null,`自由 x：${solution.freeColumns.map(i=>i+1).join('、') || '无'}`),
      answerCard('行空间 C(Aᵀ)',solution.n,solution.rank,chosenRow,chosen?'你选的原行':'独立原行示范'),
      answerCard('左零空间 N(Aᵀ)',solution.m,solution.dimensions.left,basis.left,`自由 y：${solution.freeRows.map(i=>i+1).join('、') || '无'}`)
    );
    const nullCheck=solution.verification.nullProducts.length ? solution.verification.nullProducts.map(vectorText).join('、') : '无需非零基向量';
    const leftCheck=solution.verification.leftProducts.length ? solution.verification.leftProducts.map(vectorText).join('、') : '无需非零基向量';
    $('verificationInfo').textContent=`精确核验：Ax = ${nullCheck}；Aᵀy = ${leftCheck}。行空间 ⟂ 零空间：${solution.verification.rowOrthogonal?'成立':'失败'}；列空间 ⟂ 左零空间：${solution.verification.colOrthogonal?'成立':'失败'}。维数：${solution.rank}+${solution.dimensions.null}=${solution.n}，${solution.rank}+${solution.dimensions.left}=${solution.m}。`;
    renderCandidateInputs('nullCandidate','x',basis.null[0] || Array(solution.n).fill('0'));
    renderCandidateInputs('leftCandidate','y',basis.left[0] || Array(solution.m).fill('0'));
    $('nullCandidateResult').textContent=''; $('leftCandidateResult').textContent='';
  }

  function solveCurrent() {
    const matrix=readMatrix();
    if (!matrix) { clearOutcome(false); return null; }
    return model.solve(matrix);
  }

  function checkConstruction() {
    const solution=solveCurrent();
    if (!solution) return;
    const chosen=selections();
    const checks=model.checkConstruction(solution,prediction(),chosen);
    const labels={rank:'秩',nullDimension:'N(A) 维数',leftDimension:'N(Aᵀ) 维数',column:'原列基',row:'原行基',null:'x 自由变量',left:'y 自由变量'};
    const all=Object.values(checks).every(Boolean);
    $('constructionFeedback').textContent=Object.entries(checks).map(([key,correct]) => `${correct?'✓':'再核'} ${labels[key]}`).join('；') + (all ? '。四个基已构造，继续检查候选向量。' : '。可修改后重试，或查看示范。');
    if (all) {
      showAnswer(solution,chosen);
      if (typeof PageProgress !== 'undefined') PageProgress.markDone('four-subspaces');
    } else {
      currentSolution=null; $('answer').hidden=true; renderMap();
    }
  }

  function revealAnswer() {
    const solution=solveCurrent();
    if (!solution) return;
    showAnswer(solution);
    $('constructionFeedback').textContent='已显示示范；此操作不记录完成。可对照 RREF 再尝试独立构造。';
  }

  function checkCandidate(side) {
    if (!currentSolution) return;
    const id=side==='null'?'nullCandidate':'leftCandidate';
    const output=side==='null'?'nullCandidateResult':'leftCandidateResult';
    const values=Array.from($(id).querySelectorAll('input')).map(input => input.value);
    const result=model.verifyCandidate(currentSolution.matrix,side,values);
    if (!result) { $(output).textContent='输入无效：请逐项填写整数或分数，分子绝对值和分母不超过 100。'; return; }
    const symbol=side==='null'?'Ax':'Aᵀy';
    const dimension=side==='null'?currentSolution.dimensions.null:currentSolution.dimensions.left;
    const meaning=!result.member?'不属于该零空间。':!result.nonzero?'属于该零空间，但零向量不能作为基向量。':dimension===1?'属于该一维零空间，且非零，因此可作一个基向量。':'属于该零空间且非零；要成为一组基，还需凑齐足够多个线性无关向量。';
    $(output).textContent=`${symbol} = ${vectorText(result.image)}；${meaning}`;
  }

  $('preset').addEventListener('change', () => {
    if (presets[$('preset').value]) setMatrix(presets[$('preset').value]);
  });
  $('rowCount').addEventListener('change',resizeMatrix);
  $('colCount').addEventListener('change',resizeMatrix);
  $('checkConstruction').addEventListener('click',checkConstruction);
  $('revealAnswer').addEventListener('click',revealAnswer);
  $('checkNullCandidate').addEventListener('click',() => checkCandidate('null'));
  $('checkLeftCandidate').addEventListener('click',() => checkCandidate('left'));
  setMatrix(currentMatrix);
})();
