/* Exact Gram–Schmidt model for bounded 3×2 integer matrices. */
(function (root) {
  'use strict';
  function gcd(a,b) { a=a<0n?-a:a; b=b<0n?-b:b; while(b) [a,b]=[b,a%b]; return a||1n; }
  function frac(n,d=1n) {
    n=BigInt(n);d=BigInt(d);if(d===0n)throw new RangeError('zero denominator');
    if(d<0n){n=-n;d=-d;}const k=gcd(n,d);return {n:n/k,d:d/k};
  }
  const zero=()=>frac(0n),one=()=>frac(1n);
  const add=(a,b)=>frac(a.n*b.d+b.n*a.d,a.d*b.d);
  const neg=a=>frac(-a.n,a.d),sub=(a,b)=>add(a,neg(b));
  const mul=(a,b)=>frac(a.n*b.n,a.d*b.d),div=(a,b)=>frac(a.n*b.d,a.d*b.n);
  const equal=(a,b)=>a.n===b.n&&a.d===b.d;
  const format=a=>a.d===1n?String(a.n):`${a.n}/${a.d}`;
  const formatVector=vector=>vector.map(format);
  function parseFraction(value) {
    const text=String(value).trim();if(text.length>20)return null;
    const match=text.match(/^([+-]?\d+)(?:\/([1-9]\d*))?$/);if(!match)return null;
    const n=BigInt(match[1]),d=BigInt(match[2]||'1');
    return n < -1000000n || n > 1000000n || d > 1000000n ? null : frac(n,d);
  }
  function dot(a,b) { return a.reduce((sum,v,i)=>add(sum,mul(v,b[i])),zero()); }
  function scale(vector,c) { return vector.map(v=>mul(v,c)); }
  function valid(A) { return Array.isArray(A)&&A.length===3&&A.every(row=>Array.isArray(row)&&row.length===2&&row.every(v=>Number.isInteger(v)&&Math.abs(v)<=5)); }
  function rankByMinors(A) {
    for(let i=0;i<3;i++)for(let j=i+1;j<3;j++)if(A[i][0]*A[j][1]-A[j][0]*A[i][1]!==0)return 2;
    return A.some(row=>row.some(v=>v!==0))?1:0;
  }
  function radicalQuotient(n,s) {
    if(n.n===0n)return '0';
    if(equal(s,one()))return format(n);
    if(equal(n,s))return `√(${format(s)})`;
    if(equal(n,neg(s)))return `−√(${format(s)})`;
    return `(${format(n)})/√(${format(s)})`;
  }
  function solve(matrix) {
    if(!valid(matrix))throw new RangeError('A must be 3×2 with integer entries −5 to 5');
    const A=matrix.map(row=>row.slice());
    const a1=A.map(row=>frac(row[0])),a2=A.map(row=>frac(row[1]));
    const s1=dot(a1,a1),coefficient=s1.n===0n?zero():div(dot(a1,a2),s1);
    const projection=scale(a1,coefficient),residual=a2.map((v,i)=>sub(v,projection[i]));
    const orthogonality=dot(a1,residual);
    if(orthogonality.n!==0n)throw new Error('orthogonalization invariant failed');
    const raw=[{source:0,vector:a1},{source:1,vector:residual}];
    const directions=raw.filter(item=>item.vector.some(v=>v.n!==0n)).map(item=>({...item,normSquared:dot(item.vector,item.vector)}));
    const rank=rankByMinors(A);
    if(directions.length!==rank||directions.some(item=>item.normSquared.n<=0n))throw new Error('rank invariant failed');
    for(let i=0;i<directions.length;i++)for(let j=0;j<directions.length;j++) {
      const actual=dot(directions[i].vector,directions[j].vector);
      if(i===j?!equal(actual,directions[i].normSquared):actual.n!==0n)throw new Error('Q orthogonality failed');
    }
    const rNumerators=directions.map(item=>[dot(item.vector,a1),dot(item.vector,a2)]);
    const R=rNumerators.map((row,i)=>row.map(value=>radicalQuotient(value,directions[i].normSquared)));
    const reconstructed=[0,1].map(col=>[0,1,2].map(component=>directions.reduce((sum,item,i)=>
      add(sum,mul(item.vector[component],div(rNumerators[i][col],item.normSquared))),zero())));
    const matches=reconstructed[0].every((v,i)=>equal(v,a1[i]))&&reconstructed[1].every((v,i)=>equal(v,a2[i]));
    if(!matches)throw new Error('QR reconstruction failed');
    return {
      matrix:A,rank,coefficient:format(coefficient),projection:formatVector(projection),residual:formatVector(residual),
      firstColumnZero:s1.n===0n,newDirection:residual.some(v=>v.n!==0n),
      directions:directions.map(item=>({source:item.source,numerator:formatVector(item.vector),normSquared:format(item.normSquared)})),
      R,dimensions:{Q:`3×${rank}`,R:`${rank}×2`},
      verification:{firstDotResidual:format(orthogonality),qTransposeQ:true,rEqualsQtA:true,reconstruction:[formatVector(reconstructed[0]),formatVector(reconstructed[1])],reconstructionMatches:matches}
    };
  }
  function sameVector(actual,expected) {
    return Array.isArray(actual)&&actual.length===expected.length&&actual.every((v,i)=>{
      const parsed=parseFraction(v),target=parseFraction(expected[i]);return parsed!==null&&target!==null&&equal(parsed,target);
    });
  }
  function checkPrediction(solution,prediction) {
    const coefficient=parseFraction(prediction.coefficient),expected=parseFraction(solution.coefficient);
    return {
      coefficient:coefficient!==null&&equal(coefficient,expected),
      residual:sameVector(prediction.residual,solution.residual),
      rank:prediction.rank!==''&&Number(prediction.rank)===solution.rank,
      newDirection:prediction.newDirection===(solution.newDirection?'yes':'no')
    };
  }
  const api={solve,checkPrediction,parseFraction,format};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.GramSchmidtModel=api;
})(globalThis);
