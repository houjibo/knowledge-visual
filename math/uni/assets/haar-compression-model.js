/* Exact four-pixel orthonormal Haar change of basis and coefficient truncation. */
(function(root){
  'use strict';
  const signs=[[1,1,1,1],[1,1,-1,-1],[1,-1,1,-1],[1,-1,-1,1]];
  const dot=(a,b)=>a.reduce((sum,value,i)=>sum+value*b[i],0);
  function solve(pixels,keepCount){
    if(!Array.isArray(pixels)||pixels.length!==4||pixels.some(value=>!Number.isInteger(value)||value<0||value>255)||!Number.isInteger(keepCount)||keepCount<1||keepCount>4)
      throw new RangeError('four integer pixels 0..255 and keep count 1..4 required');
    const x=pixels.slice(),coefficients2=signs.map(column=>dot(column,x));
    const selected=Array.from({length:4},(_,i)=>i).sort((a,b)=>Math.abs(coefficients2[b])-Math.abs(coefficients2[a])||a-b).slice(0,keepCount);
    const kept2=coefficients2.map((value,i)=>selected.includes(i)?value:0);
    const reconstructed4=Array.from({length:4},(_,i)=>signs.reduce((sum,column,j)=>sum+column[i]*kept2[j],0));
    const full4=Array.from({length:4},(_,i)=>signs.reduce((sum,column,j)=>sum+column[i]*coefficients2[j],0));
    const error4=coefficients2.reduce((sum,value,i)=>sum+(selected.includes(i)?0:value*value),0);
    const pixelError16=reconstructed4.reduce((sum,value,i)=>sum+(4*x[i]-value)**2,0);
    const inputEnergy4=4*x.reduce((sum,value)=>sum+value*value,0);
    const coefficientEnergy4=coefficients2.reduce((sum,value)=>sum+value*value,0);
    if(full4.some((value,i)=>value!==4*x[i])||inputEnergy4!==coefficientEnergy4||pixelError16!==4*error4)
      throw new Error('Haar reconstruction or energy identity failed');
    return {pixels:x,keepCount,coefficients2,selected,kept2,reconstructed4,error4,lossless:error4===0,inputEnergy4,coefficientEnergy4};
  }
  function scaledQuarter(value){
    const raw=String(value).trim();if(!/^[+-]?\d{1,7}(?:\.\d{1,2})?$/.test(raw))return null;
    const scaled=Number(raw)*4;return Number.isSafeInteger(scaled)?scaled:null;
  }
  function checkPrediction(solution,prediction){return {
    mean:scaledQuarter(prediction.mean)===2*solution.coefficients2[0],
    firstPixel:scaledQuarter(prediction.firstPixel)===solution.reconstructed4[0],
    squaredError:scaledQuarter(prediction.squaredError)===solution.error4,
    lossless:prediction.lossless===(solution.lossless?'yes':'no')
  };}
  const api={solve,checkPrediction,signs};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.HaarCompressionModel=api;
})(globalThis);
