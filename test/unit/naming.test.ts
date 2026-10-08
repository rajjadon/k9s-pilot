import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseContextName, deriveDisplayName, deriveGroup, detectEnv } from '../../src/naming';

test('parseContextName: standard GKE context splits into project/location/cluster', () => {
  const p = parseContextName('gke_my-project_us-central1_my-cluster');
  assert.equal(p.kind, 'gke');
  if (p.kind === 'gke') {
    assert.equal(p.project, 'my-project');
    assert.equal(p.location, 'us-central1');
    assert.equal(p.cluster, 'my-cluster');
  }
});

test('parseContextName: cluster name containing underscores is preserved', () => {
  const p = parseContextName('gke_proj_us-central1_team_cluster_v2');
  assert.equal(p.kind, 'gke');
  if (p.kind === 'gke') {
    assert.equal(p.cluster, 'team_cluster_v2');
  }
});

test('parseContextName: non-GKE context passes through as other', () => {
  const p = parseContextName('minikube');
  assert.equal(p.kind, 'other');
  assert.equal(p.raw, 'minikube');
});

test('deriveDisplayName: alias overrides the derived name', () => {
  const p = parseContextName('gke_my-project_us-central1_my-cluster');
  assert.equal(
    deriveDisplayName(p, { 'gke_my-project_us-central1_my-cluster': 'Prod (US)' }),
    'Prod (US)',
  );
  assert.equal(deriveDisplayName(p), 'my-cluster');
});

test('deriveGroup: GKE groups by project unless overridden', () => {
  const p = parseContextName('gke_my-project_us-central1_my-cluster');
  assert.equal(deriveGroup(p), 'my-project');
  assert.equal(
    deriveGroup(p, { 'gke_my-project_us-central1_my-cluster': 'Team A' }),
    'Team A',
  );
});

test('deriveGroup: non-GKE context falls under Ungrouped', () => {
  assert.equal(deriveGroup(parseContextName('minikube')), 'Ungrouped');
});

test('detectEnv: recognizes prod, non-prod, and unknown (non-prod wins over the prod substring)', () => {
  assert.equal(detectEnv('gke_acme-prod_us-central1_web'), 'prod');
  assert.equal(detectEnv('gke_acme-staging_us-central1_web'), 'nonprod');
  assert.equal(detectEnv('gke_acme-nonprod_us-central1_web'), 'nonprod');
  assert.equal(detectEnv('gke_acme-non-prod_us-central1_web'), 'nonprod');
  assert.equal(detectEnv('minikube'), 'unknown');
});
