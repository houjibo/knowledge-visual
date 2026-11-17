const assert=require('node:assert/strict');
const model=require('../math/uni/assets/symmetric-spectral-model.js');
const vectors=[[0,0],[1,0],[0,1],[1,2],[-2,3]];
function check(A,v){
  const s=model.solve(A,v),[[a,b],[,d]]=A,trace=a+d,disc=(a-d)**2+4*b*b;
  const eigen=[(trace+Math.sqrt(disc))/2,(trace-Math.sqrt(disc))/2];
  assert.equal(s.trace,trace);assert.equal(s.det,a*d-b*b);assert.equal(s.discriminant,disc);
  assert.equal(s.pattern,disc===0?'repeated':'distinct');
  assert.equal(s.zeroVector,v[0]===0&&v[1]===0);
  const Av=[a*v[0]+b*v[1],b*v[0]+d*v[1]];
  assert.deepEqual(s.image,Av);
  assert.equal(s.isEigenvector,!s.zeroVector&&v[0]*Av[1]-v[1]*Av[0]===0);
  assert.ok(Object.values(s.verification).every(Boolean));
  const q=s.eigenvectors.map(item=>item.numeric);
  for(let i=0;i<2;i++)for(let j=0;j<2;j++){
    const dot=q[i][0]*q[j][0]+q[i][1]*q[j][1];
    assert.ok(Math.abs(dot-(i===j?1:0))<1e-10);
  }
  for(let row=0;row<2;row++)for(let col=0;col<2;col++){
    const reconstructed=q[0][row]*eigen[0]*q[0][col]+q[1][row]*eigen[1]*q[1][col];
    assert.ok(Math.abs(reconstructed-A[row][col])<1e-10);
  }
  const parts=s.components.map(item=>item.numeric);
  for(let row=0;row<2;row++){
    assert.ok(Math.abs(parts[0][row]+parts[1][row]-v[row])<1e-10);
    assert.ok(Math.abs(eigen[0]*parts[0][row]+eigen[1]*parts[1][row]-Av[row])<1e-10);
    for(let k=0;k<2;k++){
      const projected=q[k][row]*(q[k][0]*v[0]+q[k][1]*v[1]);
      assert.ok(Math.abs(parts[k][row]-projected)<1e-10);
    }
  }
  const answer={trace:String(trace),pattern:s.pattern,isEigenvector:s.isEigenvector?'yes':'no',image:Av.map(String)};
  assert.ok(Object.values(model.checkPrediction(s,answer)).every(Boolean));
}
let count=0;
for(let a=-5;a<=5;a++)for(let b=-5;b<=5;b++)for(let d=-5;d<=5;d++)for(const v of vectors){check([[a,b],[b,d]],v);count++;}
const irrational=model.solve([[2,1],[1,1]],[1,2]);
assert.equal(irrational.discriminant,5);assert.equal(irrational.eigenvalues[0],'3/2+1/2√5');
const rational=model.solve([[2,1],[1,2]],[1,1]);
assert.deepEqual(rational.eigenvalues,['3','1']);assert.equal(rational.isEigenvector,true);
const scalar=model.solve([[2,0],[0,2]],[1,1]);
assert.equal(scalar.pattern,'repeated');assert.equal(scalar.isEigenvector,true);
assert.equal(model.solve([[0,0],[0,0]],[0,0]).isEigenvector,false);
assert.equal(model.checkPrediction(irrational,{trace:'3.0',pattern:'distinct',isEigenvector:'no',image:['4','3']}).trace,false);
assert.throws(()=>model.solve([[1,2],[0,1]],[1,1]),RangeError);
assert.throws(()=>model.solve([[6,0],[0,1]],[1,1]),RangeError);
assert.throws(()=>model.solve([[1,0],[0,1]],[4,0]),RangeError);
console.log(`symmetric spectral: ${count} matrix-vector cases, exact model and independent numeric decomposition passed`);
