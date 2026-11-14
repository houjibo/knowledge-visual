const assert = require('node:assert/strict');
const Model = require('../computer/middle/assets/webpage-publishing-model.js');

const source = {...Model.INITIAL, title: '  新活动  '};
const checked = Model.validate(source);
assert.equal(checked.ok, true);
assert.equal(checked.data.title, '新活动');
const version1 = Model.publish(source, 1);
source.title = '发布后修改';
assert.equal(version1.title, '新活动');
assert.equal(Object.isFrozen(version1), true);
assert.equal(Model.differs(source, version1), true);
assert.equal(Model.differs(Model.INITIAL, {...Model.INITIAL}), false);
assert.equal(Model.publish(source, 2).version, 2);

for (const [field, label] of [['title', '标题'], ['body', '正文'], ['imageAlt', '图像说明']]) {
  const result = Model.validate({...Model.INITIAL, [field]: '  '});
  assert.equal(result.ok, false);
  assert.equal(result.field, field);
  assert.match(result.message, new RegExp(label));
  assert.equal(Model.validate({...Model.INITIAL, [field]: '字'.repeat(Model.LIMITS[field] + 1)}).ok, false);
}
assert.equal(Model.validate({...Model.INITIAL, linkTarget: 'https://example.com'}).ok, false);
assert.equal(Model.validate({...Model.INITIAL, linkTarget: '../index.html'}).ok, false);
assert.equal(Model.validate({...Model.INITIAL, body: '<img src=x onerror=alert(1)>'}).ok, true);
assert.throws(() => Model.publish({...Model.INITIAL, title: ''}, 1));
assert.throws(() => Model.publish(Model.INITIAL, 0));
assert.equal(Model.validate(null).ok, false);

console.log('webpage publishing model passed');
