/* Finite PLU learning interaction. */
(()=>{
  'use strict';
  const presets={
    swap:{A:[[2,1,1],[3,-2,0],[-2,2,2]],b:[1,-2,3]},
    'two-swaps':{A:[[-1,0,3],[3,-1,2],[-1,-1,2]],b:[1,2,3]},
    'second-swap':{A:[[1,1,1],[1,1,2],[1,2,3]],b:[1,2,3]},
    tie:{A:[[2,1,0],[-2,0,1],[0,1,1]],b:[1,2,3]},
    'zero-column':{A:[[0,1,0],[0,0,1],[0,0,0]],b:[1,2,3]},
    singular:{A:[[1,1,1],[2,2,2],[0,1,1]],b:[1,2,3]},
    zero:{A:[[0,0,0],[0,0,0],[0,0,0]],b:[0,0,0]}
  };
  const $=id=>document.getElementById(id),f=PLUModel.format;
  const number=n=>typeof n==='number'?String(n):f(n);
  const vector=v=>`[${v.map(number).join(', ')}]`;
  const matrix=M=>`[${M.map(vector).join(' ; ')}]`;
  function field(id,value,limit,labelText){const label=document.createElement('label'),input=document.createElement('input');input.id=id;input.type='number';input.min=String(-limit);input.max=String(limit);input.step='1';input.value=String(value);input.addEventListener('input',edited);label.htmlFor=id;label.append(labelText,input);return label;}
  function renderInputs(A,b){$('matrixEditor').replaceChildren();$('vectorEditor').replaceChildren();for(let i=0;i<3;i++)for(let j=0;j<3;j++)$('matrixEditor').append(field(`a-${i}-${j}`,A[i][j],3,`a${i+1}${j+1}`));for(let i=0;i<3;i++)$('vectorEditor').append(field(`b-${i}`,b[i],4,`b${i+1}`));}
  function clearOutcome(){$('answer').hidden=true;$('predictionFeedback').textContent='';for(const id of ['m21Guess','m31Guess','detGuess','x1Guess'])$(id).value='';for(const id of ['pivotGuess','uniqueGuess'])$(id).value='';}
  function read(){let valid=true;function readField(id,limit){const input=$(id),raw=input.value.trim(),n=Number(raw),okay=raw!==''&&Number.isInteger(n)&&Math.abs(n)<=limit;input.setAttribute('aria-invalid',String(!okay));if(!okay)valid=false;return n;}
    const A=Array.from({length:3},(_,i)=>Array.from({length:3},(_,j)=>readField(`a-${i}-${j}`,3))),b=Array.from({length:3},(_,i)=>readField(`b-${i}`,4));$('inputStatus').textContent=valid?'':'输入无效：A 每项须为 −3 到 3 的整数，b 每项须为 −4 到 4 的整数；空值不能当作 0。';return valid?{A,b}:null;}
  function edited(){$('preset').value='custom';clearOutcome();read();}
  function setExample(example){renderInputs(example.A,example.b);clearOutcome();read();}
  function card(title,lines){const box=document.createElement('div'),heading=document.createElement('h3');box.className='card';heading.textContent=title;box.append(heading);for(const line of lines){const p=document.createElement('p');p.className='formula';p.textContent=line;box.append(p);}return box;}
  function show(s){
    $('answer').hidden=false;
    $('stepCards').replaceChildren(...s.steps.map(step=>{
      const k=step.column+1;
      if(step.pivotOriginal===null)return card(`第 ${k} 列：无主元`,[`当前 U=${matrix(step.before)}`,`从第 ${k} 行起，该列全为零；本轮不做除法，也不制造乘数。`,`本轮后 U=${matrix(step.after)}`]);
      const move=step.swap?`交换当前第 ${step.swap[0]+1}、${step.swap[1]+1} 行；同步交换 L 已有的左侧乘数。`:'无需交换行。';
      const multipliers=step.multipliers.length?step.multipliers.map(item=>`第 ${item.row+1} 行减去 ${f(item.value)} × 主元行`).join('；'):'最后一行，无需向下消元。';
      return card(`第 ${k} 列：选主元并消元`,[`本轮前 U=${matrix(step.before)}`,`主元来自 A 原第 ${step.pivotOriginal+1} 行。${move}`,multipliers,`本轮后 U=${matrix(step.after)}`]);
    }));
    const detSign=s.swaps%2?'-':'+';
    const cards=[card('P、L、U 的精确分解',[`P 的行顺序：A 原第 ${s.order.map(i=>i+1).join('、')} 行`,`P=${matrix(s.P)}`,`L=${matrix(s.L)}`,`U=${matrix(s.U)}`,`PA=${matrix(s.PA)}`,`LU=${matrix(s.LU)}`]),card('行列式、秩和可逆性',[`交换次数 ${s.swaps}，det(P)=${detSign}1`,`det(A)=det(P) × U₁₁U₂₂U₃₃=${s.det}`,`rank(A)=${s.rank}（独立子式判定）`,s.unique?'三阶满秩，Ax=b 有唯一解。':'A 奇异：Ax=b 没有唯一解；给定 b 可能无解，也可能有无穷多解。'])];
    if(s.unique)cards.push(card('前代与回代',[`b=${vector(s.b)}；Pb=${vector(s.Pb)}`,`Ly=Pb，y=${vector(s.y)}`,`Ux=y，x=${vector(s.x)}`,`代回 Ax=${vector(s.Ax)}=b。`]));
    else cards.push(card('奇异时的求解边界',[`b=${vector(s.b)}`,`U 至少有一个零对角主元，不能用通常的唯一解回代。`,`本工作台不据此声称无解或无穷多解；需另做相容性检查。`]));
    $('answerCards').replaceChildren(...cards);
    $('verificationInfo').textContent=s.unique?'精确核验：PA=LU，Ly=Pb，Ux=y，Ax=b；行交换的奇偶性已计入 det(A)。':'精确核验：PA=LU；独立子式确认秩小于 3，故不存在唯一解。';
  }
  function current(){const data=read();if(!data){clearOutcome();return null;}return PLUModel.solve(data.A,data.b);}
  function check(){const s=current();if(!s)return;const checks=PLUModel.prediction(s,{pivot:$('pivotGuess').value,m21:$('m21Guess').value,m31:$('m31Guess').value,det:$('detGuess').value,unique:$('uniqueGuess').value,x1:$('x1Guess').value}),labels={pivot:'首列主元行',m21:'m₂₁',m31:'m₃₁',det:'行列式',unique:'唯一性',x1:'解的 x₁'},all=Object.values(checks).every(Boolean);$('predictionFeedback').textContent=Object.entries(checks).map(([key,okay])=>`${okay?'✓':'再核'} ${labels[key]}`).join('；')+(all?s.unique?'。已完成预测。':'。正确识别无唯一解；请换可逆矩阵完成三角求解任务。':'。可修改后重试，或查看示范。');if(all){show(s);if(s.unique&&typeof PageProgress!=='undefined')PageProgress.markDone('plu-elimination');}else $('answer').hidden=true;}
  $('preset').addEventListener('change',()=>{const example=presets[$('preset').value];if(example)setExample(example);});$('checkPrediction').addEventListener('click',check);$('revealAnswer').addEventListener('click',()=>{const s=current();if(!s)return;show(s);$('predictionFeedback').textContent='已显示示范；此操作不记录完成。';});setExample(presets.swap);
})();
