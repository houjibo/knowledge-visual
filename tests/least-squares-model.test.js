const assert=require('node:assert/strict');
const model=require('../math/uni/assets/least-squares-model.js');

function gcd(a,b) { a=a<0n?-a:a; b=b<0n?-b:b; while(b) [a,b]=[b,a%b]; return a||1n; }
function rat(n,d=1n) { n=BigInt(n);d=BigInt(d);if(d<0n){n=-n;d=-d;}const k=gcd(n,d);return [n/k,d/k]; }
function add(a,b) { return rat(a[0]*b[1]+b[0]*a[1],a[1]*b[1]); }
function sub(a,b) { return add(a,[-b[0],b[1]]); }
function mul(a,b) { return rat(a[0]*b[0],a[1]*b[1]); }
function divide(a,b) { return rat(a[0]*b[1],a[1]*b[0]); }
function text(a) { return a[1]===1n?String(a[0]):`${a[0]}/${a[1]}`; }
function dot(a,b) { return a.reduce((s,v,i)=>add(s,mul(v,b[i])),rat(0)); }
const column=(A,j)=>A.map(row=>rat(row[j]));
const asRat=v=>v.map(x=>rat(x));

function independentProjection(A,b) {
  const a=column(A,0),c=column(A,1),target=asRat(b);
  const aa=dot(a,a),ac=dot(a,c),cc=dot(c,c),ab=dot(a,target),cb=dot(c,target);
  const det=sub(mul(aa,cc),mul(ac,ac));
  if (det[0]!==0n) {
    const x=divide(sub(mul(ab,cc),mul(cb,ac)),det);
    const y=divide(sub(mul(cb,aa),mul(ab,ac)),det);
    return a.map((v,i)=>add(mul(v,x),mul(c[i],y)));
  }
  const v=aa[0]!==0n?a:c,bb=aa[0]!==0n?aa:cc;
  if (bb[0]===0n) return [rat(0),rat(0),rat(0)];
  const scale=divide(dot(v,target),bb);
  return v.map(x=>mul(x,scale));
}

function check(A,b) {
  const s=model.solve(A,b);
  const p=independentProjection(A,b).map(text);
  assert.deepEqual(s.projection,p);
  const residual=asRat(b).map((v,i)=>sub(v,independentProjection(A,b)[i]));
  assert.deepEqual(s.residual,residual.map(text));
  assert.equal(s.minErrorSquared,text(dot(residual,residual)));
  assert.equal(s.unique,s.rank===2);
  assert.deepEqual(s.verification.atResidual,['0','0']);
  assert.equal(s.verification.projectionResidualDot,'0');
  assert.equal(s.verification.reconstruction,true);
  const guesses={member:s.bInColumn?'yes':'no',unique:s.unique?'yes':'no',projection:s.projection,residual:s.residual};
  assert.ok(Object.values(model.checkPrediction(s,guesses)).every(Boolean));
  assert.equal(model.verifyCandidate(s,s.particular).optimum,true);
  for (const x of [['0','0'],['1','0'],['-2','3'],['1/2','-3/4']]) {
    const result=model.verifyCandidate(s,x);
    assert.equal(result.gap,result.distanceFromProjectionSquared);
    assert.ok(modelParts(result.gap)[0]>=0n);
  }
  if (!s.unique) for (const direction of s.directions) {
    const alternative=s.particular.map((value,i)=>text(add(modelParts(value),modelParts(direction[i]))));
    assert.equal(model.verifyCandidate(s,alternative).optimum,true);
    assert.notDeepEqual(alternative,s.particular);
  }
}
function modelParts(value) { const parts=value.split('/'); return rat(BigInt(parts[0]),BigInt(parts[1]||1)); }

const cases=[
  [[[1,0],[1,1],[1,2]],[1,2,2]],
  [[[1,0],[1,1],[1,2]],[1,2,3]],
  [[[1,0],[0,1],[0,0]],[0,0,4]],
  [[[1,2],[2,4],[-2,-4]],[1,0,1]],
  [[[0,0],[0,0],[0,0]],[3,-2,1]],
  [[[0,1],[0,2],[0,3]],[1,2,3]]
];
for (const [A,b] of cases) check(A,b);
let seed=0x4102;
function next() { seed=(Math.imul(seed,1664525)+1013904223)>>>0; return seed%11-5; }
for (let i=0;i<600;i++) check(Array.from({length:3},()=>[next(),next()]),[next(),next(),next()]);
const dependent=model.solve([[1,2],[2,4],[-2,-4]],[1,0,1]);
assert.equal(dependent.rank,1);
assert.equal(dependent.unique,false);
assert.equal(dependent.directions.length,1);
const zero=model.solve([[0,0],[0,0],[0,0]],[3,-2,1]);
assert.deepEqual(zero.projection,['0','0','0']);
assert.equal(zero.directions.length,2);
assert.equal(model.verifyCandidate(zero,['1','99']).optimum,true);
assert.equal(model.verifyCandidate(zero,['1/0','0']),null);
assert.equal(model.parseFraction('2000000/2'),null);
assert.equal(model.parseFraction('1/2000000'),null);
assert.equal(model.checkPrediction(dependent,{member:'',unique:'',projection:['','',''],residual:['','','']}).member,false);
assert.throws(()=>model.solve([[6,0],[0,1],[1,1]],[0,0,0]),RangeError);
console.log('least squares: 606 independent projection cases, exact residual identities and degenerate solutions passed');
