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
  assert.ok(blockingPublishMessage({ layout: 'modal' }, { devices: 'all', trigger: 'load' })); // modal is a mobile interstitial too
  assert.equal(blockingPublishMessage({ layout: 'slide-in' }, { devices: 'all', trigger: 'load' }), '');
});

test('round 4: modal and fullscreen on mobile are blocked for load, scroll and early delay', () => {
  for (const layout of ['modal', 'fullscreen']) {
    for (const rules of [{ trigger: 'load', devices: 'all' }, { trigger: 'scroll', scrollPercent: 50, devices: 'mobile' }, { trigger: 'delay', delaySeconds: 2, devices: 'all' }]) {
      assert.ok(blockingPublishMessage({ layout }, rules), `${layout} ${JSON.stringify(rules)} should block`);
    }
    assert.equal(blockingPublishMessage({ layout }, { trigger: 'delay', delaySeconds: 3, devices: 'all' }), '');
    assert.equal(blockingPublishMessage({ layout }, { trigger: 'load', devices: 'desktop' }), '');
  }
  for (const layout of ['slide-in', 'top-bar', 'bottom-bar']) assert.equal(blockingPublishMessage({ layout }, { trigger: 'load', devices: 'all' }), '');
});
