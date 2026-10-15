import test from 'node:test';
import assert from 'node:assert/strict';
import { pathMatches, pathAllowed, blockingPublishMessage } from '../../src/lib/popup-config.js';

test('pathological glob returns fast (no ReDoS)', () => {
  const t = Date.now();
  assert.equal(pathMatches('/*a*a*a*a*a*a*a*a*a*a*a*a*b', '/' + 'a'.repeat(60)), false);
  assert.equal(pathMatches('/*a*a*a*a*a*a*a*a*a*a*a*a*b', '/' + 'a'.repeat(5000)), false);
  assert.ok(Date.now() - t < 50, `took ${Date.now() - t} ms`);
});

test('glob semantics preserved', () => {
  assert.ok(pathMatches('/*', '/'));
  assert.ok(pathMatches('/*', '/anything/deep'));
  assert.ok(pathMatches('/investors/*', '/investors/q3'));
  assert.ok(pathMatches('/investors/*', '/investors/a/b'));
  assert.ok(!pathMatches('/investors/*', '/products/x'));
  assert.ok(pathMatches('/', '/'));
  assert.ok(!pathMatches('/', '/x'));
  assert.ok(pathMatches('/about', '/about'));
  assert.ok(pathMatches('/about', '/about/'));
  assert.ok(pathMatches('/about/', '/about'));
  assert.ok(!pathMatches('/about', '/about/us'));
  assert.ok(pathMatches('/a*c', '/abbbc'));
  assert.ok(!pathMatches('/a*c', '/abbbd'));
  assert.ok(pathMatches('/a**c', '/ac'));
  assert.ok(pathMatches('/a.b', '/a.b') && !pathMatches('/a.b', '/aXb'));
  assert.ok(!pathMatches('', '/'));
});

test('pathAllowed: exclude wins, empty include = all', () => {
  assert.ok(pathAllowed({}, '/x'));
  assert.ok(!pathAllowed({ includePaths: ['/a/*'], excludePaths: ['/a/b'] }, '/a/b'));
  assert.ok(pathAllowed({ includePaths: ['/a/*'], excludePaths: ['/a/b'] }, '/a/c'));
});

test('blocking publish: fullscreen + mobile-visible + early trigger', () => {
  const fs = { layout: 'fullscreen' };
  assert.ok(blockingPublishMessage(fs, { devices: 'all', trigger: 'load' }));
  assert.ok(blockingPublishMessage(fs, { devices: 'mobile', trigger: 'delay', delaySeconds: 2 }));
  assert.equal(blockingPublishMessage(fs, { devices: 'all', trigger: 'delay', delaySeconds: 3 }), '');
  assert.equal(blockingPublishMessage(fs, { devices: 'desktop', trigger: 'load' }), '');
  assert.equal(blockingPublishMessage({ layout: 'modal' }, { devices: 'all', trigger: 'load' }), '');
});
