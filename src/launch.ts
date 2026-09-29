import { shellQuotePosix } from './shellQuote';

export interface LaunchOptions {
  context: string;
  namespace?: string;
  k9sPath?: string;
}

/**
 * Build the k9s command line. Uses `--context` (never a global context switch) so launching a
 * cluster here never changes what the user's other terminals point at. A blank namespace is omitted,
 * which tells k9s to show all namespaces.
 */
export function buildK9sCommand(opts: LaunchOptions): string {
  const bin = opts.k9sPath && opts.k9sPath.trim() ? opts.k9sPath.trim() : 'k9s';
  const parts = [bin, '--context', shellQuotePosix(opts.context)];
  if (opts.namespace && opts.namespace.trim()) {
    parts.push('-n', shellQuotePosix(opts.namespace.trim()));
  }
  return parts.join(' ');
}
