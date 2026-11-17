/* Exact sign classification of bounded real 2×2 quadratic forms. */
(function(root){
  'use strict';
  const labels={positive:'严格正定',semipositive:'正半定（非零）',negative:'严格负定',seminegative:'负半定（非零）',indefinite:'不定',zero:'零型'};
  const directions=[];
  for(let x=-12;x<=12;x++)for(let y=-12;y<=12;y++)if(x||y)directions.push([x,y]);
  directions.sort((u,v)=>(u[0]**2+u[1]**2)-(v[0]**2+v[1]**2)||u[0]-v[0]||u[1]-v[1]);
  function valid(A,v){return Array.isArray(A)&&A.length===2&&A.every(row=>Array.isArray(row)&&row.length===2&&row.every(n=>Number.isInteger(n)&&Math.abs(n)<=5))&&Array.isArray(v)&&v.length===2&&v.every(n=>Number.isInteger(n)&&Math.abs(n)<=3);}
  function quadratic(A,[x,y]){const q=A[0][0]*x*x+(A[0][1]+A[1][0])*x*y+A[1][1]*y*y;return q===0?0:q;}
  function fraction(n,d=1){let a=Math.abs(n),b=d;while(b){const t=a%b;a=b;b=t;}const g=a||1;return d/g===1?String(n/g):`${n/g}/${d/g}`;}
  function witness(A,relation){const vector=directions.find(v=>relation(quadratic(A,v)));return vector?{vector,value:quadratic(A,vector)}:null;}
  function solve(matrix,vector){
    if(!valid(matrix,vector))throw new RangeError('A must be 2×2 integers −5..5 and vector integers −3..3');
    const A=matrix.map(row=>row.slice()),v=vector.slice();
    const [a,b,c,d]=[A[0][0],A[0][1],A[1][0],A[1][1]],cross=b+c;
    const symmetric=b===c,detA=a*d-b*c,fourDetS=4*a*d-cross*cross,trace=a+d;
    let formClass;
    if(fourDetS<0)formClass='indefinite';
    else if(fourDetS>0)formClass=a>0?'positive':'negative';
    else if(trace>0)formClass='semipositive';
    else if(trace<0)formClass='seminegative';
    else formClass='zero';
    const radicand=(a-d)**2+cross**2,root=Math.floor(Math.sqrt(radicand));
    const eigenvalues=root*root===radicand?[fraction(trace+root,2),fraction(trace-root,2)]:
      [`(${trace}+√${radicand})/2`,`(${trace}−√${radicand})/2`];
    const positiveWitness=witness(A,q=>q>0),negativeWitness=witness(A,q=>q<0);
    const zeroWitness=fourDetS===0?witness(A,q=>q===0):null;
    if((formClass==='positive'&&!positiveWitness)||(formClass==='negative'&&!negativeWitness)||
      (formClass==='indefinite'&&(!positiveWitness||!negativeWitness))||
      (formClass==='semipositive'&&(!positiveWitness||!zeroWitness))||
      (formClass==='seminegative'&&(!negativeWitness||!zeroWitness))||
      (formClass==='zero'&&!zeroWitness))throw new Error('witness invariant failed');
    return {matrix:A,vector:v,symmetric,formClass,formLabel:labels[formClass],symmetricPositiveDefinite:symmetric&&formClass==='positive',
      qValue:quadratic(A,v),coefficients:{a,cross,d},detA,fourDetS,detS:fraction(fourDetS,4),trace,radicand,eigenvalues,
      symmetricPart:[[String(a),fraction(cross,2)],[fraction(cross,2),String(d)]],
      positiveWitness,negativeWitness,zeroWitness,
      positiveForAllNonzero:formClass==='positive',
      criterion:symmetric?`a=${a}，det(A)=${detA}；对称 2×2 正定当且仅当 a>0 且 det(A)>0。`:
        `A≠Aᵀ，改看 S=(A+Aᵀ)/2；4det(S)=${fourDetS}。本页的“对称正定矩阵”要求 A 本身对称。`};
  }
  function checkPrediction(solution,prediction){
    const text=String(prediction.value).trim();
    return {symmetric:prediction.symmetric===(solution.symmetric?'yes':'no'),formClass:prediction.formClass===solution.formClass,
      value:/^[+-]?\d{1,5}$/.test(text)&&Number(text)===solution.qValue};
  }
  const api={solve,quadratic,checkPrediction,labels};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.PositiveDefiniteModel=api;
})(globalThis);
