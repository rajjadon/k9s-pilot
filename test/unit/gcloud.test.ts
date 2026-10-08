import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildGetCredentialsArgs, isAuthValid } from '../../src/gcloud';
import type { Exec } from '../../src/exec';

test('buildGetCredentialsArgs: builds location + project flags', () => {
  assert.deepEqual(
    buildGetCredentialsArgs({
      kind: 'gke',
      raw: 'gke_p_us-central1_c',
      project: 'p',
      location: 'us-central1',
      cluster: 'c',
    }),
    ['container', 'clusters', 'get-credentials', 'c', '--location', 'us-central1', '--project', 'p'],
  );
});

test('isAuthValid: true only when the token command succeeds with non-empty output', async () => {
  const ok: Exec = async () => ({ code: 0, stdout: 'ya29.token\n', stderr: '' });
  const emptyOut: Exec = async () => ({ code: 0, stdout: '   \n', stderr: '' });
  const failed: Exec = async () => ({ code: 1, stdout: '', stderr: 'reauth required' });

  assert.equal(await isAuthValid(ok), true);
  assert.equal(await isAuthValid(emptyOut), false);
  assert.equal(await isAuthValid(failed), false);
});
