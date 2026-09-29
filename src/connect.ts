import * as vscode from 'vscode';
import type { Exec } from './exec';
import { parseContextName } from './naming';
import { isAuthValid } from './gcloud';
import { buildK9sCommand } from './launch';
import type { Cluster } from './tree';

const NS_STATE_PREFIX = 'k9sPilot.ns.';

export interface ConnectOptions {
  /** Always ask for a namespace, even if one is remembered. */
  promptNamespace?: boolean;
}

/**
 * The whole point of the extension: for GKE, confirm gcloud auth is alive first (so k9s doesn't open
 * onto a dead token), resolve a namespace (remembered → configured default → prompt), then launch
 * k9s in a dedicated terminal.
 */
export async function connectToCluster(
  exec: Exec,
  state: vscode.Memento,
  cluster: Cluster,
  opts: ConnectOptions = {},
): Promise<void> {
  const cfg = vscode.workspace.getConfiguration('k9sPilot');
  const gcloudPath = cfg.get<string>('gcloudPath', 'gcloud');
  const k9sPath = cfg.get<string>('k9sPath', 'k9s');
  const defaults = cfg.get<Record<string, string>>('defaultNamespaces', {});

  const parsed = parseContextName(cluster.context);

  if (parsed.kind === 'gke') {
    const ok = await isAuthValid(exec, gcloudPath);
    if (!ok) {
      const choice = await vscode.window.showWarningMessage(
        `gcloud isn't authenticated. Log in before connecting to "${cluster.label}"?`,
        'Run gcloud auth login',
        'Cancel',
      );
      if (choice !== 'Run gcloud auth login') {
        return;
      }
      runInTerminal('gcloud auth login', 'gcloud auth');
      void vscode.window.showInformationMessage(
        'Finish the gcloud login in the terminal, then click the cluster again.',
      );
      return;
    }
  }

  const key = NS_STATE_PREFIX + cluster.context;
  let namespace = state.get<string>(key) ?? defaults[cluster.context];
  if (opts.promptNamespace || namespace === undefined) {
    const entered = await vscode.window.showInputBox({
      title: `Namespace for ${cluster.label}`,
      prompt: 'Leave blank for all namespaces',
      value: namespace ?? '',
      ignoreFocusOut: true,
    });
    if (entered === undefined) {
      return; // cancelled
    }
    namespace = entered;
  }
  await state.update(key, namespace);

  const command = buildK9sCommand({ context: cluster.context, namespace, k9sPath });
  runInTerminal(command, `k9s: ${cluster.label}`);
}

function runInTerminal(command: string, name: string): void {
  const terminal = vscode.window.createTerminal({ name });
  terminal.show();
  terminal.sendText(command, true);
}
