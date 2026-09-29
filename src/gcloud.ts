import type { Exec } from './exec';
import type { GkeContext } from './naming';

export function buildAuthCheckArgs(): string[] {
  return ['auth', 'print-access-token'];
}

/**
 * `--location` covers both regional and zonal clusters, so we don't need to know which one it is.
 * Only needed when a GKE context isn't in kubeconfig yet (future use); listed contexts already are.
 */
export function buildGetCredentialsArgs(ctx: GkeContext): string[] {
  return [
    'container', 'clusters', 'get-credentials', ctx.cluster,
    '--location', ctx.location,
    '--project', ctx.project,
  ];
}

/** True when gcloud can mint an access token — i.e. the user is logged in and not expired. */
export async function isAuthValid(exec: Exec, gcloudPath = 'gcloud'): Promise<boolean> {
  const res = await exec(gcloudPath, buildAuthCheckArgs());
  return res.code === 0 && res.stdout.trim().length > 0;
}
