import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  getField,
  setField,
  removeField,
  withDefaults,
} from '../src/components/element-crud/model.ts';

test('nested paths and arrays use one model contract without mutating the original branch', () => {
  const original = { users: [{ name: 'old' }] };
  const model = { ...original };
  setField(model, 'users[0].name', 'new');
  assert.equal(getField(model, 'users.0.name'), 'new');
  assert.equal(original.users[0].name, 'old');
  removeField(model, 'users[0].name');
  assert.equal(getField(model, 'users[0].name'), undefined);
  assert.equal(original.users[0].name, 'old');
});
test('defaults preserve explicit values, initialize nested missing paths and clone defaults', () => {
  const value = { list: [] };
  const model = withDefaults({ user: { name: '' } }, [
    { field: 'user.name', defaultValue: 'fallback' },
    { field: 'user.preferences', defaultValue: value },
  ]);
  assert.equal(model.user.name, '');
  model.user.preferences.list.push('local');
  assert.deepEqual(value, { list: [] });
});
test('prototype paths are rejected', () => {
  for (const path of [
    '__proto__.polluted',
    'constructor.prototype.polluted',
    'user..name',
  ]) {
    assert.throws(() => setField({}, path, true), /Invalid field path/);
  }
  assert.equal({}.polluted, undefined);
});
