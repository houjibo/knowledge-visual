const assert=require('node:assert/strict');
const M=require('../math/uni/assets/plu-model');
const value=r=>r.n/r.d;
const same=(a,b)=>a.n===b.n&&a.d===b.d;
function det(A){return A[0][0]*(A[1][1]*A[2][2]-A[1][2]*A[2][1])-A[0][1]*(A[1][0]*A[2][2]-A[1][2]*A[2][0])+A[0][2]*(A[1][0]*A[2][1]-A[1][1]*A[2][0]);}
function rank(A){if(det(A))return 3;for(let i=0;i<3;i++)for(let j=i+1;j<3;j++)for(let k=0;k<3;k++)for(let l=k+1;l<3;l++)if(A[i][k]*A[j][l]!==A[i][l]*A[j][k])return 2;return A.flat().some(Boolean)?1:0;}
function augmentedRank(A,b){const C=A.map((row,i)=>[...row,b[i]]);for(let i=0;i<4;i++)for(let j=i+1;j<4;j++)for(let k=j+1;k<4;k++)if(det(C.map(row=>[row[i],row[j],row[k]])))return 3;for(let i=0;i<3;i++)for(let j=i+1;j<3;j++)for(let k=0;k<4;k++)for(let l=k+1;l<4;l++)if(C[i][k]*C[j][l]!==C[i][l]*C[j][k])return 2;return C.flat().some(Boolean)?1:0;}
function verify(A,b){
  const s=M.solve(A,b),coefficientRank=rank(A),augRank=augmentedRank(A,b);assert.equal(s.det,det(A));assert.equal(s.rank,coefficientRank);assert.equal(s.rankAugmented,augRank);assert.equal(s.classification,augRank>coefficientRank?'none':coefficientRank===3?'unique':'infinite');assert.equal(s.unique,det(A)!==0);assert.deepEqual([...s.order].sort(),[0,1,2]);
  for(let i=0;i<3;i++)for(let j=0;j<3;j++){
    assert.equal(value(s.PA[i][j]),A[s.order[i]][j]);assert.ok(same(s.PA[i][j],s.LU[i][j]));
    if(i<j)assert.equal(s.L[i][j].n,0);if(i>j)assert.equal(s.U[i][j].n,0);if(i===j)assert.equal(value(s.L[i][j]),1);
  }
  const abs=A.map((row,i)=>({i,n:Math.abs(row[0])})).sort((a,b)=>b.n-a.n||a.i-b.i);
  assert.equal(s.firstPivot,abs[0].n===0?null:abs[0].i);
  for(let i=0;i<3;i++)assert.ok(same(s.Ly[i],s.Pb[i]));
  if(s.classification==='none'){
    assert.equal(s.particular,undefined);assert.deepEqual(s.rref[s.contradictionRow].map(M.format),['0','0','0','1']);
  }else{
    assert.equal(s.freeColumns.length,3-coefficientRank);assert.equal(s.nullBasis.length,3-coefficientRank);
    for(let i=0;i<3;i++){
      assert.equal(value(s.AxParticular[i]),b[i]);
      for(const n of s.nullBasis){const image=A[i].reduce((sum,a,j)=>sum+a*value(n[j]),0);assert.ok(Math.abs(image)<1e-9);}
    }
    for(let i=0;i<s.freeColumns.length;i++)for(let j=0;j<s.freeColumns.length;j++)assert.equal(value(s.nullBasis[i][s.freeColumns[j]]),Number(i===j));
  }
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
  {A:[[1,1,1],[2,2,2],[0,1,1]],b:[1,2,3]},
  {A:[[1,1,1],[2,2,2],[0,1,1]],b:[1,3,3]},
  {A:[[0,1,0],[0,0,1],[0,0,0]],b:[1,2,0]},
  {A:[[1,1,0],[2,2,0],[0,0,0]],b:[1,2,0]},
  {A:[[0,0,0],[0,0,0],[0,0,0]],b:[1,0,0]}
];
for(const {A,b} of cases)verify(A,b);
const two=M.solve(cases[3].A,cases[3].b);
assert.equal(two.swaps,2);assert.ok(two.steps[1].swap);assert.ok(same(two.L[1][0],two.steps[0].multipliers[1].value));assert.ok(same(two.L[2][0],two.steps[0].multipliers[0].value));
const zero=M.solve(cases[4].A,cases[4].b);assert.equal(zero.firstPivot,null);assert.deepEqual(zero.firstMultipliers,[]);assert.equal(zero.rank,2);
assert.equal(M.prediction(zero,{pivot:'none',det:'0',augRank:'3',classification:'none'}).pivot,true);
const sample=M.solve(cases[0].A,cases[0].b);
assert.deepEqual(M.prediction(sample,{pivot:'2',det:'-12',augRank:'3',classification:'unique',m21:'2/3',m31:'-2/3',x1:'-1/6'}),{pivot:true,det:true,augRank:true,classification:true,m21:true,m31:true,x1:true});
assert.equal(M.prediction(sample,{pivot:'2',det:'-12',augRank:'3',classification:'unique',m21:'4/6',m31:'-2/3',x1:'-1/6'}).m21,true);
assert.equal(M.prediction(sample,{pivot:'2',det:'-12',augRank:'3',classification:'unique',m21:'2/0',m31:'-2/3',x1:'-1/6'}).m21,false);
assert.equal(M.prediction(M.solve(cases[7].A,cases[7].b),{pivot:'2',det:'0',augRank:'3',classification:'infinite',m21:'1/2',m31:'0'}).classification,false);
assert.equal(M.parse('abc'),null);assert.throws(()=>M.solve([[4,0,0],[0,1,0],[0,0,1]],[1,2,3]),RangeError);
let state=142857;const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return (state>>>16)%7-3;};
for(let i=0;i<6000;i++)verify(Array.from({length:3},()=>Array.from({length:3},random)),Array.from({length:3},()=>random()));
for(let i=0;i<1200;i++){
  const a=Array.from({length:3},random),c=Array.from({length:3},random),A=[a,a.slice(),c],b=[random(),random(),random()];verify(A,b);verify(A,[b[0],b[0],b[2]]);
}
console.log('PLU model: 8412 exact matrix cases, augmented-rank classifications, complete solutions and Cramer checks passed');
