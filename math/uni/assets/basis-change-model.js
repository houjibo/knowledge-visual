/* Exact 2×2 coordinate change and similarity over rational numbers. */
(function(root){
  'use strict';
  function gcd(a,b){a=Math.abs(a);b=Math.abs(b);while(b)[a,b]=[b,a%b];return a||1;}
  function rat(n,d=1){if(d===0)throw new RangeError('zero denominator');if(d<0){n=-n;d=-d;}const g=gcd(n,d);return {n:n/g,d:d/g};}
  const add=(a,b)=>rat(a.n*b.d+b.n*a.d,a.d*b.d),mul=(a,b)=>rat(a.n*b.n,a.d*b.d);
  const eq=(a,b)=>a.n===b.n&&a.d===b.d;
  const format=a=>a.d===1?String(a.n):`${a.n}/${a.d}`;
  const value=a=>a.n/a.d;
  const validMatrix=M=>Array.isArray(M)&&M.length===2&&M.every(row=>Array.isArray(row)&&row.length===2&&row.every(n=>Number.isInteger(n)&&Math.abs(n)<=3));
  const mv=(M,v)=>M.map(row=>row[0]*v[0]+row[1]*v[1]);
  const mm=(L,R)=>L.map(row=>[0,1].map(j=>row[0]*R[0][j]+row[1]*R[1][j]));
  const rmv=(M,v)=>M.map(row=>add(mul(row[0],v[0]),mul(row[1],v[1])));
  function solve(basisMatrix,transformation,vector){
    if(!validMatrix(basisMatrix)||!validMatrix(transformation)||!Array.isArray(vector)||vector.length!==2||vector.some(n=>!Number.isInteger(n)||Math.abs(n)>4))
      throw new RangeError('integer 2×2 matrices W,A −3..3 and vector x −4..4 required');
    const W=basisMatrix.map(row=>row.slice()),A=transformation.map(row=>row.slice()),x=vector.slice();
    const [[a,b],[c,d]]=W,det=a*d-b*c,image=mv(A,x),AW=mm(A,W);
    if(det===0){
      const rank=W.flat().every(n=>n===0)?0:1;
      const w=a!==0||c!==0?[a,c]:[b,d];
      const inSpan=rank===0?x[0]===0&&x[1]===0:w[0]*x[1]-w[1]*x[0]===0;
      return {W,A,x,det,basis:false,rank,inSpan,image,AW};
    }
    const adj=[[d,-b],[-c,a]],coordinates=mv(adj,x).map(n=>rat(n,det));
    const B=mm(adj,AW).map(row=>row.map(n=>rat(n,det)));
    const vectorBack=rmv(W.map(row=>row.map(n=>rat(n))),coordinates);
    const transformedCoordinates=rmv(B,coordinates);
    const imageBack=rmv(W.map(row=>row.map(n=>rat(n))),transformedCoordinates);
    for(let i=0;i<2;i++){
      if(!eq(vectorBack[i],rat(x[i]))||!eq(imageBack[i],rat(image[i])))throw new Error('vector change of basis failed');
      for(let j=0;j<2;j++){
        const product=add(mul(rat(W[i][0]),B[0][j]),mul(rat(W[i][1]),B[1][j]));
        if(!eq(product,rat(AW[i][j])))throw new Error('AW=WB failed');
      }
    }
    const traceB=add(B[0][0],B[1][1]),detB=add(mul(B[0][0],B[1][1]),mul(rat(-1),mul(B[0][1],B[1][0])));
    if(!eq(traceB,rat(A[0][0]+A[1][1]))||!eq(detB,rat(A[0][0]*A[1][1]-A[0][1]*A[1][0])))throw new Error('similarity invariants failed');
    return {W,A,x,det,basis:true,rank:2,image,AW,adj,coordinates,B,vectorBack,transformedCoordinates,imageBack,traceB,detB};
  }
  function parseRational(raw){
    const match=/^([+-]?\d{1,4})(?:\/(\d{1,4}))?$/.exec(String(raw).trim());if(!match)return null;
    const d=match[2]===undefined?1:Number(match[2]);return d===0?null:rat(Number(match[1]),d);
  }
  function checkPrediction(s,p){
    const det=parseRational(p.det),result={det:det!==null&&eq(det,rat(s.det)),basis:p.basis===(s.basis?'yes':'no')};
    if(s.basis){result.coordinates=Array.isArray(p.coordinates)&&p.coordinates.length===2&&p.coordinates.every((n,i)=>{const parsed=parseRational(n);return parsed!==null&&eq(parsed,s.coordinates[i]);});
      const entry=parseRational(p.matrixEntry);result.matrixEntry=entry!==null&&eq(entry,s.B[0][0]);}
    return result;
  }
  const api={solve,checkPrediction,format,value,rat,parseRational};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.BasisChangeModel=api;
})(globalThis);
