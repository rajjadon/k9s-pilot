import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildK9sCommand } from '../../src/launch';

test('buildK9sCommand: context only', () => {
  assert.equal(buildK9sCommand({ context: 'my-ctx' }), "k9s --context 'my-ctx'");
});

test('buildK9sCommand: with namespace', () => {
  assert.equal(
    buildK9sCommand({ context: 'my-ctx', namespace: 'web' }),
    "k9s --context 'my-ctx' -n 'web'",
  );
});

test('buildK9sCommand: blank/whitespace namespace is omitted (all namespaces)', () => {
  assert.equal(buildK9sCommand({ context: 'c', namespace: '   ' }), "k9s --context 'c'");
});

test('buildK9sCommand: honors a custom k9s path', () => {
  assert.equal(
    buildK9sCommand({ context: 'c', k9sPath: '/opt/bin/k9s' }),
    "/opt/bin/k9s --context 'c'",
  );
});

test('buildK9sCommand: a shell-injection attempt stays a single quoted literal', () => {
  assert.equal(
    buildK9sCommand({ context: "c'; rm -rf ~ #" }),
    "k9s --context 'c'\\''; rm -rf ~ #'",
  );
});
