// Pure functions that turn a raw kubeconfig context name into something a human can read.
// No I/O, no vscode — trivially unit-testable.

export interface GkeContext {
  kind: 'gke';
  raw: string;
  project: string;
  location: string;
  cluster: string;
}

export interface OtherContext {
  kind: 'other';
  raw: string;
}

export type ParsedContext = GkeContext | OtherContext;

/**
 * GKE writes contexts as `gke_<project>_<location>_<cluster>`. Cluster names may themselves contain
 * underscores, so everything past the location is the cluster. Anything that does not match that
 * shape is passed through untouched as an "other" context (minikube, kind, on-prem, EKS, …).
 */
export function parseContextName(raw: string): ParsedContext {
  const parts = raw.split('_');
  if (parts[0] === 'gke' && parts.length >= 4) {
    return {
      kind: 'gke',
      raw,
      project: parts[1] ?? '',
      location: parts[2] ?? '',
      cluster: parts.slice(3).join('_'),
    };
  }
  return { kind: 'other', raw };
}

export function deriveDisplayName(parsed: ParsedContext, aliases: Record<string, string> = {}): string {
  const alias = aliases[parsed.raw];
  if (alias) {
    return alias;
  }
  return parsed.kind === 'gke' ? parsed.cluster : parsed.raw;
}

export function deriveGroup(parsed: ParsedContext, groups: Record<string, string> = {}): string {
  const override = groups[parsed.raw];
  if (override) {
    return override;
  }
  return parsed.kind === 'gke' ? parsed.project : 'Ungrouped';
}

export type Env = 'prod' | 'nonprod' | 'unknown';

// Non-prod is checked first: "non-prod" contains the substring "prod".
const NONPROD = /(^|[-_/])(non-?prod|nonprod|staging|stage|stg|uat|sit|dev|test|qa|sandbox|sbx)([-_/]|$)/i;
const PROD = /(^|[-_/])(prod|production|prd)([-_/]|$)/i;

/** Best-effort environment hint from the raw context name, used only for the row icon. */
export function detectEnv(raw: string): Env {
  if (NONPROD.test(raw)) {
    return 'nonprod';
  }
  if (PROD.test(raw)) {
    return 'prod';
  }
  return 'unknown';
}
