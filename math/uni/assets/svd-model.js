/* Thin singular value decomposition for bounded integer 3×2 matrices. */
(function(root){
  'use strict';
  const dot=(a,b)=>a.reduce((sum,x,i)=>sum+x*b[i],0);
  const norm=a=>Math.hypot(...a);
  const scale=(a,s)=>a.map(x=>x*s);
  function valid(A,x){return Array.isArray(A)&&A.length===3&&A.every(row=>Array.isArray(row)&&row.length===2&&row.every(n=>Number.isInteger(n)&&Math.abs(n)<=3))&&Array.isArray(x)&&x.length===2&&x.every(n=>Number.isInteger(n)&&Math.abs(n)<=3);}
  function solve(matrix,vector){
    if(!valid(matrix,vector))throw new RangeError('3×2 integer A and 2-vector x, each entry −3..3, required');
    const A=matrix.map(row=>row.slice()),x=vector.slice();
    const g00=A.reduce((s,r)=>s+r[0]*r[0],0),g01=A.reduce((s,r)=>s+r[0]*r[1],0),g11=A.reduce((s,r)=>s+r[1]*r[1],0);
    const trace=g00+g11,det=g00*g11-g01*g01,delta=(g00-g11)**2+4*g01*g01;
    const rank=trace===0?0:det===0?1:2;
    const lambda0=(trace+Math.sqrt(delta))/2,lambda1=rank===2?det/lambda0:0;
    const lambdas=[lambda0,lambda1],sigmas=lambdas.map(Math.sqrt);
    let directions;
    if(delta===0)directions=[[1,0],[0,1]];
    else if(g01!==0){
      const w=[g01,lambda0-g00],length=norm(w);
      directions=[scale(w,1/length),[-w[1]/length,w[0]/length]];
    }else directions=g00>g11?[[1,0],[0,1]]:[[0,1],[1,0]];
    const terms=directions.slice(0,rank).map((v,i)=>{
      const Av=A.map(row=>dot(row,v)),u=scale(Av,1/sigmas[i]);
      return {sigma:sigmas[i],lambda:lambdas[i],v,u,Av};
    });
    const image=A.map(row=>dot(row,x));
    const reconstructed=A.map((row,i)=>row.map((_,j)=>terms.reduce((s,t)=>s+t.sigma*t.u[i]*t.v[j],0)));
    const maxError=Math.max(0,...A.flatMap((row,i)=>row.map((value,j)=>Math.abs(value-reconstructed[i][j]))));
    if(maxError>1e-10||terms.some(t=>Math.abs(norm(t.u)-1)>1e-10)||rank===2&&Math.abs(dot(terms[0].u,terms[1].u))>1e-10)throw new Error('SVD numerical invariant failed');
    return {matrix:A,vector:x,gram:[[g00,g01],[g01,g11]],trace,det,delta,rank,lambdas,sigmas,directions,terms,image,reconstructed,maxError};
  }
  function checkPrediction(solution,p){
    const integer=value=>/^[+-]?\d{1,3}$/.test(String(value).trim())?Number(value):null;
    return {trace:integer(p.trace)===solution.trace,rank:integer(p.rank)===solution.rank,
      zero:p.zero===(solution.rank<2?'yes':'no'),image:Array.isArray(p.image)&&p.image.length===3&&p.image.every((n,i)=>integer(n)===solution.image[i])};
  }
  const api={solve,checkPrediction};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.SVDModel=api;
})(globalThis);
