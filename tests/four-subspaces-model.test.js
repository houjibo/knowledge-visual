const assert = require('node:assert/strict');
const model = require('../math/uni/assets/four-subspaces-model.js');

function combinations(n, k, start=0, chosen=[], result=[]) {
  if (chosen.length === k) { result.push(chosen.slice()); return result; }
  for (let i=start;i<n;i++) combinations(n,k,i+1,[...chosen,i],result);
  return result;
}

function determinant(A) {
  if (A.length === 1) return A[0][0];
  return A[0].reduce((sum,value,col) => sum + (col%2 ? -1 : 1)*value*determinant(A.slice(1).map(row => row.filter((_,i) => i !== col))), 0);
}

function rankByMinors(A) {
  const m=A.length,n=A[0].length;
  for (let size=Math.min(m,n);size>0;size--) {
    for (const rows of combinations(m,size)) for (const cols of combinations(n,size)) {
      if (determinant(rows.map(row => cols.map(col => A[row][col]))) !== 0) return size;
    }
  }
  return 0;
}

function check(A) {
  const s=model.solve(A);
  const r=rankByMinors(A), m=A.length, n=A[0].length;
  assert.equal(s.rank,r);
  assert.deepEqual(s.dimensions,{column:r,row:r,null:n-r,left:m-r});
  assert.equal(s.bases.column.length,r);
  assert.equal(s.bases.row.length,r);
  assert.equal(s.bases.null.length,n-r);
  assert.equal(s.bases.left.length,m-r);
  assert.ok(s.verification.rowOrthogonal && s.verification.colOrthogonal);
  for (const vector of s.bases.null) assert.equal(model.verifyCandidate(A,'null',vector).member,true);
  for (const vector of s.bases.left) assert.equal(model.verifyCandidate(A,'left',vector).member,true);
  const expected=model.checkConstruction(s,{rank:r,nullDimension:n-r,leftDimension:m-r},{column:s.pivotColumns,row:s.pivotRows,null:s.freeColumns,left:s.freeRows});
  assert.ok(Object.values(expected).every(Boolean));
}

for (let code=0;code<81;code++) {
  let value=code;
  const A=Array.from({length:2},() => Array.from({length:2},() => {const digit=value%3;value=Math.floor(value/3);return digit-1;}));
  check(A);
}

let seed=0x5a17;
function next() { seed=(Math.imul(seed,1664525)+1013904223)>>>0; return seed%11-5; }
for (const [m,n] of [[2,3],[3,2],[3,3]]) for (let i=0;i<180;i++) {
  check(Array.from({length:m},() => Array.from({length:n},next)));
}

for (const A of [
  [[0,0],[0,0],[0,0]], [[1,2,2],[2,4,4]], [[1,0],[0,1],[1,1]],
  [[1,0,0],[0,1,0],[0,0,1]], [[1,2,3],[0,1,1]]
]) check(A);

const wide=model.solve([[1,2,0],[0,0,1]]);
assert.equal(model.checkConstruction(wide,{rank:2,nullDimension:1,leftDimension:0},{column:[1,2],row:[0,1],null:[1],left:[]}).column,true);
assert.equal(model.checkConstruction(wide,{rank:'',nullDimension:1,leftDimension:0},{column:[0,2],row:[0,1],null:[1],left:[]}).rank,false);
const tall=model.solve([[1,0],[2,0],[0,1]]);
assert.equal(model.checkConstruction(tall,{rank:2,nullDimension:0,leftDimension:1},{column:[0,1],row:[1,2],null:[],left:[1]}).row,true);
assert.deepEqual(model.verifyCandidate([[1,2,2],[2,4,4]],'null',['-2','1','0']),{vector:['-2','1','0'],image:['0','0'],member:true,nonzero:true});
assert.deepEqual(model.verifyCandidate([[1,2,2],[2,4,4]],'null',['0','0','0']),{vector:['0','0','0'],image:['0','0'],member:true,nonzero:false});
assert.equal(model.verifyCandidate([[1,2,2],[2,4,4]],'null',['1','0','0']).member,false);
assert.equal(model.verifyCandidate([[1,2,2],[2,4,4]],'left',['-2','1']).member,true);
assert.equal(model.verifyCandidate([[1,2,2],[2,4,4]],'left',['1/0','0']),null);
assert.throws(() => model.solve([[6,0],[0,1]]),RangeError);
console.log('four subspaces: 626 exact matrix cases, independent minors, bases, orthogonality and candidate checks passed');
