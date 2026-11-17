/* Exact projection and least-squares model for small integer matrices. */
(function (root) {
  'use strict';
  function gcd(a,b) { a=a<0n?-a:a; b=b<0n?-b:b; while(b) [a,b]=[b,a%b]; return a||1n; }
  function frac(n,d=1n) {
    n=BigInt(n); d=BigInt(d);
    if (!d) throw new RangeError('zero denominator');
    if (d<0n) { n=-n; d=-d; }
    const k=gcd(n,d); return {n:n/k,d:d/k};
  }
  const zero=()=>frac(0n), add=(a,b)=>frac(a.n*b.d+b.n*a.d,a.d*b.d);
  const neg=a=>frac(-a.n,a.d), sub=(a,b)=>add(a,neg(b));
  const mul=(a,b)=>frac(a.n*b.n,a.d*b.d), div=(a,b)=>frac(a.n*b.d,a.d*b.n);
  const eq=(a,b)=>a.n===b.n&&a.d===b.d;
  const format=a=>a.d===1n?String(a.n):`${a.n}/${a.d}`;
  const formatVector=vector=>vector.map(format);

  function parseExact(value) {
    const text=String(value).trim();
    const match=text.match(/^([+-]?\d+)(?:\/([1-9]\d*))?$/);
    if (!match) return null;
    const n=BigInt(match[1]),d=BigInt(match[2]||'1');
    return frac(n,d);
  }
  function parseFraction(value) {
    const text=String(value).trim();
    if (text.length>20) return null;
    const match=text.match(/^([+-]?\d+)(?:\/([1-9]\d*))?$/);
    if (!match) return null;
    const n=BigInt(match[1]),d=BigInt(match[2]||'1');
    return n < -1000000n || n > 1000000n || d > 1000000n ? null : frac(n,d);
  }

  function validInputs(A,b) {
    return Array.isArray(A)&&A.length===3&&A.every(row=>Array.isArray(row)&&row.length===2&&row.every(v=>Number.isInteger(v)&&Math.abs(v)<=5))&&
      Array.isArray(b)&&b.length===3&&b.every(v=>Number.isInteger(v)&&Math.abs(v)<=5);
  }
  function dot(a,b) { return a.reduce((sum,v,i)=>add(sum,mul(v,b[i])),zero()); }
  function norm2(a) { return dot(a,a); }
  function matrixVector(A,x) { return A.map(row=>dot(row,x)); }
  function transpose(A) { return A[0].map((_,i)=>A.map(row=>row[i])); }
  function rankByMinors(A) {
    const c0=A.map(row=>row[0]),c1=A.map(row=>row[1]);
    for (let i=0;i<3;i++) for (let j=i+1;j<3;j++)
      if (c0[i]*c1[j]-c0[j]*c1[i]!==0) return 2;
    return c0.some(v=>v!==0)||c1.some(v=>v!==0)?1:0;
  }
  function normalRref(G,c) {
    const work=G.map((row,i)=>[...row,c[i]]);
    const pivots=[]; let pivotRow=0;
    for (let col=0;col<2&&pivotRow<2;col++) {
      const found=work.findIndex((row,i)=>i>=pivotRow&&row[col].n!==0n);
      if (found<0) continue;
      [work[pivotRow],work[found]]=[work[found],work[pivotRow]];
      const pivot=work[pivotRow][col];
      work[pivotRow]=work[pivotRow].map(v=>div(v,pivot));
      for (let row=0;row<2;row++) {
        if (row===pivotRow||work[row][col].n===0n) continue;
        const factor=work[row][col];
        work[row]=work[row].map((v,j)=>sub(v,mul(factor,work[pivotRow][j])));
      }
      pivots.push(col); pivotRow++;
    }
    if (work.some(row=>row[0].n===0n&&row[1].n===0n&&row[2].n!==0n)) throw new Error('normal equations inconsistent');
    const particular=[zero(),zero()];
    pivots.forEach((col,row)=>{particular[col]=work[row][2];});
    const free=[0,1].filter(col=>!pivots.includes(col));
    const directions=free.map(col=>{
      const vector=[zero(),zero()]; vector[col]=frac(1n);
      pivots.forEach((pivot,row)=>{vector[pivot]=neg(work[row][col]);});
      return vector;
    });
    return {work,pivots,particular,directions};
  }

  function solve(matrix,target) {
    if (!validInputs(matrix,target)) throw new RangeError('A must be 3×2 and b length 3 with integer entries −5 to 5');
    const A=matrix.map(row=>row.slice()),b=target.slice();
    const rationalA=A.map(row=>row.map(v=>frac(v))),rationalB=b.map(v=>frac(v));
    const AT=transpose(rationalA);
    const G=AT.map(row=>AT.map((_,col)=>dot(row,rationalA.map(a=>a[col]))));
    const c=AT.map(row=>dot(row,rationalB));
    const reduced=normalRref(G,c),rank=rankByMinors(A);
    if (rank!==reduced.pivots.length) throw new Error('rank mismatch');
    const p=matrixVector(rationalA,reduced.particular),e=rationalB.map((v,i)=>sub(v,p[i]));
    const ate=AT.map(row=>dot(row,e));
    const reconstruction=p.every((v,i)=>eq(add(v,e[i]),rationalB[i]));
    if (!ate.every(v=>v.n===0n)||dot(p,e).n!==0n||!reconstruction) throw new Error('projection invariant failed');
    return {
      matrix:A,target:b,rank,unique:rank===2,
      gram:G.map(formatVector),normalRight:formatVector(c),normalRref:reduced.work.map(formatVector),
      particular:formatVector(reduced.particular),directions:reduced.directions.map(formatVector),
      projection:formatVector(p),residual:formatVector(e),minErrorSquared:format(norm2(e)),
      bInColumn:e.every(v=>v.n===0n),bOrthogonalToColumn:p.every(v=>v.n===0n),
      verification:{atResidual:formatVector(ate),projectionResidualDot:format(dot(p,e)),reconstruction}
    };
  }

  function sameVector(actual,expected) {
    if (!Array.isArray(actual)||actual.length!==expected.length) return false;
    const values=actual.map(parseFraction);
    return values.every((v,i)=>v!==null&&eq(v,parseExact(expected[i])));
  }
  function checkPrediction(result,prediction) {
    return {
      member:prediction.member===(result.bInColumn?'yes':'no'),
      unique:prediction.unique===(result.unique?'yes':'no'),
      projection:sameVector(prediction.projection,result.projection),
      residual:sameVector(prediction.residual,result.residual)
    };
  }
  function verifyCandidate(result,parts) {
    if (!Array.isArray(parts)||parts.length!==2) return null;
    const x=parts.map(parseFraction);
    if (x.some(v=>v===null)) return null;
    const A=result.matrix.map(row=>row.map(v=>frac(v))),b=result.target.map(v=>frac(v));
    const q=matrixVector(A,x),error=b.map((v,i)=>sub(v,q[i]));
    const p=result.projection.map(parseExact),minimum=parseExact(result.minErrorSquared);
    const errorSquared=norm2(error),gap=sub(errorSquared,minimum);
    const distanceSquared=norm2(p.map((v,i)=>sub(v,q[i])));
    if (!eq(gap,distanceSquared)||gap.n<0n) throw new Error('least-squares identity failed');
    return {coefficients:formatVector(x),image:formatVector(q),errorSquared:format(errorSquared),gap:format(gap),
      optimum:gap.n===0n,distanceFromProjectionSquared:format(distanceSquared)};
  }
  const api={solve,checkPrediction,verifyCandidate,parseFraction,format};
  if (typeof module!=='undefined'&&module.exports) module.exports=api;
  root.LeastSquaresModel=api;
})(globalThis);
