import { test } from 'node:test';
import assert from 'node:assert/strict';
import { listContexts } from '../../src/kubeconfig';
import type { Exec, ExecResult } from '../../src/exec';

function fakeExec(map: Record<string, ExecResult>): Exec {
  return async (command, args) => {
    const key = [command, ...args].join(' ');
    return map[key] ?? { code: 127, stdout: '', stderr: 'command not found' };
  };
}

test('listContexts: parses names and marks the current context', async () => {
  const exec = fakeExec({
    'kubectl config get-contexts -o name': { code: 0, stdout: 'a\nb\nc\n', stderr: '' },
    'kubectl config current-context': { code: 0, stdout: 'b\n', stderr: '' },
  });
  const res = await listContexts(exec);
  assert.deepEqual(res.contexts, ['a', 'b', 'c']);
  assert.equal(res.current, 'b');
});

test('listContexts: current is null when kubectl reports no current context', async () => {
  const exec = fakeExec({
    'kubectl config get-contexts -o name': { code: 0, stdout: 'a\n', stderr: '' },
    'kubectl config current-context': { code: 1, stdout: '', stderr: 'error: current-context is not set' },
  });
  const res = await listContexts(exec);
  assert.deepEqual(res.contexts, ['a']);
  assert.equal(res.current, null);
});

test('listContexts: missing kubectl yields an empty list, not a throw', async () => {
  const exec = fakeExec({});
  const res = await listContexts(exec);
  assert.deepEqual(res.contexts, []);
  assert.equal(res.current, null);
});
