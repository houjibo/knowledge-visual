const assert=require('node:assert/strict');
const {solve,checkPrediction}=require('../math/uni/assets/svd-model.js');
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-10,`${a} != ${b}`);
let cases=0;
for(let a=-3;a<=3;a++)for(let b=-3;b<=3;b++)for(let c=-3;c<=3;c++)for(let d=-3;d<=3;d++){
  const A=[[a,b],[c,d],[1,-1]],x=[2,-1],s=solve(A,x);
  const minors=[a*d-b*c,-a-b,-c-d];
  const expectedRank=minors.some(n=>n!==0)?2:A.flat().some(n=>n!==0)?1:0;
  assert.equal(s.rank,expectedRank);assert.equal(s.trace,A.flat().reduce((sum,n)=>sum+n*n,0));
  assert.equal(s.det,minors.reduce((sum,n)=>sum+n*n,0));
  for(let i=0;i<3;i++){assert.equal(s.image[i],dot(A[i],x));for(let j=0;j<2;j++)close(s.reconstructed[i][j],A[i][j]);}
  s.terms.forEach((t,i)=>{close(dot(t.v,t.v),1);close(dot(t.u,t.u),1);close(t.sigma*t.sigma,t.lambda);for(let k=0;k<3;k++)close(t.sigma*t.u[k],t.Av[k]);if(i)close(dot(t.u,s.terms[0].u),0);});
  for(let i=0;i<s.directions.length;i++)for(let j=0;j<s.directions.length;j++)close(dot(s.directions[i],s.directions[j]),i===j?1:0);
  cases++;
}
for(const [A,rank] of [[[[0,0],[0,0],[0,0]],0],[[[1,2],[1,2],[0,0]],1],[[[1,0],[0,1],[0,0]],2]]){
  const s=solve(A,[1,1]);assert.equal(s.rank,rank);
  for(const v of s.directions.slice(rank))for(const row of A)close(dot(row,v),0);
}
let exhaustive=0;
for(let a=-3;a<=3;a++)for(let b=-3;b<=3;b++)for(let c=-3;c<=3;c++)for(let d=-3;d<=3;d++)for(let e=-3;e<=3;e++)for(let f=-3;f<=3;f++){
  const A=[[a,b],[c,d],[e,f]],s=solve(A,[0,0]);
  const minors=[a*d-b*c,a*f-b*e,c*f-d*e],rank=minors.some(n=>n!==0)?2:A.flat().some(n=>n!==0)?1:0;
  assert.equal(s.rank,rank);for(let i=0;i<3;i++)for(let j=0;j<2;j++)close(s.reconstructed[i][j],A[i][j]);exhaustive++;
}
const s=solve([[2,0],[0,1],[0,0]],[1,1]);
assert.deepEqual(checkPrediction(s,{trace:'5',rank:'2',zero:'no',image:['2','1','0']}),{trace:true,rank:true,zero:true,image:true});
assert.equal(checkPrediction(s,{trace:'',rank:'',zero:'',image:['','','']}).trace,false);
for(const A of [[],[[0,0],[0,0],[0,0.1]],[[4,0],[0,0],[0,0]]])assert.throws(()=>solve(A,[0,0]),RangeError);
assert.throws(()=>solve([[0,0],[0,0],[0,0]],[0,4]),RangeError);
console.log(`SVD model: ${exhaustive} bounded matrices, ${cases+3} deeper cases and boundary checks passed`);
