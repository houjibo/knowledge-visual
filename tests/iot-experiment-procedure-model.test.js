const assert = require('node:assert/strict');
const Model = require('../computer/middle/assets/iot-experiment-procedure-model.js');

const task = Model.getTask();
assert.equal(task.id, 'fictional-temp-humidity-experiment');
assert.match(task.boundary, /不连接真实设备|不发送网络请求/);
assert.match(task.prepNote, /先修|不替代|真实器材/);

// Step 1: safety procedures
const safety = Model.getSafetyRules();
assert.ok(safety.length >= 6);
assert.ok(safety.some(r => !r.safe));
const correctSafety = Object.fromEntries(safety.map(r => [r.id, r.safe ? 'safe' : 'unsafe']));
const safetyOk = Model.judgeSafety(correctSafety);
assert.equal(safetyOk.correct, true);
assert.deepEqual(safetyOk.mismatches, []);

const unsafe = safety.find(r => !r.safe);
const safetyWrong = Model.judgeSafety({...correctSafety, [unsafe.id]: 'safe'});
assert.equal(safetyWrong.correct, false);
assert.deepEqual(safetyWrong.mismatches, [{ruleId: unsafe.id, expected: 'unsafe', actual: 'safe'}]);
assert.throws(() => Model.judgeSafety({...correctSafety, extra: 'safe'}), RangeError);
assert.throws(() => Model.judgeSafety({[safety[0].id]: correctSafety[safety[0].id]}), RangeError);
assert.throws(() => Model.judgeSafety({...correctSafety, [safety[0].id]: 'maybe'}), RangeError);

// Step 2: procedure ordering
const steps = Model.getProcedureSteps();
assert.equal(steps.length, 6);
const correctOrder = steps.map(s => s.id);
const orderOk = Model.orderProcedure(correctOrder);
assert.equal(orderOk.correct, true);
assert.deepEqual(orderOk.mismatches, []);

// Swap two adjacent steps -> mismatch detected
const swapped = [...correctOrder];
[swapped[2], swapped[3]] = [swapped[3], swapped[2]];
const orderWrong = Model.orderProcedure(swapped);
assert.equal(orderWrong.correct, false);
assert.ok(orderWrong.mismatches.length >= 1);
assert.throws(() => Model.orderProcedure(correctOrder.slice(0, 4)), RangeError);
const reversed = Model.orderProcedure([...correctOrder].reverse());
assert.equal(reversed.correct, false);
assert.ok(reversed.mismatches.length >= 1);
assert.throws(() => Model.orderProcedure([...correctOrder, 'bogus']), RangeError);

// Step 3: data flow stages
const stages = Model.getDataStages();
assert.equal(stages.length, 5);
const correctFlow = Object.fromEntries(stages.map(s => [s.id, s.stageKey]));
const flowOk = Model.matchDataFlow(correctFlow);
assert.equal(flowOk.correct, true);
assert.deepEqual(flowOk.mismatches, []);

const flowWrong = Model.matchDataFlow({...correctFlow, 'platform-aggregate': 'collect'});
assert.equal(flowWrong.correct, false);
assert.deepEqual(flowWrong.mismatches, [{stageId: 'platform-aggregate', expected: 'aggregate', actual: 'collect'}]);
assert.throws(() => Model.matchDataFlow({[stages[0].id]: correctFlow[stages[0].id]}), RangeError);
assert.throws(() => Model.matchDataFlow({...correctFlow, [stages[0].id]: 'bogus'}), RangeError);

const snapshot = Model.getLocalSnapshot();
assert.equal(snapshot.networkRequests, 0);
assert.equal(snapshot.connectedToRealDevice, false);

assert.equal(Object.isFrozen(safety), true);
assert.equal(Object.isFrozen(safety[0]), true);
assert.equal(Object.isFrozen(steps), true);
assert.equal(Object.isFrozen(stages), true);
assert.equal(Object.isFrozen(safetyOk.mismatches), true);
assert.equal(Object.isFrozen(snapshot), true);

console.log('IoT experiment procedure model: safety, ordering and data flow passed');
