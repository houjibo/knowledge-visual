/* Interaction controller for exact 2×2 symmetric spectral decomposition. */
(() => {
  'use strict';
  const presets={
    rotated:{A:[[2,1],[1,2]],v:[1,1]},irrational:{A:[[2,1],[1,1]],v:[1,2]},
    diagonal:{A:[[3,0],[0,1]],v:[1,2]},mixed:{A:[[1,2],[2,-1]],v:[1,1]},
    scalar:{A:[[2,0],[0,2]],v:[1,2]},zero:{A:[[0,0],[0,0]],v:[0,0]}
  };
  const $=id=>document.getElementById(id);
  function numericInput(id,value,min,max,labelText,onInput){
    const label=document.createElement('label'),input=document.createElement('input');
    input.id=id;input.type='number';input.min=String(min);input.max=String(max);input.step='1';input.value=String(value);
    label.htmlFor=id;label.append(labelText,input);input.addEventListener('input',onInput);return label;
  }
  function renderInputs(A,v){
    $('matrixEditor').replaceChildren();$('vectorEditor').replaceChildren();
    $('matrixEditor').append(numericInput('a-0-0',A[0][0],-5,5,'a11',edited),numericInput('a-0-1',A[0][1],-5,5,'a12',edited));
    const mirror=document.createElement('label'),output=document.createElement('output');
    output.id='a-1-0';output.htmlFor='a-0-1';output.textContent=String(A[0][1]);mirror.append('a21 = a12',output);$('matrixEditor').append(mirror);
    $('matrixEditor').append(numericInput('a-1-1',A[1][1],-5,5,'a22',edited));
    for(let i=0;i<2;i++)$('vectorEditor').append(numericInput(`v-${i}`,v[i],-3,3,`v${i+1}`,edited));
  }
  function renderImageGuesses(){
    $('imageGuess').replaceChildren();
    for(let i=0;i<2;i++){
      const label=document.createElement('label'),input=document.createElement('input');
      input.id=`image-${i}`;input.type='text';input.inputMode='numeric';label.htmlFor=input.id;label.append(`Av 的第 ${i+1} 项`,input);$('imageGuess').append(label);
    }
  }
  function clearOutcome(){
    $('answer').hidden=true;$('predictionFeedback').textContent='';$('traceGuess').value='';$('patternGuess').value='';$('eigenGuess').value='';renderImageGuesses();
  }
  function readInputs(){
    let valid=true;
    function read(id,limit){const input=$(id),raw=input.value.trim(),value=Number(raw),okay=raw!==''&&Number.isInteger(value)&&Math.abs(value)<=limit;
      input.setAttribute('aria-invalid',String(!okay));if(!okay)valid=false;return value;}
    const a=read('a-0-0',5),b=read('a-0-1',5),d=read('a-1-1',5),v=[read('v-0',3),read('v-1',3)];
    $('a-1-0').textContent=Number.isInteger(b)?String(b):'—';
    $('inputStatus').textContent=valid?'':'输入无效：A 的三个独立元素须为 −5 到 5 的整数，v 的两项须为 −3 到 3 的整数；空值不能当作 0。';
    return valid?{A:[[a,b],[b,d]],v}:null;
  }
  function edited(){$('preset').value='custom';clearOutcome();readInputs();}
  function setInputs(example){renderInputs(example.A,example.v);clearOutcome();readInputs();}
  const vector=v=>`[${v.join(', ')}]`;
  const matrix=A=>`[${A.map(row=>row.join(', ')).join(' ; ')}]`;
  function card(title,lines){const box=document.createElement('div'),heading=document.createElement('h3');box.className='answer-card';heading.textContent=title;box.append(heading);
    for(const line of lines){const p=document.createElement('p');p.className='formula';p.textContent=line;box.append(p);}return box;}
  function drawPlot(s){
    const canvas=$('spectralCanvas'),ctx=canvas.getContext('2d'),size=canvas.width,center=size/2;
    ctx.fillStyle='#0c2337';ctx.fillRect(0,0,size,size);
    const norms=[s.vector,...s.components.map(item=>item.numeric)].map(v=>Math.hypot(...v));
    const scale=150/Math.max(3,...norms);
    const point=v=>[center+v[0]*scale,center-v[1]*scale];
    ctx.strokeStyle='#64809b';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(center,0);ctx.lineTo(center,size);ctx.moveTo(0,center);ctx.lineTo(size,center);ctx.stroke();
    ctx.save();ctx.setLineDash([6,5]);ctx.lineWidth=2;
    s.eigenvectors.forEach((item,i)=>{const q=item.numeric;ctx.strokeStyle=i===0?'#7dd3fc':'#86efac';ctx.beginPath();ctx.moveTo(center-q[0]*155,center+q[1]*155);ctx.lineTo(center+q[0]*155,center-q[1]*155);ctx.stroke();});ctx.restore();
    function arrow(v,color,width){
      const [x,y]=point(v),dx=x-center,dy=y-center,len=Math.hypot(dx,dy);if(len<1)return;
      ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(center,center);ctx.lineTo(x,y);ctx.stroke();
      const ux=dx/len,uy=dy/len;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-12*ux-6*uy,y-12*uy+6*ux);ctx.lineTo(x-12*ux+6*uy,y-12*uy-6*ux);ctx.closePath();ctx.fill();
    }
    arrow(s.vector,'#fcd34d',4);arrow(s.components[0].numeric,'#7dd3fc',3);arrow(s.components[1].numeric,'#86efac',3);
    ctx.fillStyle='#f3f8ff';ctx.font='16px sans-serif';ctx.fillText('x',size-18,center-8);ctx.fillText('y',center+8,18);
    canvas.setAttribute('aria-label',`两条正交特征轴与向量分解。v=${vector(s.vector)}；第一分量 ${vector(s.components[0].exact)}，第二分量 ${vector(s.components[1].exact)}。${s.zeroVector?'零向量没有箭头。':''}`);
    $('plotExplanation').textContent=s.zeroVector?'当前 v=0，Av=0，但零向量不是特征向量。':s.pattern==='repeated'?
      `当前 v=${vector(s.vector)}；标量重根时任意非零 v 都是特征向量。这里选 Q=I 分解它，基并不唯一。`:
      `当前 v=${vector(s.vector)}；${s.isEigenvector?'它沿一条特征方向。':'它由两条正交特征方向的分量合成。'}`;
  }
  function showAnswer(s){
    $('answer').hidden=false;
    const qLines=s.eigenvectors.map((item,i)=>`q${i+1} = ${vector(item.raw)} / √(${item.normSquared})`);
    const componentLines=s.components.map((item,i)=>`v${i+1}=P${i+1}v = ${vector(item.exact)}`);
    $('answerGrid').replaceChildren(
      card('特征值与判别式',[`A = ${matrix(s.matrix)}`,`tr(A)=${s.trace}；det(A)=${s.det}`,`Δ=(a−d)²+4b²=${s.discriminant}`,`λ₁=${s.eigenvalues[0]}；λ₂=${s.eigenvalues[1]}`,s.pattern==='repeated'?'重复特征值：A 是标量矩阵。':'两个不同的实特征值。']),
      card('正交单位特征方向',qLines.concat([`Q=[q₁ q₂]；QᵀQ=I₂。`,s.explanation])),
      card('把 v 投到特征方向',componentLines.concat([`v=v₁+v₂=${vector(s.vector)}`,s.pattern==='distinct'?`P₁,₂=(I±B/√Δ)/2，B=${matrix(s.B)}`:'此处选 P₁=diag(1,0)、P₂=diag(0,1)。'])),
      card('按方向缩放再合成',[`Av=${vector(s.image)}`,`Av=λ₁v₁+λ₂v₂`,s.zeroVector?'v=0 不是特征向量。':s.isEigenvector?'v 是特征向量。':'v 不是特征向量。',`A=QΛQᵀ，Λ=diag(${s.eigenvalues.join(', ')}).`])
    );
    drawPlot(s);
    $('verificationInfo').textContent=`精确核验：B=2A−tr(A)I，B²=${s.discriminant}I；QᵀQ=I₂；v=P₁v+P₂v；Av=λ₁P₁v+λ₂P₂v；A=QΛQᵀ。${s.pattern==='repeated'?'标量重根时 Q=I 是一个选择，并非唯一。':''}`;
  }
  function solveCurrent(){const data=readInputs();if(!data){clearOutcome();return null;}return SymmetricSpectralModel.solve(data.A,data.v);}
  function checkPrediction(){
    const s=solveCurrent();if(!s)return;
    const checks=SymmetricSpectralModel.checkPrediction(s,{trace:$('traceGuess').value,pattern:$('patternGuess').value,isEigenvector:$('eigenGuess').value,image:[0,1].map(i=>$(`image-${i}`).value)});
    const labels={trace:'迹',pattern:'特征值是否重复',isEigenvector:'v 是否为特征向量',image:'Av'};
    const all=Object.values(checks).every(Boolean);
    $('predictionFeedback').textContent=Object.entries(checks).map(([key,okay])=>`${okay?'✓':'再核'} ${labels[key]}`).join('；')+(all?'。已完成预测。':'。可修改后重试，或查看示范。');
    if(all){showAnswer(s);if(typeof PageProgress!=='undefined')PageProgress.markDone('symmetric-spectral');}else $('answer').hidden=true;
  }
  function reveal(){const s=solveCurrent();if(!s)return;showAnswer(s);$('predictionFeedback').textContent='已显示示范；此操作不记录完成。';}
  $('preset').addEventListener('change',()=>{const example=presets[$('preset').value];if(example)setInputs(example);});
  $('checkPrediction').addEventListener('click',checkPrediction);$('revealAnswer').addEventListener('click',reveal);
  setInputs(presets.rotated);
})();
