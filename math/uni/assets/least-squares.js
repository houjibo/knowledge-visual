/* Interaction controller for the finite least-squares projection workbench. */
(() => {
  'use strict';
  const model=LeastSquaresModel;
  const presets={
    full:{A:[[1,0],[1,1],[1,2]],b:[1,2,2]},
    'in-column':{A:[[1,0],[1,1],[1,2]],b:[1,2,3]},
    dependent:{A:[[1,2],[2,4],[-2,-4]],b:[1,0,1]},
    orthogonal:{A:[[1,0],[0,1],[0,0]],b:[0,0,4]},
    zero:{A:[[0,0],[0,0],[0,0]],b:[3,-2,1]}
  };
  const $=id=>document.getElementById(id);
  let current=null;

  function numberInput(id,value,labelText,onInput) {
    const label=document.createElement('label'),input=document.createElement('input');
    input.id=id; input.type='number'; input.min='-5'; input.max='5'; input.step='1'; input.value=String(value);
    label.htmlFor=id; label.append(labelText,input); input.addEventListener('input',onInput);
    return label;
  }
  function textInput(prefix,index,value='') {
    const label=document.createElement('label'),input=document.createElement('input');
    input.id=`${prefix}-${index}`; input.type='text'; input.inputMode='text'; input.value=value;
    label.htmlFor=input.id; label.append(`${prefix==='projectionGuess'?'p':prefix==='residualGuess'?'e':'x'}${index+1}`,input);
    return label;
  }
  function renderInputs(A,b) {
    const matrix=$('matrixEditor'),target=$('targetEditor'); matrix.replaceChildren(); target.replaceChildren();
    for(let i=0;i<3;i++) {
      for(let j=0;j<2;j++) matrix.append(numberInput(`a-${i}-${j}`,A[i][j],`a${i+1}${j+1}`,edited));
      target.append(numberInput(`b-${i}`,b[i],`b${i+1}`,edited));
    }
  }
  function renderGuesses() {
    $('projectionGuess').replaceChildren(...[0,1,2].map(i=>textInput('projectionGuess',i)));
    $('residualGuess').replaceChildren(...[0,1,2].map(i=>textInput('residualGuess',i)));
  }
  function clearOutcome() {
    current=null; $('answer').hidden=true;
    $('predictionFeedback').textContent=''; $('candidateFeedback').textContent='';
    $('memberGuess').value=''; $('uniqueGuess').value=''; renderGuesses();
  }
  function edited() {
    $('preset').value='custom'; clearOutcome(); readInputs();
  }
  function setInputs(example) {
    renderInputs(example.A,example.b); clearOutcome(); $('inputStatus').textContent='';
  }
  function readInputs() {
    let valid=true;
    function read(id) {
      const input=$(id),raw=input.value.trim(),value=Number(raw);
      const okay=raw!==''&&Number.isInteger(value)&&Math.abs(value)<=5;
      input.setAttribute('aria-invalid',String(!okay)); if(!okay) valid=false;
      return value;
    }
    const A=Array.from({length:3},(_,i)=>Array.from({length:2},(_,j)=>read(`a-${i}-${j}`)));
    const b=Array.from({length:3},(_,i)=>read(`b-${i}`));
    $('inputStatus').textContent=valid?'':'输入无效：A 与 b 的每项都须为 −5 到 5 的整数；空值不能当作 0。';
    return valid?{A,b}:null;
  }
  function vector(values) { return `[${values.join(', ')}]`; }
  function matrix(values) { return `[${values.map(row=>row.join(', ')).join(' ; ')}]`; }
  function card(title,lines) {
    const box=document.createElement('div'),heading=document.createElement('h3');
    box.className='result-card'; heading.textContent=title; box.append(heading);
    for(const line of lines) { const p=document.createElement('p'); p.className='formula'; p.textContent=line; box.append(p); }
    return box;
  }
  function number(value) { const [n,d='1']=value.split('/'); return Number(n)/Number(d); }
  function diagram(solution) {
    const length=values=>Math.sqrt(values.reduce((sum,value)=>sum+number(value)**2,0));
    const pl=length(solution.projection),el=length(solution.residual);
    const scale=Math.min(310/Math.max(pl,.1),145/Math.max(el,.1));
    const px=70+pl*scale,ey=210-el*scale;
    const pX=px.toFixed(1),eY=ey.toFixed(1);
    const both=pl>0&&el>0;
    const marker=both&&pl*scale>18&&el*scale>18?`<path d="M ${(px-12).toFixed(1)} 210 v -12 h 12" fill="none" stroke="#bac8dd" stroke-width="2"/>`:'';
    const pLine=pl>0?`<line x1="70" y1="210" x2="${pX}" y2="210" stroke="#7dd3fc" stroke-width="4" marker-end="url(#arrowP)"/>`:'';
    const eLine=el>0?`<line x1="${pX}" y1="210" x2="${pX}" y2="${eY}" stroke="#86efac" stroke-width="4" marker-end="url(#arrowE)"/>`:'';
    const bLine=both?`<line x1="70" y1="210" x2="${pX}" y2="${eY}" stroke="#fcd34d" stroke-width="3" marker-end="url(#arrowB)"/>`:'';
    const labels=both?`<text x="${(px/2+35).toFixed(1)}" y="235" fill="#7dd3fc" font-size="17">p</text>
      <text x="${(px+12).toFixed(1)}" y="${((ey+210)/2).toFixed(1)}" fill="#86efac" font-size="17">e</text>
      <text x="${(px+12).toFixed(1)}" y="${Math.max(24,ey-10).toFixed(1)}" fill="#fcd34d" font-size="17">b</text>`:
      pl>0?`<text x="${(px/2+35).toFixed(1)}" y="235" fill="#7dd3fc" font-size="17">b=p</text><text x="75" y="185" fill="#86efac" font-size="17">e=0</text>`:
      el>0?`<text x="82" y="${((ey+210)/2).toFixed(1)}" fill="#86efac" font-size="17">b=e</text><text x="82" y="235" fill="#7dd3fc" font-size="17">p=0</text>`:
      `<text x="82" y="195" fill="#fcd34d" font-size="17">b=p=e=0</text>`;
    $('geometry').innerHTML=`<svg viewBox="0 0 540 270" role="img" aria-labelledby="projectionTitle projectionDesc">
      <title id="projectionTitle">目标 b 分解为投影 p 与正交残差 e</title>
      <desc id="projectionDesc">p 长度 ${pl.toFixed(3)}，e 长度 ${el.toFixed(3)}；二者垂直，b 从原点指向合成终点。</desc>
      <defs><marker id="arrowP" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="#7dd3fc"/></marker>
      <marker id="arrowE" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="#86efac"/></marker>
      <marker id="arrowB" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="#fcd34d"/></marker></defs>
      ${pLine}${eLine}${bLine}
      ${marker}<circle cx="70" cy="210" r="4" fill="#f3f7ff"/>
      <text x="53" y="235" fill="#f3f7ff" font-size="16">0</text>
      ${labels}
    </svg>`;
  }
  function showAnswer(solution) {
    current=solution; $('answer').hidden=false; diagram(solution);
    const directions=solution.directions.length?solution.directions.map((d,i)=>`${i===0?'t':'s'}·${vector(d)}`).join(' + '):'无自由方向';
    const rankText=solution.rank===0?'零矩阵：AᵀA 不可逆，所有系数都得到同一零投影。':solution.unique?'两列独立：最小二乘系数唯一。':'两列相关：AᵀA 不可逆；系数不唯一，但投影唯一。';
    $('answerGrid').replaceChildren(
      card('投影与残差',[`p = ${vector(solution.projection)}`,`e = b−p = ${vector(solution.residual)}`,`‖e‖² = ${solution.minErrorSquared}`]),
      card('正规方程',[`AᵀA = ${matrix(solution.gram)}`,`Aᵀb = ${vector(solution.normalRight)}`,`RREF([AᵀA | Aᵀb]) = ${matrix(solution.normalRref)}`]),
      card('一个系数解与全部最优解',[`x̂₀ = ${vector(solution.particular)}`,`x̂ = x̂₀ + ${directions}`,rankText]),
      card('两种特殊情形',[solution.bInColumn?'e=0：b 已在 C(A) 中。':'e≠0：b 不在 C(A) 中。',solution.bOrthogonalToColumn?'p=0：b 与 C(A) 正交。':'p≠0：b 在 C(A) 中有非零分量。'])
    );
    $('verificationInfo').textContent=`精确核验：Aᵀe = ${vector(solution.verification.atResidual)}；p·e = ${solution.verification.projectionResidualDot}；b=p+e 成立。最小 ‖b−Ax‖² = ${solution.minErrorSquared}。`;
    $('candidateInputs').replaceChildren(textInput('candidate',0,'0'),textInput('candidate',1,'0'));
    $('candidateFeedback').textContent='';
  }
  function solveCurrent() {
    const input=readInputs(); if(!input) {clearOutcome(); return null;}
    return model.solve(input.A,input.b);
  }
  function prediction() {
    return {member:$('memberGuess').value,unique:$('uniqueGuess').value,
      projection:[0,1,2].map(i=>$(`projectionGuess-${i}`).value),
      residual:[0,1,2].map(i=>$(`residualGuess-${i}`).value)};
  }
  function checkPrediction() {
    const solution=solveCurrent(); if(!solution) return;
    const checks=model.checkPrediction(solution,prediction());
    const labels={member:'b 的列空间成员关系',unique:'系数唯一性',projection:'投影 p',residual:'残差 e'};
    const all=Object.values(checks).every(Boolean);
    $('predictionFeedback').textContent=Object.entries(checks).map(([key,okay])=>`${okay?'✓':'再核'} ${labels[key]}`).join('；')+(all?'。已完成预测，继续比较候选系数。':'。可修改后重试，或查看示范。');
    if(all) {showAnswer(solution); if(typeof PageProgress!=='undefined') PageProgress.markDone('least-squares');}
    else {current=null;$('answer').hidden=true;}
  }
  function reveal() {
    const solution=solveCurrent(); if(!solution) return;
    showAnswer(solution); $('predictionFeedback').textContent='已显示示范；此操作不记录完成。可按 p+e=b 与正交关系重新预测。';
  }
  function checkCandidate() {
    if(!current) return;
    const values=[0,1].map(i=>$(`candidate-${i}`).value),result=model.verifyCandidate(current,values);
    if(!result) { $('candidateFeedback').textContent='系数输入无效：逐项填写整数或分数，分子绝对值和分母不超过 1,000,000。'; return; }
    $('candidateFeedback').textContent=`Ax = ${vector(result.image)}；‖b−Ax‖² = ${result.errorSquared}，比最小值多 ${result.gap} = ‖p−Ax‖²。${result.optimum?(current.unique?'达到唯一的最小二乘系数。':'达到最小值；系数可不同，投影仍相同。'):'还未达到最小值，试让 Ax 更接近 p。'}`;
  }
  $('preset').addEventListener('change',()=>{const example=presets[$('preset').value];if(example)setInputs(example);});
  $('checkPrediction').addEventListener('click',checkPrediction);
  $('revealAnswer').addEventListener('click',reveal);
  $('checkCandidate').addEventListener('click',checkCandidate);
  setInputs(presets.full);
})();
