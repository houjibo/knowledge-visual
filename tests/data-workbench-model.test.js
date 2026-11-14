'use strict';
const assert = require('node:assert/strict');
const {test} = require('node:test');
const Model = require('../computer/high/assets/data-workbench-model.js');

test('UTF-8 examples retain documented byte boundaries', () => {
  assert.deepEqual(Model.encodeSymbol('A').bytes.map(item => item.hex), ['41']);
  assert.deepEqual(Model.encodeSymbol('han').bytes.map(item => item.hex), ['E4', 'B8', 'AD']);
  assert.deepEqual(Model.encodeSymbol('seedling').bytes.map(item => item.hex), ['F0', '9F', '8C', 'B1']);
  for (const key of ['A', 'han', 'seedling']) {
    const result = Model.encodeSymbol(key);
    assert.equal(result.bytes.length, result.count);
    assert.ok(result.bytes.every(item => /^[01]{8}$/.test(item.binary)));
  }
  assert.throws(() => Model.encodeSymbol('unknown'), RangeError);
});

test('all three cleanup decisions are needed before analysis', () => {
  assert.deepEqual(Model.checkPlan({unit: 'divide-1000', missing: 'exclude', duplicate: 'single'}),
    {unit: true, missing: true, duplicate: true, ready: true});
  for (const wrong of [
    {unit: 'as-is', missing: 'exclude', duplicate: 'single'},
    {unit: 'divide-1000', missing: 'zero', duplicate: 'single'},
    {unit: 'divide-1000', missing: 'exclude', duplicate: 'both'}
  ]) assert.equal(Model.checkPlan(wrong).ready, false);
});

test('default readings normalize milliliters, skip missing day and deduplicate Friday', () => {
  const result = Model.analyzeReadings(Model.DEFAULT_READINGS);
  assert.equal(result.ok, true);
  assert.deepEqual(result.observed.map(item => [item.day, item.liters]),
    [['周一', 18], ['周二', 21], ['周三', 21], ['周五', 23]]);
  assert.equal(result.rawCount, 6);
  assert.equal(result.observedCount, 4);
  assert.equal(result.duplicateCount, 1);
  assert.equal(result.missingDay, '周四');
  assert.equal(result.total, 83);
  assert.equal(result.mean, 20.75);
  assert.equal(result.axisMaximum, 25);
  assert.equal(Model.checkMean('20.75', result.mean), true);
  assert.equal(Model.checkMean('16.60', result.mean), false); // incorrectly counting missing as zero
  assert.equal(Model.checkMean('21.20', result.mean), false); // incorrectly counting duplicate Friday
});

test('changing a valid reading recomputes the chart scale and answer', () => {
  const changed = Model.analyzeReadings({monday: '50', tuesday: '21', wednesdayMl: '21000', friday: '23'});
  assert.equal(changed.ok, true);
  assert.equal(changed.total, 115);
  assert.equal(changed.mean, 28.75);
  assert.equal(changed.axisMaximum, 50);
  assert.equal(Model.checkMean('20.75', changed.mean), false);
  assert.equal(Model.checkMean('28.75', changed.mean), true);
  const zero = Model.analyzeReadings({monday: '0', tuesday: 0, wednesdayMl: 0, friday: '0'});
  assert.equal(zero.ok, true);
  assert.equal(zero.mean, 0);
  assert.equal(zero.axisMaximum, 5);
});

test('blank, fractional, unconverted and out of range input never produces a chart', () => {
  for (const override of [
    {monday: ''}, {monday: '-1'}, {monday: '51'}, {tuesday: '2.5'},
    {wednesdayMl: '21001'}, {wednesdayMl: '51000'}, {friday: 'Infinity'}
  ]) {
    const result = Model.analyzeReadings({...Model.DEFAULT_READINGS, ...override});
    assert.equal(result.ok, false, JSON.stringify(override));
  }
  assert.equal(Model.analyzeReadings(null).ok, false);
  assert.equal(Model.checkMean('', 20.75), false);
  assert.equal(Model.checkMean('Infinity', 20.75), false);
});
