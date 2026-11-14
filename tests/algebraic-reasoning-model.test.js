const assert = require('node:assert/strict');
const model = require('../math/middle/assets/algebraic-reasoning-model.js');

let checked = 0;
for (let number = 1000; number <= 9999; number++) {
  const digits = [...String(number)].map(Number);
  const item = model.fourDigit(...digits);
  const digitSum = digits.reduce((total, digit) => total + digit, 0);
  assert.equal(item.number, number);
  assert.equal(item.sum, digitSum);
  assert.equal(item.group + item.sum, number);
  assert.equal(item.group % 3, 0);
  assert.equal(item.divisible, number % 3 === 0);
  assert.equal(item.divisible, digitSum % 3 === 0);
  assert.equal(item.rows.reduce((total, row) => total + row.whole, 0), number);
  assert.equal(item.rows.reduce((total, row) => total + row.grouped, 0), item.group);
  assert.equal(item.rows.reduce((total, row) => total + row.remainder, 0), digitSum);
  checked++;
}
for (let a = 1; a <= 9; a++) {
  const item = model.endingFive(a);
  assert.equal(item.side, a * 10 + 5);
  assert.equal(item.square, (10 * a + 5) ** 2);
  assert.equal(item.big + 2 * item.strip + item.small, item.square);
  assert.equal(item.hundreds * 100 + 25, item.square);
  checked++;
}

for (const digits of [[0, 0, 0, 0], [1, 10, 0, 0], [1, -1, 0, 0], [1, 0.5, 0, 0], [1, 0, 0, '2e0']]) {
  assert.throws(() => model.fourDigit(...digits), RangeError);
}
for (const a of [0, 10, -1, 1.5, '03', '2e0']) assert.throws(() => model.endingFive(a), RangeError);

const yes = model.fourDigit(1, 2, 3, 3);
const no = model.fourDigit(1, 2, 3, 4);
assert.equal(model.checkDivPrediction(yes, 'no').status, 'incorrect');
assert.equal(model.checkDivPrediction(yes, 'yes').status, 'correct');
assert.equal(model.checkDivPrediction(no, 'no').status, 'correct');
assert.equal(model.checkDivPrediction(no, 'yes').status, 'incorrect');
assert.equal(model.checkDivPrediction(no, null).status, 'empty');
assert.equal(model.checkDivSplit('correct').status, 'correct');
assert.equal(model.checkDivSplit('omit').status, 'incorrect');
assert.equal(model.checkDivSplit('triple').status, 'incorrect');
assert.equal(model.checkDivReason('multiple').status, 'correct');
assert.equal(model.checkDivReason('digits').status, 'incorrect');
assert.equal(model.checkDivReason('first-only').status, 'incorrect');
const square = model.endingFive(3);
assert.equal(model.checkSquarePrediction(square, '1225').status, 'correct');
assert.equal(model.checkSquarePrediction(square, '625').status, 'incorrect');
for (const input of ['', '1225abc', '-1225', '1e3', '12.25']) assert.equal(model.checkSquarePrediction(square, input).status, 'empty');
assert.equal(model.checkSquareSplit('correct').status, 'correct');
assert.equal(model.checkSquareSplit('no-strips').status, 'incorrect');
assert.equal(model.checkSquareSplit('one-strip').status, 'incorrect');
assert.equal(model.checkSquareReason('factor').status, 'correct');
assert.equal(model.checkSquareReason('wrong-factor').status, 'incorrect');
assert.equal(model.checkSquareReason('last-five').status, 'incorrect');
console.log(`代数推理纯模型：${checked} 个数值案例及错误反馈通过`);
