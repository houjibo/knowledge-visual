/* Exact finite change-of-basis interaction. */
(()=>{
  'use strict';
  const presets={
    shear:{W:[[1,1],[0,1]],A:[[2,1],[0,3]],x:[3,2]},
    fraction:{W:[[2,1],[0,2]],A:[[1,1],[0,2]],x:[1,3]},
    orientation:{W:[[0,1],[1,0]],A:[[0,-1],[1,0]],x:[1,2]},
    singular:{W:[[1,2],[1,2]],A:[[2,1],[0,1]],x:[1,1]},
    outside:{W:[[1,2],[1,2]],A:[[2,1],[0,1]],x:[1,0]},
    zero:{W:[[0,0],[0,0]],A:[[2,1],[0,1]],x:[0,0]}
  };
  const $=id=>document.getElementById(id),f=BasisChangeModel.format;
  const vector=v=>`[${v.map(n=>typeof n==='number'?String(n):f(n)).join(', ')}]`;
  const matrix=M=>`[${M.map(vector).join(' ; ')}]`;
  function input(id,value,limit,labelText){const label=document.createElement('label'),field=document.createElement('input');field.id=id;field.type='number';field.min=String(-limit);field.max=String(limit);field.step='1';field.value=String(value);field.addEventListener('input',edited);label.htmlFor=id;label.append(labelText,field);return label;}
  function renderInputs(W,A,x){for(const id of ['basisEditor','transformEditor','vectorEditor'])$(id).replaceChildren();for(let i=0;i<2;i++)for(let j=0;j<2;j++)$('basisEditor').append(input(`w-${i}-${j}`,W[i][j],3,`w${i+1}${j+1}`));for(let i=0;i<2;i++)for(let j=0;j<2;j++)$('transformEditor').append(input(`a-${i}-${j}`,A[i][j],3,`a${i+1}${j+1}`));for(let i=0;i<2;i++)$('vectorEditor').append(input(`x-${i}`,x[i],4,`x${i+1}`));}
  function clearOutcome(){$('answer').hidden=true;$('predictionFeedback').textContent='';for(const id of ['detGuess','c0Guess','c1Guess','b00Guess'])$(id).value='';$('basisGuess').value='';}
  function read(){let valid=true;function number(id,limit){const field=$(id),raw=field.value.trim(),n=Number(raw),okay=raw!==''&&Number.isInteger(n)&&Math.abs(n)<=limit;field.setAttribute('aria-invalid',String(!okay));if(!okay)valid=false;return n;}
    const W=Array.from({length:2},(_,i)=>Array.from({length:2},(_,j)=>number(`w-${i}-${j}`,3))),A=Array.from({length:2},(_,i)=>Array.from({length:2},(_,j)=>number(`a-${i}-${j}`,3))),x=[number('x-0',4),number('x-1',4)];
    const det=W[0][0]*W[1][1]-W[0][1]*W[1][0];$('coordinateGuess').hidden=!valid||det===0;$('singularHint').hidden=!valid||det!==0;
    $('inputStatus').textContent=valid?'':'输入无效：W、A 每项须为 −3 到 3 的整数，x 每项须为 −4 到 4 的整数；空值不能当作 0。';return valid?{W,A,x}:null;}
  function edited(){$('preset').value='custom';clearOutcome();read();}
  function setExample(example){renderInputs(example.W,example.A,example.x);clearOutcome();read();}
  function card(title,lines){const box=document.createElement('div'),heading=document.createElement('h3');box.className='card';heading.textContent=title;box.append(heading);for(const line of lines){const p=document.createElement('p');p.className='formula';p.textContent=line;box.append(p);}return box;}
  function draw(s){const canvas=$('basisCanvas'),ctx=canvas.getContext('2d'),center=200,vectors=[[s.W[0][0],s.W[1][0]],[s.W[0][1],s.W[1][1]],s.x,s.image],max=Math.max(3,...vectors.map(v=>Math.hypot(...v))),scale=155/max;
    ctx.fillStyle='#0c2337';ctx.fillRect(0,0,400,400);ctx.strokeStyle='#66829d';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,center);ctx.lineTo(400,center);ctx.moveTo(center,0);ctx.lineTo(center,400);ctx.stroke();
    vectors.forEach((v,i)=>{const end=[center+v[0]*scale,center-v[1]*scale],dx=end[0]-center,dy=end[1]-center,len=Math.hypot(dx,dy);if(len<1)return;const color=['#7dd3fc','#86efac','#fcd34d','#fca5a5'][i],ux=dx/len,uy=dy/len;ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(center,center);ctx.lineTo(...end);ctx.stroke();ctx.beginPath();ctx.moveTo(...end);ctx.lineTo(end[0]-12*ux-6*uy,end[1]-12*uy+6*ux);ctx.lineTo(end[0]-12*ux+6*uy,end[1]-12*uy-6*ux);ctx.closePath();ctx.fill();ctx.font='15px sans-serif';ctx.fillText(['w₁','w₂','x','Ax'][i],Math.min(365,end[0]+7),Math.max(18,end[1]-7));});
    canvas.setAttribute('aria-label',`标准平面向量：w₁=${vector(vectors[0])}，w₂=${vector(vectors[1])}，x=${vector(s.x)}，Ax=${vector(s.image)}；det(W)=${s.det}，${s.basis?'两列组成基':'两列不能组成基'}。`);
    $('plotExplanation').textContent=s.basis?`det(W)=${s.det}，两列独立；x=${vector(s.x)} 的新基坐标是 ${vector(s.coordinates)}。`:`det(W)=0，两列相关；${s.inSpan?'x 在张成空间中，但坐标不唯一。':'x 不在张成空间中，没有这组列的坐标。'}`;}
  function show(s){$('answer').hidden=false;const cards=s.basis?[
    card('向量坐标往返',[`W=${matrix(s.W)}；det(W)=${s.det}`,`W⁻¹=(1/${s.det})${matrix(s.adj)}`,`x=${vector(s.x)}；c=W⁻¹x=${vector(s.coordinates)}`,`Wc=${vector(s.vectorBack)}=x`]),
    card('同一变换的两种矩阵',[`A=${matrix(s.A)}；AW=${matrix(s.AW)}`,`B=W⁻¹AW=${matrix(s.B)}`,`AW=WB；B 的第 j 列是 T(wⱼ) 的新基坐标。`,`tr(A)=tr(B)=${f(s.traceB)}；det(A)=det(B)=${f(s.detB)}。`]),
    card('先换坐标还是先变换？',[`c=${vector(s.coordinates)}；Bc=${vector(s.transformedCoordinates)}`,`W(Bc)=${vector(s.imageBack)}；Ax=${vector(s.image)}`,`W(Bc)=Ax，两个路径到同一标准向量。`]),
    card('基的边界',[`w₁·w₂=${s.W[0][0]*s.W[0][1]+s.W[1][0]*s.W[1][1]}；有效基不要求垂直。`,`det(W)≠0 才能用 W⁻¹。`,`数值皆为精确有理数；画布仅按比例展示。`])
  ]:[
    card('线性相关，不能换基',[`W=${matrix(s.W)}；det(W)=0`,`rank(W)=${s.rank}，两列不能成为 R² 的基。`,`W⁻¹ 不存在；B=W⁻¹AW 未定义。`]),
    card('当前向量与列空间',[`x=${vector(s.x)}；Ax=${vector(s.image)}`,s.inSpan?'x 在 W 的列空间中，但用这两列表示 x 的坐标不唯一。':'x 不在 W 的列空间中，无法用这两列表示 x。','请选择线性独立的两列，再核对坐标与相似变换。'])
  ];$('answerGrid').replaceChildren(...cards);draw(s);$('verificationInfo').textContent=s.basis?`精确核验：Wc=x；AW=WB；W(Bc)=Ax=${vector(s.image)}；tr、det 在相似变换下保持不变。`:'精确判据：det(W)=0。W⁻¹ 不存在，因此不计算新基坐标或相似矩阵，也不记录本任务完成。';}
  function current(){const data=read();if(!data){clearOutcome();return null;}return BasisChangeModel.solve(data.W,data.A,data.x);}
  function check(){const s=current();if(!s)return;const checks=BasisChangeModel.checkPrediction(s,{det:$('detGuess').value,basis:$('basisGuess').value,coordinates:[$('c0Guess').value,$('c1Guess').value],matrixEntry:$('b00Guess').value}),labels={det:'行列式',basis:'是否为基',coordinates:'向量坐标',matrixEntry:'矩阵元 B₁₁'},all=Object.values(checks).every(Boolean);$('predictionFeedback').textContent=Object.entries(checks).map(([key,okay])=>`${okay?'✓':'再核'} ${labels[key]}`).join('；')+(all?s.basis?'。已完成预测。':'。正确识别非基；请换有效基完成任务。':'。可修改后重试，或查看示范。');if(all){show(s);if(s.basis&&typeof PageProgress!=='undefined')PageProgress.markDone('change-of-basis');}else $('answer').hidden=true;}
  $('preset').addEventListener('change',()=>{const example=presets[$('preset').value];if(example)setExample(example);});$('checkPrediction').addEventListener('click',check);$('revealAnswer').addEventListener('click',()=>{const s=current();if(!s)return;show(s);$('predictionFeedback').textContent='已显示示范；此操作不记录完成。';});setExample(presets.shear);
})();
