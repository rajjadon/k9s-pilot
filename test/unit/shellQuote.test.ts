import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shellQuotePosix } from '../../src/shellQuote';

test('shellQuotePosix: wraps a plain value in single quotes', () => {
  assert.equal(shellQuotePosix('default'), "'default'");
});

test('shellQuotePosix: escapes an embedded single quote so it round-trips literally', () => {
  assert.equal(shellQuotePosix("a'b"), "'a'\\''b'");
});

test('shellQuotePosix: empty string quotes to an empty pair', () => {
  assert.equal(shellQuotePosix(''), "''");
});
