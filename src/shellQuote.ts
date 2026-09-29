/**
 * POSIX single-quote a value so it reaches k9s as one literal argument. Context and namespace names
 * come from kubeconfig / user input, so anything shell-special in them must stay inert.
 */
export function shellQuotePosix(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}
