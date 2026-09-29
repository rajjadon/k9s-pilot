import * as vscode from 'vscode';
import { nodeExec } from './exec';
import { ClustersProvider, ClusterNode, type Cluster } from './tree';
import { connectToCluster } from './connect';

export function activate(context: vscode.ExtensionContext): void {
  const exec = nodeExec;
  const provider = new ClustersProvider(exec);

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('k9sPilotClusters', provider),
    vscode.commands.registerCommand('k9sPilot.refresh', () => provider.refresh()),
    vscode.commands.registerCommand('k9sPilot.connect', async (node?: ClusterNode) => {
      const cluster = await resolveCluster(provider, node);
      if (cluster) {
        await connectToCluster(exec, context.globalState, cluster);
      }
    }),
    vscode.commands.registerCommand('k9sPilot.connectChooseNamespace', async (node?: ClusterNode) => {
      const cluster = await resolveCluster(provider, node);
      if (cluster) {
        await connectToCluster(exec, context.globalState, cluster, { promptNamespace: true });
      }
    }),
  );
}

export function deactivate(): void {
  // Nothing to tear down: terminals are owned by VS Code, and we hold no long-lived handles.
}

/**
 * Clicking a tree row passes the node directly. Invoking from the command palette passes nothing, so
 * fall back to a quick pick over all clusters.
 */
async function resolveCluster(
  provider: ClustersProvider,
  node?: ClusterNode,
): Promise<Cluster | undefined> {
  if (node?.kind === 'cluster') {
    return node.cluster;
  }

  const clusters = await provider.getClusters();
  if (clusters.length === 0) {
    void vscode.window.showWarningMessage(
      'k9s Pilot: no kubeconfig contexts found. Is kubectl installed and configured?',
    );
    return undefined;
  }

  const picked = await vscode.window.showQuickPick(
    clusters.map((c) => ({
      label: c.label,
      description: c.group,
      detail: c.context,
      cluster: c,
    })),
    { title: 'Connect to cluster', matchOnDescription: true, matchOnDetail: true },
  );
  return picked?.cluster;
}
