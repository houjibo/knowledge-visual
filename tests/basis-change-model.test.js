const assert=require('node:assert/strict');
const {solve,checkPrediction,format,parseRational}=require('../math/uni/assets/basis-change-model.js');
const eqFraction=(actual,n,d=1)=>assert.ok(actual.n*d===n*actual.d,`${actual.n}/${actual.d} != ${n}/${d}`);
let cases=0;
const transforms=[[[2,1],[0,3]],[[0,-1],[1,0]],[[1,0],[0,0]],[[0,0],[0,0]]];
for(let a=-3;a<=3;a++)for(let b=-3;b<=3;b++)for(let c=-3;c<=3;c++)for(let d=-3;d<=3;d++)for(const A of transforms){
  const W=[[a,b],[c,d]],x=[2,-1],s=solve(W,A,x),det=a*d-b*c;
  assert.equal(s.det,det);assert.equal(s.basis,det!==0);
  if(det){
    eqFraction(s.coordinates[0],d*x[0]-b*x[1],det);eqFraction(s.coordinates[1],a*x[1]-c*x[0],det);
    for(let i=0;i<2;i++)for(let j=0;j<2;j++){
      const aw=A[i][0]*W[0][j]+A[i][1]*W[1][j];
      eqFraction(s.B[0][j],d*(A[0][0]*W[0][j]+A[0][1]*W[1][j])-b*(A[1][0]*W[0][j]+A[1][1]*W[1][j]),det);
      const p=s.B[0][j],q=s.B[1][j];assert.ok(W[i][0]*p.n*q.d+W[i][1]*q.n*p.d===aw*p.d*q.d);
    }
    for(let i=0;i<2;i++){eqFraction(s.vectorBack[i],x[i]);eqFraction(s.imageBack[i],s.image[i]);}
  }else{assert.equal(s.B,undefined);assert.equal(s.coordinates,undefined);}
  cases++;
}
const normal=solve([[1,1],[0,1]],[[2,1],[0,3]],[3,2]);
assert.deepEqual(normal.coordinates.map(format),['1','2']);
assert.deepEqual(normal.B.map(row=>row.map(format)),[['2','0'],['0','3']]);
assert.deepEqual(normal.image,[8,6]);
assert.deepEqual(checkPrediction(normal,{det:'1',basis:'yes',coordinates:['1','2'],matrixEntry:'2'}),{det:true,basis:true,coordinates:true,matrixEntry:true});
const rational=solve([[2,1],[0,2]],[[1,1],[0,2]],[1,3]);
assert.deepEqual(rational.coordinates.map(format),['-1/4','3/2']);
assert.deepEqual(rational.B.map(row=>row.map(format)),[['1','1/2'],['0','2']]);
const singular=solve([[1,2],[1,2]],[[2,0],[0,1]],[1,1]);
assert.equal(singular.inSpan,true);assert.equal(singular.rank,1);
assert.deepEqual(checkPrediction(singular,{det:'0',basis:'no'}),{det:true,basis:true});
assert.equal(solve([[1,2],[1,2]],[[2,0],[0,1]],[1,0]).inSpan,false);
assert.equal(solve([[0,0],[0,0]],[[0,0],[0,0]],[0,0]).rank,0);
assert.deepEqual(parseRational('2/4'),{n:1,d:2});assert.equal(parseRational('1/0'),null);assert.equal(parseRational('0.5'),null);
assert.throws(()=>solve([[4,0],[0,1]],[[1,0],[0,1]],[0,0]),RangeError);
assert.throws(()=>solve([[1,0],[0,1]],[[1,0],[0,1]],[0,5]),RangeError);
console.log(`Basis change: ${cases} exact matrix cases and boundary checks passed`);
