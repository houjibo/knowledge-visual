/* Interaction controller for exact 2×2 quadratic-form sign exploration. */
(() => {
  'use strict';
  const presets={
    positive:[[2,1],[1,2]],semipositive:[[1,1],[1,1]],negative:[[-1,0],[0,-2]],
    indefinite:[[1,2],[2,1]],seminegative:[[-1,0],[0,0]],zero:[[0,0],[0,0]],
    'asymmetric-positive':[[2,1],[0,2]],'asymmetric-semi':[[1,2],[0,1]]
  };
  const $=id=>document.getElementById(id);
  function numericInput(id,value,min,max,labelText,onInput){
    const label=document.createElement('label'),input=document.createElement('input');
    input.id=id;input.type='number';input.min=String(min);input.max=String(max);input.step='1';input.value=String(value);
    label.htmlFor=id;label.append(labelText,input);input.addEventListener('input',onInput);return label;
  }
  function renderInputs(A,v){
    $('matrixEditor').replaceChildren();$('vectorEditor').replaceChildren();
    for(let i=0;i<2;i++)for(let j=0;j<2;j++)$('matrixEditor').append(numericInput(`a-${i}-${j}`,A[i][j],-5,5,`a${i+1}${j+1}`,edited));
    for(let i=0;i<2;i++)$('vectorEditor').append(numericInput(`v-${i}`,v[i],-3,3,`v${i+1}`,edited));
  }
  function clearOutcome(){
    $('answer').hidden=true;$('predictionFeedback').textContent='';$('symmetryGuess').value='';$('formGuess').value='';$('valueGuess').value='';
  }
  function readInputs(){
    let valid=true;
    function read(id,limit){const input=$(id),raw=input.value.trim(),value=Number(raw),okay=raw!==''&&Number.isInteger(value)&&Math.abs(value)<=limit;
      input.setAttribute('aria-invalid',String(!okay));if(!okay)valid=false;return value;}
    const A=Array.from({length:2},(_,i)=>Array.from({length:2},(_,j)=>read(`a-${i}-${j}`,5)));
    const v=Array.from({length:2},(_,i)=>read(`v-${i}`,3));
    $('inputStatus').textContent=valid?'':'输入无效：A 每项须为 −5 到 5 的整数，v 每项须为 −3 到 3 的整数；空值不能当作 0。';
    return valid?{A,v}:null;
  }
  function edited(){$('preset').value='custom';clearOutcome();readInputs();}
  function setInputs(A){renderInputs(A,[1,-1]);clearOutcome();readInputs();}
  const vector=v=>`[${v.join(', ')}]`;
  const matrix=A=>`[${A.map(row=>row.join(', ')).join(' ; ')}]`;
  function card(title,lines){const box=document.createElement('div'),heading=document.createElement('h3');box.className='answer-card';heading.textContent=title;box.append(heading);
    for(const line of lines){const p=document.createElement('p');p.className='formula';p.textContent=line;box.append(p);}return box;}
  function witnessLine(name,w){return w?`${name}：v=${vector(w.vector)}≠0，q(v)=${w.value}`:null;}
  function drawPlot(s){
    const canvas=$('signCanvas'),ctx=canvas.getContext('2d'),size=canvas.width,image=ctx.createImageData(size,size);
    for(let py=0;py<size;py++)for(let px=0;px<size;px++){
      const x=(px+.5-size/2)*6/size,y=(size/2-py-.5)*6/size;
      const q=s.coefficients.a*x*x+s.coefficients.cross*x*y+s.coefficients.d*y*y;
      const ratio=q/(x*x+y*y||1),near=Math.abs(ratio)<.08;
      const color=near?[86,123,128]:q>0?[45,124,171]:[209,103,79],index=(py*size+px)*4;
      image.data[index]=color[0];image.data[index+1]=color[1];image.data[index+2]=color[2];image.data[index+3]=255;
    }
    ctx.putImageData(image,0,0);ctx.strokeStyle='rgba(255,255,255,.65)';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.moveTo(size/2,0);ctx.lineTo(size/2,size);ctx.moveTo(0,size/2);ctx.lineTo(size,size/2);ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,.9)';ctx.font='16px sans-serif';ctx.fillText('y',size/2+8,18);ctx.fillText('x',size-18,size/2-8);
    ctx.font='13px sans-serif';ctx.fillText('−3',8,size/2-8);ctx.fillText('3',size-18,size/2+20);
    if((s.formClass==='semipositive'||s.formClass==='seminegative')&&s.zeroWitness){
      const [vx,vy]=s.zeroWitness.vector,t=3/Math.max(Math.abs(vx),Math.abs(vy));
      ctx.strokeStyle='#86efac';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(size/2-vx*t*size/6,size/2+vy*t*size/6);
      ctx.lineTo(size/2+vx*t*size/6,size/2-vy*t*size/6);ctx.stroke();
    }
    const cx=size/2+s.vector[0]*size/6,cy=size/2-s.vector[1]*size/6;
    ctx.fillStyle='#fcd34d';ctx.strokeStyle='#111827';ctx.lineWidth=3;ctx.beginPath();ctx.arc(cx,cy,7,0,2*Math.PI);ctx.fill();ctx.stroke();
    canvas.setAttribute('aria-label',`x、y 在 −3 到 3 的二次型符号区域；${s.formLabel}。当前 v=${vector(s.vector)}，q(v)=${s.qValue}。蓝色为正，橙色为负，灰绿为近零。`);
    const semidefinite=s.formClass==='semipositive'||s.formClass==='seminegative';
    $('plotExplanation').textContent=`当前 v=${vector(s.vector)}，q(v)=${s.qValue}。${semidefinite?`精确零方向 ${vector(s.zeroWitness.vector)} 与原点连成绿线。`:s.formClass==='zero'?'零型的所有方向都有 q=0。':''}`;
  }
  function showAnswer(s){
    $('answer').hidden=false;
    const form=`q(x,y) = ${s.coefficients.a}x² + (${s.coefficients.cross})xy + ${s.coefficients.d}y²`;
    const witnessLines=[witnessLine('正方向',s.positiveWitness),witnessLine('负方向',s.negativeWitness),witnessLine('零方向',s.zeroWitness)].filter(Boolean);
    $('answerGrid').replaceChildren(
      card('矩阵与二次型',[`A = ${matrix(s.matrix)}`,`A ${s.symmetric?'=':'≠'} Aᵀ`,form,`q${vector(s.vector)} = ${s.qValue}`]),
      card('对称部分与精确判据',[`S=(A+Aᵀ)/2 = ${matrix(s.symmetricPart)}`,`4det(S) = ${s.fourDetS}；tr(S) = ${s.trace}`,`S 的特征值 = ${vector(s.eigenvalues)}`,s.criterion]),
      card('符号类别与结论',[`q 的类别：${s.formLabel}`,s.symmetricPositiveDefinite?'A 是对称正定矩阵。':s.symmetric?'A 不是对称正定矩阵。':'q 由 S 决定；A 非对称，不称为本课的对称正定矩阵。',s.formClass==='positive'?'对每个非零实向量，q>0。':'存在非零方向使 q≤0，不能称二次型严格正定。']),
      card('非零方向证据',witnessLines.concat(['有限方向举例只帮助观察；全称结论来自精确判据。']))
    );
    drawPlot(s);
    $('verificationInfo').textContent=`精确核验：xᵀAx=xᵀSx；4det(S)=${s.fourDetS}。${s.symmetric?`对称时 det(A)=${s.detA}，首个顺序主子式 a=${s.matrix[0][0]}。`:'A 的行列式不能代替 S 的正定判别。'}${s.formClass==='semipositive'?'非零零方向说明只有半正定。':''}`;
  }
  function solveCurrent(){const data=readInputs();if(!data){clearOutcome();return null;}return PositiveDefiniteModel.solve(data.A,data.v);}
  function checkPrediction(){
    const s=solveCurrent();if(!s)return;
    const checks=PositiveDefiniteModel.checkPrediction(s,{symmetric:$('symmetryGuess').value,formClass:$('formGuess').value,value:$('valueGuess').value});
    const labels={symmetric:'对称性',formClass:'二次型符号类别',value:'当前 q(v)'};
    const all=Object.values(checks).every(Boolean);
    $('predictionFeedback').textContent=Object.entries(checks).map(([key,okay])=>`${okay?'✓':'再核'} ${labels[key]}`).join('；')+(all?'。已完成预测。':'。可修改后重试，或查看示范。');
    if(all){showAnswer(s);if(typeof PageProgress!=='undefined')PageProgress.markDone('positive-definite');}else $('answer').hidden=true;
  }
  function reveal(){const s=solveCurrent();if(!s)return;showAnswer(s);$('predictionFeedback').textContent='已显示示范；此操作不记录完成。';}
  $('preset').addEventListener('change',()=>{const A=presets[$('preset').value];if(A)setInputs(A);});
  $('checkPrediction').addEventListener('click',checkPrediction);$('revealAnswer').addEventListener('click',reveal);
  setInputs(presets.positive);
})();
