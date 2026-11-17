const assert=require('node:assert/strict');
const model=require('../math/uni/assets/positive-definite-model.js');

function eigenClass(A){
  const a=A[0][0],d=A[1][1],cross=A[0][1]+A[1][0];
  const gap=Math.sqrt((a-d)**2+cross**2),low=(a+d-gap)/2,high=(a+d+gap)/2,eps=1e-8;
  if(low>eps)return 'positive';
  if(high< -eps)return 'negative';
  if(low< -eps&&high>eps)return 'indefinite';
  if(high>eps)return 'semipositive';
  if(low< -eps)return 'seminegative';
  return 'zero';
}
function qIndependent(A,[x,y]){const value=x*(A[0][0]*x+A[0][1]*y)+y*(A[1][0]*x+A[1][1]*y);return value===0?0:value;}
function check(A){
  const v=[2,-1],s=model.solve(A,v);
  assert.equal(s.formClass,eigenClass(A));
  assert.equal(s.symmetric,A[0][1]===A[1][0]);
  assert.equal(s.symmetricPositiveDefinite,s.symmetric&&s.formClass==='positive');
  assert.equal(s.qValue,qIndependent(A,v));
  assert.equal(s.fourDetS,4*A[0][0]*A[1][1]-(A[0][1]+A[1][0])**2);
  assert.equal(s.detA,A[0][0]*A[1][1]-A[0][1]*A[1][0]);
  for(const W of [s.positiveWitness,s.negativeWitness,s.zeroWitness])if(W){
    assert.ok(W.vector.some(n=>n!==0));assert.ok(W.vector.every(n=>Math.abs(n)<=12));
    assert.equal(W.value,qIndependent(A,W.vector));
  }
  if(s.formClass==='positive')assert.equal(s.negativeWitness,null);
  if(s.formClass==='negative')assert.equal(s.positiveWitness,null);
  if(s.formClass==='semipositive'||s.formClass==='seminegative'||s.formClass==='zero')assert.equal(s.zeroWitness.value,0);
  if(s.formClass==='indefinite'){assert.ok(s.positiveWitness.value>0);assert.ok(s.negativeWitness.value<0);}
  for(let x=-3;x<=3;x++)for(let y=-3;y<=3;y++)assert.equal(model.quadratic(A,[x,y]),qIndependent(A,[x,y]));
  const answer={symmetric:s.symmetric?'yes':'no',formClass:s.formClass,value:String(s.qValue)};
  assert.ok(Object.values(model.checkPrediction(s,answer)).every(Boolean));
}
let count=0;
for(let a=-5;a<=5;a++)for(let b=-5;b<=5;b++)for(let c=-5;c<=5;c++)for(let d=-5;d<=5;d++){
  check([[a,b],[c,d]]);count++;
}
const cases=[
  [[[2,0],[0,1]],'positive'],[[[1,1],[1,1]],'semipositive'],[[[-1,0],[0,-2]],'negative'],
  [[[-1,0],[0,0]],'seminegative'],[[[1,2],[2,1]],'indefinite'],[[[0,0],[0,0]],'zero'],
  [[[2,1],[0,2]],'positive'],[[[1,2],[0,1]],'semipositive']
];
for(const [A,expected] of cases){check(A);assert.equal(model.solve(A,[0,0]).formClass,expected);count++;}
assert.equal(model.solve([[1,2],[0,1]],[0,0]).symmetricPart[0][1],'1');
assert.equal(model.solve([[2,1],[0,2]],[0,0]).detS,'15/4');
assert.equal(model.checkPrediction(model.solve([[2,0],[0,1]],[1,1]),{symmetric:'yes',formClass:'positive',value:'3.0'}).value,false);
assert.throws(()=>model.solve([[6,0],[0,1]],[0,0]),RangeError);
assert.throws(()=>model.solve([[1,0],[0,1]],[4,0]),RangeError);
console.log(`positive definite forms: ${count} matrices, independent eigenvalue signs, quadratic values and witnesses passed`);
