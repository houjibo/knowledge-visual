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
    inconsistent:{A:[[1,1,1],[2,2,2],[0,1,1]],b:[1,3,3]},
    'rank-one':{A:[[1,1,0],[2,2,0],[0,0,0]],b:[1,2,0]},
    zero:{A:[[0,0,0],[0,0,0],[0,0,0]],b:[0,0,0]},
    'zero-inconsistent':{A:[[0,0,0],[0,0,0],[0,0,0]],b:[1,0,0]}
  };
  const $=id=>document.getElementById(id),f=PLUModel.format;
  const number=n=>typeof n==='number'?String(n):f(n);
  const vector=v=>`[${v.map(number).join(', ')}]`;
  const matrix=M=>`[${M.map(vector).join(' ; ')}]`;
  function field(id,value,limit,labelText){const label=document.createElement('label'),input=document.createElement('input');input.id=id;input.type='number';input.min=String(-limit);input.max=String(limit);input.step='1';input.value=String(value);input.addEventListener('input',edited);label.htmlFor=id;label.append(labelText,input);return label;}
  function renderInputs(A,b){$('matrixEditor').replaceChildren();$('vectorEditor').replaceChildren();for(let i=0;i<3;i++)for(let j=0;j<3;j++)$('matrixEditor').append(field(`a-${i}-${j}`,A[i][j],3,`a${i+1}${j+1}`));for(let i=0;i<3;i++)$('vectorEditor').append(field(`b-${i}`,b[i],4,`b${i+1}`));}
  function clearOutcome(){$('answer').hidden=true;$('predictionFeedback').textContent='';for(const id of ['m21Guess','m31Guess','detGuess','augRankGuess','x1Guess'])$(id).value='';for(const id of ['pivotGuess','solutionGuess'])$(id).value='';}
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
    const classification={unique:'唯一解',infinite:'无穷多解',none:'无解'}[s.classification];
    const cards=[card('P、L、U 的精确分解',[`P 的行顺序：A 原第 ${s.order.map(i=>i+1).join('、')} 行`,`P=${matrix(s.P)}`,`L=${matrix(s.L)}`,`U=${matrix(s.U)}`,`PA=${matrix(s.PA)}`,`LU=${matrix(s.LU)}`]),card('行列式、秩和相容性',[`交换次数 ${s.swaps}，det(P)=${detSign}1`,`det(A)=det(P) × U₁₁U₂₂U₃₃=${s.det}`,`rank(A)=${s.rank}（独立子式判定）`,`rank([A|b])=${s.rankAugmented}；Ax=b：${classification}。`,s.rankAugmented>s.rank?'b 不在 A 的列空间。':'b 在 A 的列空间。']),card('右端也要一起消元',[`b=${vector(s.b)}；Pb=${vector(s.Pb)}`,`Ly=Pb，y=${vector(s.y)}`,`RREF([U|y])=${matrix(s.rref)}`,`rank([U|y])=rank([A|b])=${s.rankAugmented}。`])];
    if(s.unique)cards.push(card('前代与回代',[`Ux=y，x=${vector(s.x)}`,`代回 Ax=${vector(s.Ax)}=b。`]));
    else if(s.classification==='none')cards.push(card('矛盾行证明无解',[`RREF 第 ${s.contradictionRow+1} 行：[0, 0, 0 | 1]，即 0=1。`,`rank([A|b])=${s.rankAugmented}>rank(A)=${s.rank}；不存在满足 Ax=b 的 x。`]));
    else{
      const terms=s.nullBasis.map((_,i)=>`t${i+1}n${i+1}`);
      cards.push(card('特解与全部自由方向',[`主元列：${s.pivotColumns.map(i=>`x${i+1}`).join('、')||'无'}；自由列：${s.freeColumns.map(i=>`x${i+1}`).join('、')}`,`自由变量全设 0：xₚ=${vector(s.particular)}`,`Axₚ=${vector(s.AxParticular)}=b。`,...s.nullBasis.map((n,i)=>`n${i+1}=${vector(n)}；An${i+1}=${vector(s.nullImages[i])}`),`完整解：x=xₚ+${terms.join('+')}，t₁…t${terms.length} 可取任意实数。`]));
    }
    $('answerCards').replaceChildren(...cards);
    $('verificationInfo').textContent=s.unique?'精确核验：PA=LU，Ly=Pb，Ux=y，Ax=b；行交换的奇偶性已计入 det(A)。':s.classification==='none'?'精确核验：PA=LU，Ly=Pb；增广矩阵化简出现 0=1，因此无解。':'精确核验：PA=LU，Ly=Pb，Axₚ=b，所有 Anⱼ=0；特解加零空间给出全部解。';
  }
  function current(){const data=read();if(!data){clearOutcome();return null;}return PLUModel.solve(data.A,data.b);}
  function check(){const s=current();if(!s)return;const checks=PLUModel.prediction(s,{pivot:$('pivotGuess').value,m21:$('m21Guess').value,m31:$('m31Guess').value,det:$('detGuess').value,augRank:$('augRankGuess').value,classification:$('solutionGuess').value,x1:$('x1Guess').value}),labels={pivot:'首列主元行',m21:'m₂₁',m31:'m₃₁',det:'行列式',augRank:'增广秩',classification:'解的类型',x1:'解的 x₁'},all=Object.values(checks).every(Boolean);$('predictionFeedback').textContent=Object.entries(checks).map(([key,okay])=>`${okay?'✓':'再核'} ${labels[key]}`).join('；')+(all?s.unique?'。已完成预测。':'。已正确判断解集；请换可逆矩阵完成三角求解任务。':'。可修改后重试，或查看示范。');if(all){show(s);if(s.unique&&typeof PageProgress!=='undefined')PageProgress.markDone('plu-elimination');}else $('answer').hidden=true;}
  $('preset').addEventListener('change',()=>{const example=presets[$('preset').value];if(example)setExample(example);});$('checkPrediction').addEventListener('click',check);$('revealAnswer').addEventListener('click',()=>{const s=current();if(!s)return;show(s);$('predictionFeedback').textContent='已显示示范；此操作不记录完成。';});setExample(presets.swap);
})();
