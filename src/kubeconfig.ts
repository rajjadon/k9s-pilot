import type { Exec } from './exec';

export interface ContextList {
  contexts: string[];
  current: string | null;
}

/**
 * List kubeconfig contexts via kubectl. If kubectl is missing or unconfigured the command fails and
 * we return an empty list, which the tree renders as a "nothing here" state rather than throwing.
 */
export async function listContexts(exec: Exec, kubectlPath = 'kubectl'): Promise<ContextList> {
  const [namesRes, currentRes] = await Promise.all([
    exec(kubectlPath, ['config', 'get-contexts', '-o', 'name']),
    exec(kubectlPath, ['config', 'current-context']),
  ]);

  const contexts = namesRes.stdout
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const current = currentRes.code === 0 ? currentRes.stdout.trim() || null : null;

  return { contexts, current };
}
