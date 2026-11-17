/* Exact 2×2 real-symmetric spectral model over Q(√Δ). */
(function(root){
  'use strict';
  function gcd(a,b){a=Math.abs(a);b=Math.abs(b);while(b)[a,b]=[b,a%b];return a||1;}
  function rat(n,d=1){if(d===0)throw new RangeError('zero denominator');if(d<0){n=-n;d=-d;}const g=gcd(n,d);return {n:n/g,d:d/g};}
  const radd=(a,b)=>rat(a.n*b.d+b.n*a.d,a.d*b.d),rmul=(a,b)=>rat(a.n*b.n,a.d*b.d);
  const rneg=a=>rat(-a.n,a.d),rformat=a=>a.d===1?String(a.n):`${a.n}/${a.d}`;
  const alg=(p,q=rat(0))=>({p,q});
  const aadd=(u,v)=>alg(radd(u.p,v.p),radd(u.q,v.q));
  const amul=(u,v,D)=>alg(radd(rmul(u.p,v.p),rmul(rmul(u.q,v.q),rat(D))),radd(rmul(u.p,v.q),rmul(u.q,v.p)));
  const ascale=(u,k)=>alg(rmul(u.p,rat(k)),rmul(u.q,rat(k)));
  function aeq(u,v,D){const root=Math.floor(Math.sqrt(D));
    if(root*root===D){const x=radd(u.p,rmul(u.q,rat(root))),y=radd(v.p,rmul(v.q,rat(root)));return x.n===y.n&&x.d===y.d;}
    return u.p.n===v.p.n&&u.p.d===v.p.d&&u.q.n===v.q.n&&u.q.d===v.q.d;
  }
  const aval=(u,D)=>u.p.n/u.p.d+(u.q.n/u.q.d)*Math.sqrt(D);
  function aformat(u,D){
    const root=Math.floor(Math.sqrt(D));
    if(root*root===D)return rformat(radd(u.p,rmul(u.q,rat(root))));
    if(u.q.n===0)return rformat(u.p);
    const abs=rat(Math.abs(u.q.n),u.q.d),suffix=`${abs.n===abs.d?'':rformat(abs)}√${D}`;
    if(u.p.n===0)return `${u.q.n<0?'−':''}${suffix}`;
    return `${rformat(u.p)}${u.q.n<0?'−':'+'}${suffix}`;
  }
  function dot(u,v,D){return aadd(amul(u[0],v[0],D),amul(u[1],v[1],D));}
  function valid(A,v){return Array.isArray(A)&&A.length===2&&A.every(row=>Array.isArray(row)&&row.length===2&&row.every(n=>Number.isInteger(n)&&Math.abs(n)<=5))&&A[0][1]===A[1][0]&&Array.isArray(v)&&v.length===2&&v.every(n=>Number.isInteger(n)&&Math.abs(n)<=3);}
  function solve(matrix,vector){
    if(!valid(matrix,vector))throw new RangeError('symmetric 2×2 integer A −5..5 and integer v −3..3 required');
    const A=matrix.map(row=>row.slice()),v=vector.slice(),[[a,b],[,d]]=A,T=a+d,D=(a-d)**2+4*b*b;
    const image=[a*v[0]+b*v[1],b*v[0]+d*v[1]],zeroVector=v[0]===0&&v[1]===0;
    const isEigenvector=!zeroVector&&v[0]*image[1]-v[1]*image[0]===0;
    const B=[[a-d,2*b],[2*b,d-a]],B2=[
      [B[0][0]**2+B[0][1]*B[1][0],B[0][0]*B[0][1]+B[0][1]*B[1][1]],
      [B[1][0]*B[0][0]+B[1][1]*B[1][0],B[1][0]*B[0][1]+B[1][1]**2]
    ];
    if(B2[0][0]!==D||B2[1][1]!==D||B2[0][1]!==0||B2[1][0]!==0)throw new Error('B²=ΔI failed');
    if(D===0){
      if(b!==0||a!==d)throw new Error('repeated eigenvalue must be scalar');
      const components=[[v[0],0],[0,v[1]]];
      return {matrix:A,vector:v,image,trace:T,det:a*d-b*b,discriminant:D,pattern:'repeated',zeroVector,isEigenvector,
        eigenvalues:[String(a),String(a)],B,eigenvectors:[
          {raw:['1','0'],normSquared:'1',numeric:[1,0]},
          {raw:['0','1'],normSquared:'1',numeric:[0,1]}
        ],components:components.map(row=>({exact:row.map(String),numeric:row.slice()})),
        verification:{bSquared:true,orthogonal:true,componentsSum:true,imageReconstruction:true,spectralReconstruction:true},
        explanation:'A 是标量矩阵；每个非零向量都是特征向量。这里选 Q=I，正交特征基并不唯一。'};
    }
    const lambda=[alg(rat(T,2),rat(1,2)),alg(rat(T,2),rat(-1,2))];
    const raw=b!==0?[
      [alg(rat(2*b)),alg(rat(d-a),rat(1))],
      [alg(rat(2*b)),alg(rat(d-a),rat(-1))]
    ]:(a>d?[[alg(rat(1)),alg(rat(0))],[alg(rat(0)),alg(rat(1))]]:
      [[alg(rat(0)),alg(rat(1))],[alg(rat(1)),alg(rat(0))]]);
    for(let k=0;k<2;k++)for(let i=0;i<2;i++){
      const lhs=aadd(ascale(raw[k][0],A[i][0]),ascale(raw[k][1],A[i][1]));
      if(!aeq(lhs,amul(lambda[k],raw[k][i],D),D))throw new Error('eigenvector equation failed');
    }
    if(!aeq(dot(raw[0],raw[1],D),alg(rat(0)),D))throw new Error('orthogonality failed');
    const norms=raw.map(w=>dot(w,w,D));
    if(norms.some(n=>aval(n,D)<=0))throw new Error('nonpositive eigenvector norm');
    const directions=raw.map((w,k)=>{
      const length=Math.sqrt(aval(norms[k],D));return {
        raw:w.map(z=>aformat(z,D)),normSquared:aformat(norms[k],D),numeric:w.map(z=>aval(z,D)/length)
      };
    });
    const Bv=[B[0][0]*v[0]+B[0][1]*v[1],B[1][0]*v[0]+B[1][1]*v[1]];
    const parts=[1,-1].map(sign=>v.map((value,i)=>alg(rat(value,2),rat(sign*Bv[i],2*D))));
    const projectors=[1,-1].map(sign=>Array.from({length:2},(_,i)=>Array.from({length:2},(_,j)=>
      alg(rat(i===j?1:0,2),rat(sign*B[i][j],2*D)))));
    for(let i=0;i<2;i++)for(let j=0;j<2;j++){
      const identity=alg(rat(i===j?1:0)),entry=alg(rat(A[i][j]));
      if(!aeq(aadd(projectors[0][i][j],projectors[1][i][j]),identity,D)||
        !aeq(aadd(amul(lambda[0],projectors[0][i][j],D),amul(lambda[1],projectors[1][i][j],D)),entry,D))
        throw new Error('spectral matrix reconstruction failed');
      for(let k=0;k<2;k++){
        if(!aeq(amul(projectors[k][i][j],norms[k],D),amul(raw[k][i],raw[k][j],D),D))
          throw new Error('projector not equal to q qᵀ');
        const projected=aadd(amul(projectors[k][i][0],alg(rat(v[0])),D),amul(projectors[k][i][1],alg(rat(v[1])),D));
        if(!aeq(projected,parts[k][i],D))throw new Error('projector vector mismatch');
      }
    }
    for(let k=0;k<2;k++)for(let i=0;i<2;i++)for(let j=0;j<2;j++){
      const product=aadd(amul(projectors[k][i][0],projectors[1-k][0][j],D),amul(projectors[k][i][1],projectors[1-k][1][j],D));
      if(!aeq(product,alg(rat(0)),D))throw new Error('projectors not perpendicular');
    }
    for(let i=0;i<2;i++){
      const sum=aadd(parts[0][i],parts[1][i]);
      const transformed=aadd(amul(lambda[0],parts[0][i],D),amul(lambda[1],parts[1][i],D));
      if(!aeq(sum,alg(rat(v[i])),D)||!aeq(transformed,alg(rat(image[i])),D))throw new Error('spectral vector reconstruction failed');
    }
    if(!aeq(dot(parts[0],parts[1],D),alg(rat(0)),D))throw new Error('projected components not orthogonal');
    return {matrix:A,vector:v,image,trace:T,det:a*d-b*b,discriminant:D,pattern:'distinct',zeroVector,isEigenvector,B,
      eigenvalues:lambda.map(z=>aformat(z,D)),eigenvectors:directions,
      components:parts.map(row=>({exact:row.map(z=>aformat(z,D)),numeric:row.map(z=>aval(z,D))})),
      verification:{bSquared:true,orthogonal:true,componentsSum:true,imageReconstruction:true,spectralReconstruction:true},
      explanation:'两个不同的实特征值对应垂直方向；P±=(I±B/√Δ)/2，B²=ΔI，因此 P₊+P₋=I，P₊P₋=0，A=λ₊P₊+λ₋P₋=QΛQᵀ。'};
  }
  function checkPrediction(solution,prediction){
    const integer=x=>/^[+-]?\d{1,3}$/.test(String(x).trim())?Number(x):null;
    return {trace:integer(prediction.trace)===solution.trace,pattern:prediction.pattern===solution.pattern,
      isEigenvector:prediction.isEigenvector===(solution.isEigenvector?'yes':'no'),
      image:Array.isArray(prediction.image)&&prediction.image.length===2&&prediction.image.every((x,i)=>integer(x)===solution.image[i])};
  }
  const api={solve,checkPrediction};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.SymmetricSpectralModel=api;
})(globalThis);
