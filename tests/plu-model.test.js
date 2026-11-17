const assert=require('node:assert/strict');
const M=require('../math/uni/assets/plu-model');
const value=r=>r.n/r.d;
const same=(a,b)=>a.n===b.n&&a.d===b.d;
function det(A){return A[0][0]*(A[1][1]*A[2][2]-A[1][2]*A[2][1])-A[0][1]*(A[1][0]*A[2][2]-A[1][2]*A[2][0])+A[0][2]*(A[1][0]*A[2][1]-A[1][1]*A[2][0]);}
function rank(A){if(det(A))return 3;for(let i=0;i<3;i++)for(let j=i+1;j<3;j++)for(let k=0;k<3;k++)for(let l=k+1;l<3;l++)if(A[i][k]*A[j][l]!==A[i][l]*A[j][k])return 2;return A.flat().some(Boolean)?1:0;}
function verify(A,b){
  const s=M.solve(A,b);assert.equal(s.det,det(A));assert.equal(s.rank,rank(A));assert.equal(s.unique,det(A)!==0);assert.deepEqual([...s.order].sort(),[0,1,2]);
  for(let i=0;i<3;i++)for(let j=0;j<3;j++){
    assert.equal(value(s.PA[i][j]),A[s.order[i]][j]);assert.ok(same(s.PA[i][j],s.LU[i][j]));
    if(i<j)assert.equal(s.L[i][j].n,0);if(i>j)assert.equal(s.U[i][j].n,0);if(i===j)assert.equal(value(s.L[i][j]),1);
  }
  const abs=A.map((row,i)=>({i,n:Math.abs(row[0])})).sort((a,b)=>b.n-a.n||a.i-b.i);
  assert.equal(s.firstPivot,abs[0].n===0?null:abs[0].i);
  if(s.unique){for(let i=0;i<3;i++){
    const replaced=A.map((row,r)=>row.map((n,c)=>c===i?b[r]:n));
    assert.ok(same(s.x[i],M.rat(det(replaced),det(A))));
    assert.equal(value(s.Ax[i]),b[i]);
  }}else assert.equal(s.x,undefined);
}
const cases=[
  {A:[[2,1,1],[3,-2,0],[-2,2,2]],b:[1,-2,3]},
  {A:[[0,2,1],[3,1,0],[1,1,1]],b:[1,2,3]},
  {A:[[1,1,1],[1,1,2],[1,2,3]],b:[1,2,3]},
  {A:[[-1,0,3],[3,-1,2],[-1,-1,2]],b:[1,2,3]},
  {A:[[0,1,0],[0,0,1],[0,0,0]],b:[1,2,3]},
  {A:[[0,0,0],[0,0,0],[0,0,0]],b:[0,0,0]},
  {A:[[1,1,1],[2,2,2],[0,1,1]],b:[1,2,3]}
];
for(const {A,b} of cases)verify(A,b);
const two=M.solve(cases[3].A,cases[3].b);
assert.equal(two.swaps,2);assert.ok(two.steps[1].swap);assert.ok(same(two.L[1][0],two.steps[0].multipliers[1].value));assert.ok(same(two.L[2][0],two.steps[0].multipliers[0].value));
const zero=M.solve(cases[4].A,cases[4].b);assert.equal(zero.firstPivot,null);assert.deepEqual(zero.firstMultipliers,[]);assert.equal(zero.rank,2);
assert.equal(M.prediction(zero,{pivot:'none',det:'0',unique:'no'}).pivot,true);
const sample=M.solve(cases[0].A,cases[0].b);
assert.deepEqual(M.prediction(sample,{pivot:'2',det:'-12',unique:'yes',m21:'2/3',m31:'-2/3',x1:'-1/6'}),{pivot:true,det:true,unique:true,m21:true,m31:true,x1:true});
assert.equal(M.prediction(sample,{pivot:'2',det:'-12',unique:'yes',m21:'4/6',m31:'-2/3',x1:'-1/6'}).m21,true);
assert.equal(M.prediction(sample,{pivot:'2',det:'-12',unique:'yes',m21:'2/0',m31:'-2/3',x1:'-1/6'}).m21,false);
assert.equal(M.parse('abc'),null);assert.throws(()=>M.solve([[4,0,0],[0,1,0],[0,0,1]],[1,2,3]),RangeError);
let state=142857;const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return (state>>>16)%7-3;};
for(let i=0;i<6000;i++)verify(Array.from({length:3},()=>Array.from({length:3},random)),Array.from({length:3},()=>random()));
console.log('PLU model: 6007 exact matrix cases, Cramer solutions and boundaries passed');
