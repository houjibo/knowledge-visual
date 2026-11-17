/* Exact four-subspace model for 2–3 dimensional integer matrices. */
(function (root) {
  'use strict';

  function gcd(a, b) {
    a = a < 0n ? -a : a;
    b = b < 0n ? -b : b;
    while (b !== 0n) [a, b] = [b, a % b];
    return a || 1n;
  }

  function fraction(n, d = 1n) {
    n = BigInt(n); d = BigInt(d);
    if (d === 0n) throw new RangeError('denominator must be nonzero');
    if (d < 0n) { n = -n; d = -d; }
    const divisor = gcd(n, d);
    return {n: n / divisor, d: d / divisor};
  }

  const zero = () => fraction(0n);
  const one = () => fraction(1n);
  const add = (a, b) => fraction(a.n*b.d + b.n*a.d, a.d*b.d);
  const neg = a => fraction(-a.n, a.d);
  const sub = (a, b) => add(a, neg(b));
  const mul = (a, b) => fraction(a.n*b.n, a.d*b.d);
  const div = (a, b) => fraction(a.n*b.d, a.d*b.n);
  const format = a => a.d === 1n ? String(a.n) : `${a.n}/${a.d}`;

  function parseFraction(text) {
    const raw = String(text).trim();
    if (raw.length > 9) return null;
    const match = raw.match(/^([+-]?\d+)(?:\/([1-9]\d*))?$/);
    if (!match) return null;
    const numerator = BigInt(match[1]);
    const denominator = BigInt(match[2] || '1');
    if (numerator < -100n || numerator > 100n || denominator > 100n) return null;
    return fraction(numerator, denominator);
  }

  function validateMatrix(matrix) {
    if (!Array.isArray(matrix) || matrix.length < 2 || matrix.length > 3) return null;
    const n = Array.isArray(matrix[0]) ? matrix[0].length : 0;
    if (n < 2 || n > 3) return null;
    if (matrix.some(row => !Array.isArray(row) || row.length !== n || row.some(value => !Number.isInteger(value) || Math.abs(value) > 5))) return null;
    return matrix.map(row => row.slice());
  }

  function transpose(matrix) {
    return matrix[0].map((_, col) => matrix.map(row => row[col]));
  }

  function rref(matrix) {
    const work = matrix.map(row => row.map(value => typeof value === 'number' ? fraction(value) : value));
    const rows = work.length, cols = work[0].length;
    const pivots = [];
    let pivotRow = 0;
    for (let col = 0; col < cols && pivotRow < rows; col++) {
      const found = work.findIndex((row, index) => index >= pivotRow && row[col].n !== 0n);
      if (found < 0) continue;
      [work[pivotRow], work[found]] = [work[found], work[pivotRow]];
      const pivot = work[pivotRow][col];
      work[pivotRow] = work[pivotRow].map(value => div(value, pivot));
      for (let row = 0; row < rows; row++) {
        if (row === pivotRow || work[row][col].n === 0n) continue;
        const factor = work[row][col];
        work[row] = work[row].map((value, index) => sub(value, mul(factor, work[pivotRow][index])));
      }
      pivots.push(col);
      pivotRow++;
    }
    return {matrix: work, pivots, rank: pivots.length};
  }

  function specialSolutions(reduced) {
    const n = reduced.matrix[0].length;
    const free = Array.from({length:n}, (_, i) => i).filter(i => !reduced.pivots.includes(i));
    return free.map(index => {
      const vector = Array.from({length:n}, zero);
      vector[index] = one();
      reduced.pivots.forEach((pivot, row) => { vector[pivot] = neg(reduced.matrix[row][index]); });
      return vector;
    });
  }

  function product(matrix, vector) {
    return matrix.map(row => row.reduce((sum, value, index) => add(sum, mul(fraction(value), vector[index])), zero()));
  }

  function dot(a, b) {
    return a.reduce((sum, value, index) => add(sum, mul(value, b[index])), zero());
  }

  const stringVector = vector => vector.map(format);
  const rationalVector = vector => vector.map(value => typeof value === 'number' ? fraction(value) : parseFraction(value));

  function solve(matrix) {
    const A = validateMatrix(matrix);
    if (!A) throw new RangeError('matrix must have 2–3 rows and columns with integer entries from −5 to 5');
    const m = A.length, n = A[0].length;
    const reduced = rref(A);
    const reducedT = rref(transpose(A));
    const freeColumns = Array.from({length:n}, (_, i) => i).filter(i => !reduced.pivots.includes(i));
    const freeRows = Array.from({length:m}, (_, i) => i).filter(i => !reducedT.pivots.includes(i));
    const colBasis = reduced.pivots.map(col => A.map(row => row[col]));
    const rowBasis = reducedT.pivots.map(row => A[row].slice());
    const nullBasis = specialSolutions(reduced);
    const leftBasis = specialSolutions(reducedT);
    const rowOrthogonal = rowBasis.every(row => nullBasis.every(vector => dot(rationalVector(row), vector).n === 0n));
    const colOrthogonal = colBasis.every(col => leftBasis.every(vector => dot(rationalVector(col), vector).n === 0n));
    const nullProducts = nullBasis.map(vector => product(A, vector).map(format));
    const leftProducts = leftBasis.map(vector => product(transpose(A), vector).map(format));
    const zeroProducts = [...nullProducts, ...leftProducts].every(vector => vector.every(value => value === '0'));
    if (reduced.rank !== reducedT.rank || !rowOrthogonal || !colOrthogonal || !zeroProducts) throw new Error('four-subspace invariant failed');
    return {
      matrix: A, m, n, rank: reduced.rank,
      pivotColumns: reduced.pivots, pivotRows: reducedT.pivots,
      freeColumns, freeRows,
      rref: reduced.matrix.map(stringVector),
      rrefTranspose: reducedT.matrix.map(stringVector),
      dimensions: {column:reduced.rank, row:reduced.rank, null:n-reduced.rank, left:m-reduced.rank},
      bases: {
        column:colBasis.map(vector => vector.map(String)),
        row:rowBasis.map(vector => vector.map(String)),
        null:nullBasis.map(stringVector),
        left:leftBasis.map(stringVector)
      },
      verification: {nullProducts,leftProducts,rowOrthogonal,colOrthogonal}
    };
  }

  function independentOriginals(matrix, indices, axis, targetRank) {
    if (!Array.isArray(indices) || new Set(indices).size !== indices.length || indices.length !== targetRank) return false;
    const count = axis === 'column' ? matrix[0].length : matrix.length;
    if (indices.some(index => !Number.isInteger(index) || index < 0 || index >= count)) return false;
    if (indices.length === 0) return true;
    const vectors = indices.map(index => axis === 'column' ? matrix.map(row => row[index]) : matrix[index]);
    return rref(vectors).rank === targetRank;
  }

  function sameIndices(actual, expected) {
    return Array.isArray(actual) && actual.length === expected.length &&
      new Set(actual).size === actual.length && actual.every(index => expected.includes(index));
  }

  function checkConstruction(result, prediction, selections) {
    return {
      rank: prediction.rank !== '' && Number(prediction.rank) === result.rank,
      nullDimension: prediction.nullDimension !== '' && Number(prediction.nullDimension) === result.dimensions.null,
      leftDimension: prediction.leftDimension !== '' && Number(prediction.leftDimension) === result.dimensions.left,
      column: independentOriginals(result.matrix, selections.column, 'column', result.rank),
      row: independentOriginals(result.matrix, selections.row, 'row', result.rank),
      null: sameIndices(selections.null, result.freeColumns),
      left: sameIndices(selections.left, result.freeRows)
    };
  }

  function verifyCandidate(matrix, side, parts) {
    const A = validateMatrix(matrix);
    if (!A || !['null','left'].includes(side) || !Array.isArray(parts)) return null;
    const length = side === 'null' ? A[0].length : A.length;
    if (parts.length !== length) return null;
    const vector = parts.map(parseFraction);
    if (vector.some(value => value === null)) return null;
    const image = product(side === 'null' ? A : transpose(A), vector);
    return {vector:stringVector(vector), image:stringVector(image), member:image.every(value => value.n === 0n), nonzero:vector.some(value => value.n !== 0n)};
  }

  const api = {solve, checkConstruction, verifyCandidate, parseFraction, format};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.FourSubspacesModel = api;
})(globalThis);
