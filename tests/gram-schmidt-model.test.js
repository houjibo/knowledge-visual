const assert=require('node:assert/strict');
const model=require('../math/uni/assets/gram-schmidt-model.js');

function gcd(a,b){a=a<0n?-a:a;b=b<0n?-b:b;while(b)[a,b]=[b,a%b];return a||1n;}
function rat(n,d=1n){n=BigInt(n);d=BigInt(d);if(d<0n){n=-n;d=-d;}const k=gcd(n,d);return [n/k,d/k];}
function add(a,b){return rat(a[0]*b[1]+b[0]*a[1],a[1]*b[1]);}
function sub(a,b){return add(a,[-b[0],b[1]]);}
function mul(a,b){return rat(a[0]*b[0],a[1]*b[1]);}
function divide(a,b){return rat(a[0]*b[1],a[1]*b[0]);}
function dot(a,b){return a.reduce((s,v,i)=>add(s,mul(v,b[i])),rat(0));}
function text(a){return a[1]===1n?String(a[0]):`${a[0]}/${a[1]}`;}
function parse(s){const [n,d='1']=s.split('/');return rat(n,d);}
function number(s){const [n,d]=parse(s);return Number(n)/Number(d);}

function independentRank(A){
  for(let i=0;i<3;i++)for(let j=i+1;j<3;j++)if(A[i][0]*A[j][1]!==A[j][0]*A[i][1])return 2;
  return A.flat().some(v=>v!==0)?1:0;
}
function check(A){
  const s=model.solve(A),a=A.map(row=>rat(row[0])),b=A.map(row=>rat(row[1]));
  const aa=dot(a,a),ab=dot(a,b),coefficient=aa[0]===0n?rat(0):divide(ab,aa);
  const p=a.map(v=>mul(v,coefficient)),u=b.map((v,i)=>sub(v,p[i]));
  assert.equal(s.coefficient,text(coefficient));
  assert.deepEqual(s.projection,p.map(text));
  assert.deepEqual(s.residual,u.map(text));
  assert.equal(s.rank,independentRank(A));
  assert.equal(s.directions.length,s.rank);
  assert.equal(s.newDirection,u.some(v=>v[0]!==0n));
  assert.equal(s.firstColumnZero,aa[0]===0n);
  assert.equal(s.verification.firstDotResidual,'0');
  assert.equal(s.verification.qTransposeQ,true);
  assert.equal(s.verification.rEqualsQtA,true);
  assert.equal(s.verification.reconstructionMatches,true);
  assert.deepEqual(s.verification.reconstruction,[A.map(row=>String(row[0])),A.map(row=>String(row[1]))]);
  assert.deepEqual(s.dimensions,{Q:`3×${s.rank}`,R:`${s.rank}×2`});
  const guess={coefficient:s.coefficient,residual:s.residual,rank:s.rank,newDirection:s.newDirection?'yes':'no'};
  assert.ok(Object.values(model.checkPrediction(s,guess)).every(Boolean));
  const q=s.directions.map(item=>item.numerator.map(number).map(v=>v/Math.sqrt(number(item.normSquared))));
  for(let i=0;i<q.length;i++)for(let j=0;j<q.length;j++){
    const product=q[i].reduce((sum,v,k)=>sum+v*q[j][k],0);
    assert.ok(Math.abs(product-(i===j?1:0))<1e-10);
  }
  for(let col=0;col<2;col++)for(let component=0;component<3;component++){
    const reconstructed=q.reduce((sum,vector)=>sum+vector[component]*vector.reduce((inner,v,i)=>inner+v*A[i][col],0),0);
    assert.ok(Math.abs(reconstructed-A[component][col])<1e-10);
  }
}

for(let code=0;code<729;code++){
  let value=code;const A=Array.from({length:3},()=>Array.from({length:2},()=>{const digit=value%3;value=Math.floor(value/3);return digit-1;}));
  check(A);
}
let seed=0x7340;
function next(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%11-5;}
for(let i=0;i<500;i++)check(Array.from({length:3},()=>[next(),next()]));
for(const A of [
  [[1,1],[1,0],[1,2]],[[2,1],[0,1],[0,0]],[[1,2],[2,4],[-2,-4]],
  [[0,1],[0,2],[0,3]],[[1,0],[2,0],[3,0]],[[0,0],[0,0],[0,0]]
])check(A);
const full=model.solve([[1,1],[1,0],[1,2]]);
assert.deepEqual(full.R,[['√(3)','√(3)'],['0','√(2)']]);
assert.equal(model.checkPrediction(full,{coefficient:'',residual:['','',''],rank:'',newDirection:''}).coefficient,false);
assert.equal(model.parseFraction('2000000/2'),null);
assert.equal(model.parseFraction('1/0'),null);
assert.throws(()=>model.solve([[6,1],[0,1],[0,0]]),RangeError);
console.log('Gram-Schmidt: 1235 independent matrix cases, exact projection, rank, orthonormality and QR reconstruction passed');
