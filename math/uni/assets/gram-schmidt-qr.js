/* Interaction controller for exact Gram–Schmidt and rank-revealing thin QR. */
(() => {
  'use strict';
  const presets={
    independent:[[1,1],[1,0],[1,2]],fractional:[[2,1],[0,1],[0,0]],
    dependent:[[1,2],[2,4],[-2,-4]],'first-zero':[[0,1],[0,2],[0,3]],
    'second-zero':[[1,0],[2,0],[3,0]],zero:[[0,0],[0,0],[0,0]]
  };
  const $=id=>document.getElementById(id);
  function renderInputs(A) {
    $('matrixEditor').replaceChildren();
    for(let i=0;i<3;i++)for(let j=0;j<2;j++) {
      const label=document.createElement('label'),input=document.createElement('input');
      input.id=`a-${i}-${j}`;input.type='number';input.min='-5';input.max='5';input.step='1';input.value=String(A[i][j]);
      label.htmlFor=input.id;label.append(`a${i+1}${j+1}`,input);input.addEventListener('input',edited);$('matrixEditor').append(label);
    }
  }
  function renderGuesses() {
    $('residualGuess').replaceChildren();
    for(let i=0;i<3;i++) {
      const label=document.createElement('label'),input=document.createElement('input');
      input.id=`residual-${i}`;input.type='text';input.inputMode='text';label.htmlFor=input.id;label.append(`u₂ 的第 ${i+1} 项`,input);$('residualGuess').append(label);
    }
  }
  function clearOutcome() {
    $('answer').hidden=true;$('predictionFeedback').textContent='';$('coefficientGuess').value='';
    $('rankGuess').value='';$('directionGuess').value='';renderGuesses();
  }
  function readInputs() {
    let valid=true;
    const A=Array.from({length:3},(_,i)=>Array.from({length:2},(_,j)=>{
      const input=$(`a-${i}-${j}`),raw=input.value.trim(),value=Number(raw);
      const okay=raw!==''&&Number.isInteger(value)&&Math.abs(value)<=5;
      input.setAttribute('aria-invalid',String(!okay));if(!okay)valid=false;return value;
    }));
    $('inputStatus').textContent=valid?'':'输入无效：A 的每项须为 −5 到 5 的整数；空值不能当作 0。';
    return valid?A:null;
  }
  function edited() {$('preset').value='custom';clearOutcome();readInputs();}
  function setInputs(A) {renderInputs(A);clearOutcome();readInputs();}
  const vector=v=>`[${v.join(', ')}]`;
  const matrix=A=>`[${A.map(row=>row.join(', ')).join(' ; ')}]`;
  function card(title,lines) {
    const box=document.createElement('div'),heading=document.createElement('h3');box.className='answer-card';heading.textContent=title;box.append(heading);
    for(const line of lines){const p=document.createElement('p');p.className='formula';p.textContent=line;box.append(p);}return box;
  }
  function number(value){const [n,d='1']=value.split('/');return Number(n)/Number(d);}
  function diagram(s) {
    const length=values=>Math.sqrt(values.reduce((sum,value)=>sum+number(value)**2,0));
    const pl=length(s.projection),ul=length(s.residual),scale=Math.min(310/Math.max(pl,.1),145/Math.max(ul,.1));
    const px=70+pl*scale,uy=210-ul*scale,both=pl>0&&ul>0;
    const pLine=pl>0?`<line x1="70" y1="210" x2="${px}" y2="210" stroke="#7dd3fc" stroke-width="4" marker-end="url(#arrowP)"/>`:'';
    const uLine=ul>0?`<line x1="${px}" y1="210" x2="${px}" y2="${uy}" stroke="#86efac" stroke-width="4" marker-end="url(#arrowU)"/>`:'';
    const aLine=both?`<line x1="70" y1="210" x2="${px}" y2="${uy}" stroke="#fcd34d" stroke-width="3" marker-end="url(#arrowA)"/>`:'';
    const labels=both?`<text x="${(70+px)/2}" y="235" fill="#7dd3fc" font-size="17">p</text><text x="${px+12}" y="${(uy+210)/2}" fill="#86efac" font-size="17">u₂</text><text x="${px+12}" y="${Math.max(24,uy-10)}" fill="#fcd34d" font-size="17">a₂</text>`:
      pl>0?`<text x="${(70+px)/2}" y="235" fill="#7dd3fc" font-size="17">a₂=p</text><text x="75" y="185" fill="#86efac" font-size="17">u₂=0</text>`:
      ul>0?`<text x="82" y="${(uy+210)/2}" fill="#86efac" font-size="17">a₂=u₂</text><text x="82" y="235" fill="#7dd3fc" font-size="17">p=0</text>`:
      '<text x="82" y="195" fill="#fcd34d" font-size="17">a₂=p=u₂=0</text>';
    $('geometry').innerHTML=`<svg viewBox="0 0 540 270" role="img" aria-labelledby="gsTitle gsDesc"><title id="gsTitle">a₂ 分解为投影 p 与正交方向 u₂</title><desc id="gsDesc">p 长度 ${pl.toFixed(3)}，u₂ 长度 ${ul.toFixed(3)}。非零方向互相垂直；零向量不画箭头。</desc><defs><marker id="arrowP" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="#7dd3fc"/></marker><marker id="arrowU" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="#86efac"/></marker><marker id="arrowA" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="#fcd34d"/></marker></defs>${pLine}${uLine}${aLine}${both?`<path d="M ${px-12} 210 v -12 h 12" fill="none" stroke="#bac8dd" stroke-width="2"/>`:''}<circle cx="70" cy="210" r="4" fill="#f3f7ff"/><text x="53" y="235" fill="#f3f7ff" font-size="16">0</text>${labels}</svg>`;
  }
  function showAnswer(s) {
    $('answer').hidden=false;diagram(s);
    const directionLines=s.directions.length?s.directions.map((d,i)=>`q${i+1} = ${vector(d.numerator)} / √(${d.normSquared}) （来自 a${d.source+1}）`):['Q 没有列；零向量不能归一化。'];
    const rLines=s.R.length?s.R.map((row,i)=>`R 第 ${i+1} 行 = ${vector(row)}`):['R 没有行（0×2）。'];
    $('answerGrid').replaceChildren(
      card('投影减除',[`c = ${s.coefficient}`,`p = ${vector(s.projection)}`,`u₂ = a₂−p = ${vector(s.residual)}`,`a₁·u₂ = ${s.verification.firstDotResidual}`]),
      card('正交单位列',directionLines.concat([`rank(A) = ${s.rank}；Q 为 ${s.dimensions.Q}。`])),
      card('R 与薄 QR',rLines.concat([`R 为 ${s.dimensions.R}；R=QᵀA。`,s.rank===2?'两列独立，R 为 2×2 上三角矩阵。':'按非零方向保留列：这是秩揭示的薄 QR。'])),
      card('乘回原矩阵',[`A = ${matrix(s.matrix)}`,`QR = ${matrix(Array.from({length:3},(_,i)=>[s.verification.reconstruction[0][i],s.verification.reconstruction[1][i]]))}`])
    );
    $('verificationInfo').textContent=`精确核验：QᵀQ=I${s.rank}；R=QᵀA；QR=A。${s.firstColumnZero?'第一列为零，直接从第二列寻找非零方向。':''}${!s.newDirection?'第二列未产生新方向。':''}`;
  }
  function solveCurrent(){const A=readInputs();if(!A){clearOutcome();return null;}return GramSchmidtModel.solve(A);}
  function checkPrediction(){
    const s=solveCurrent();if(!s)return;
    const checks=GramSchmidtModel.checkPrediction(s,{coefficient:$('coefficientGuess').value,residual:[0,1,2].map(i=>$(`residual-${i}`).value),rank:$('rankGuess').value,newDirection:$('directionGuess').value});
    const labels={coefficient:'投影系数 c',residual:'正交余量 u₂',rank:'秩',newDirection:'新方向判断'};
    const all=Object.values(checks).every(Boolean);
    $('predictionFeedback').textContent=Object.entries(checks).map(([key,okay])=>`${okay?'✓':'再核'} ${labels[key]}`).join('；')+(all?'。已完成预测。':'。可修改后重试，或查看示范。');
    if(all){showAnswer(s);if(typeof PageProgress!=='undefined')PageProgress.markDone('gram-schmidt-qr');}else $('answer').hidden=true;
  }
  function reveal(){const s=solveCurrent();if(!s)return;showAnswer(s);$('predictionFeedback').textContent='已显示示范；此操作不记录完成。';}
  $('preset').addEventListener('change',()=>{const A=presets[$('preset').value];if(A)setInputs(A);});
  $('checkPrediction').addEventListener('click',checkPrediction);$('revealAnswer').addEventListener('click',reveal);
  setInputs(presets.independent);
})();
