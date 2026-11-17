/* Exact 3×3 partial-pivoting PLU model for bounded integer examples. */
(function(root){
  'use strict';
  function gcd(a,b){a=Math.abs(a);b=Math.abs(b);while(b)[a,b]=[b,a%b];return a||1;}
  function rat(n,d=1){if(!Number.isSafeInteger(n)||!Number.isSafeInteger(d)||d===0)throw new RangeError('invalid rational');if(d<0){n=-n;d=-d;}const g=gcd(n,d);return {n:n/g,d:d/g};}
  const add=(a,b)=>rat(a.n*b.d+b.n*a.d,a.d*b.d);
  const neg=a=>rat(-a.n,a.d);
  const sub=(a,b)=>add(a,neg(b));
  const mul=(a,b)=>rat(a.n*b.n,a.d*b.d);
  const div=(a,b)=>rat(a.n*b.d,a.d*b.n);
  const eq=(a,b)=>a.n===b.n&&a.d===b.d;
  const fmt=a=>a.d===1?String(a.n):`${a.n}/${a.d}`;
  const R=n=>rat(n);
  const clone=M=>M.map(row=>row.map(a=>rat(a.n,a.d)));
  const isZero=a=>a.n===0;
  function matMul(A,B){return A.map(row=>B[0].map((_,j)=>row.reduce((sum,a,k)=>add(sum,mul(a,B[k][j])),R(0))));}
  function matVec(A,v){return A.map(row=>row.reduce((sum,a,k)=>add(sum,mul(a,v[k])),R(0)));}
  function determinant(A){const [[a,b,c],[d,e,f],[g,h,i]]=A;return a*(e*i-f*h)-b*(d*i-f*g)+c*(d*h-e*g);}
  function rank(A){if(determinant(A)!==0)return 3;for(let r=0;r<3;r++)for(let s=r+1;s<3;s++)for(let c=0;c<3;c++)for(let d=c+1;d<3;d++)if(A[r][c]*A[s][d]-A[r][d]*A[s][c]!==0)return 2;return A.flat().some(n=>n!==0)?1:0;}
  function solve(Ainput,binput){
    if(!Array.isArray(Ainput)||Ainput.length!==3||Ainput.some(row=>!Array.isArray(row)||row.length!==3||row.some(n=>!Number.isInteger(n)||Math.abs(n)>3))||!Array.isArray(binput)||binput.length!==3||binput.some(n=>!Number.isInteger(n)||Math.abs(n)>4))throw new RangeError('3×3 integer A −3..3 and b −4..4 required');
    const A=Ainput.map(row=>row.slice()),b=binput.slice(),U=A.map(row=>row.map(R)),L=[[R(1),R(0),R(0)],[R(0),R(1),R(0)],[R(0),R(0),R(1)]],order=[0,1,2],steps=[];
    let swaps=0;
    for(let k=0;k<3;k++){
      let pivot=k;
      for(let i=k+1;i<3;i++)if(Math.abs(U[i][k].n)*U[pivot][k].d>Math.abs(U[pivot][k].n)*U[i][k].d)pivot=i;
      const before=clone(U),pivotOriginal=isZero(U[pivot][k])?null:order[pivot];
      if(pivotOriginal===null){steps.push({column:k,before,after:clone(U),pivotOriginal:null,swap:null,multipliers:[]});continue;}
      const swap=pivot===k?null:[k,pivot];
      if(swap){[U[k],U[pivot]]=[U[pivot],U[k]];[order[k],order[pivot]]=[order[pivot],order[k]];for(let j=0;j<k;j++)[L[k][j],L[pivot][j]]=[L[pivot][j],L[k][j]];swaps++;}
      const multipliers=[];
      for(let i=k+1;i<3;i++){
        const m=div(U[i][k],U[k][k]);L[i][k]=m;multipliers.push({row:i,value:m});
        for(let j=k;j<3;j++)U[i][j]=sub(U[i][j],mul(m,U[k][j]));
      }
      steps.push({column:k,before,after:clone(U),pivotOriginal,swap,multipliers});
    }
    const P=order.map(i=>[0,1,2].map(j=>R(Number(i===j)))),PA=matMul(P,A.map(row=>row.map(R))),LU=matMul(L,U);
    if(PA.some((row,i)=>row.some((v,j)=>!eq(v,LU[i][j]))))throw new Error('PA=LU failed');
    const det=determinant(A),pivotProduct=U.reduce((v,row,i)=>mul(v,row[i]),R(swaps%2?-1:1));
    if(!eq(pivotProduct,R(det)))throw new Error('determinant sign failed');
    const matrixRank=rank(A),unique=matrixRank===3;
    const result={A,b,P,L,U,PA,LU,order,swaps,det,rank:matrixRank,unique,steps,firstPivot:steps[0].pivotOriginal,firstMultipliers:steps[0].multipliers.map(item=>item.value)};
    if(unique){
      const Pb=order.map(i=>R(b[i])),y=[],x=Array(3);
      for(let i=0;i<3;i++){let v=Pb[i];for(let j=0;j<i;j++)v=sub(v,mul(L[i][j],y[j]));y.push(v);}
      for(let i=2;i>=0;i--){let v=y[i];for(let j=i+1;j<3;j++)v=sub(v,mul(U[i][j],x[j]));x[i]=div(v,U[i][i]);}
      const Ax=matVec(A.map(row=>row.map(R)),x),Ly=matVec(L,y),Ux=matVec(U,x);
      if(Ax.some((v,i)=>!eq(v,R(b[i]))||!eq(Ly[i],Pb[i])||!eq(Ux[i],y[i])))throw new Error('triangular solve failed');
      Object.assign(result,{Pb,y,x,Ax,Ly,Ux});
    }
    return result;
  }
  function parse(raw){const m=/^([+-]?\d{1,4})(?:\/(\d{1,4}))?$/.exec(String(raw).trim());if(!m)return null;const d=m[2]===undefined?1:Number(m[2]);return d===0?null:rat(Number(m[1]),d);}
  function prediction(s,p){
    const pivot=s.firstPivot===null?'none':String(s.firstPivot+1),det=parse(p.det),checks={pivot:p.pivot===pivot,det:det!==null&&eq(det,R(s.det)),unique:p.unique===(s.unique?'yes':'no')};
    if(s.firstPivot!==null){checks.m21=eqOrFalse(parse(p.m21),s.firstMultipliers[0]);checks.m31=eqOrFalse(parse(p.m31),s.firstMultipliers[1]);}
    if(s.unique)checks.x1=eqOrFalse(parse(p.x1),s.x[0]);
    return checks;
  }
  function eqOrFalse(a,b){return a!==null&&eq(a,b);}
  const api={solve,prediction,parse,rat,format:fmt,rank,determinant};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.PLUModel=api;
})(globalThis);
