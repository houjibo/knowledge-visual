const assert=require('node:assert/strict');
const {solve,checkPrediction,signs}=require('../math/uni/assets/haar-compression-model.js');
let cases=0;
for(let a=0;a<=4;a++)for(let b=0;b<=4;b++)for(let c=0;c<=4;c++)for(let d=0;d<=4;d++)for(let k=1;k<=4;k++){
  const x=[a,b,c,d],s=solve(x,k),coefficientEnergy=s.coefficients2.reduce((sum,n)=>sum+n*n,0);
  assert.equal(coefficientEnergy,4*x.reduce((sum,n)=>sum+n*n,0));
  assert.equal(s.selected.length,k);assert.equal(new Set(s.selected).size,k);
  assert.deepEqual(s.reconstructed4,Array.from({length:4},(_,i)=>s.selected.reduce((sum,j)=>sum+signs[j][i]*s.coefficients2[j],0)));
  const pixelError16=s.reconstructed4.reduce((sum,n,i)=>sum+(4*x[i]-n)**2,0);
  assert.equal(pixelError16,4*s.error4);
  assert.equal(s.lossless,pixelError16===0);
  if(k===4){assert.deepEqual(s.reconstructed4,x.map(n=>4*n));assert.equal(s.error4,0);}
  cases++;
}
const defaultCase=solve([100,80,40,20],2);
assert.deepEqual(defaultCase.coefficients2,[240,120,40,0]);
assert.deepEqual(defaultCase.selected,[0,1]);
assert.deepEqual(defaultCase.reconstructed4,[360,360,120,120]);
assert.equal(defaultCase.error4,1600);
assert.deepEqual(checkPrediction(defaultCase,{mean:'120',firstPixel:'90',squaredError:'400',lossless:'no'}),{mean:true,firstPixel:true,squaredError:true,lossless:true});
assert.equal(checkPrediction(defaultCase,{mean:'',firstPixel:'90',squaredError:'400',lossless:'no'}).mean,false);
assert.equal(checkPrediction(defaultCase,{mean:'120',firstPixel:'90.1',squaredError:'400',lossless:'no'}).firstPixel,false);
assert.equal(solve([128,128,128,128],1).lossless,true);
assert.equal(solve([0,0,0,0],1).lossless,true);
const clipped=solve([0,0,0,64],3);
assert.deepEqual(clipped.selected,[0,1,2]);
assert.deepEqual(clipped.reconstructed4,[-64,64,64,192]);
assert.equal(clipped.error4,4096);
const fractional=solve([0,0,0,1],3);
assert.deepEqual(checkPrediction(fractional,{mean:'0.5',firstPixel:'-0.25',squaredError:'0.25',lossless:'no'}),{mean:true,firstPixel:true,squaredError:true,lossless:true});
assert.throws(()=>solve([0,0,0,256],2),RangeError);
assert.throws(()=>solve([0,0,0,0],0),RangeError);
console.log(`Haar compression: ${cases} blocks/retention cases, exact energy and reconstruction passed`);
