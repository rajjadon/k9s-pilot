import * as vscode from 'vscode';
import type { Exec } from './exec';
import { listContexts } from './kubeconfig';
import { parseContextName, deriveDisplayName, deriveGroup, detectEnv, type Env } from './naming';

export interface Cluster {
  context: string;
  label: string;
  group: string;
  env: Env;
  isCurrent: boolean;
}

export class GroupNode {
  readonly kind = 'group';
  constructor(public readonly label: string, public readonly clusters: Cluster[]) {}
}

export class ClusterNode {
  readonly kind = 'cluster';
  constructor(public readonly cluster: Cluster) {}
}

export type Node = GroupNode | ClusterNode;

export class ClustersProvider implements vscode.TreeDataProvider<Node> {
  private readonly _onDidChangeTreeData = new vscode.EventEmitter<Node | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private readonly exec: Exec) {}

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(node: Node): vscode.TreeItem {
    if (node.kind === 'group') {
      const item = new vscode.TreeItem(node.label, vscode.TreeItemCollapsibleState.Expanded);
      item.contextValue = 'k9sPilotGroup';
      item.iconPath = new vscode.ThemeIcon('folder');
      return item;
    }

    const c = node.cluster;
    const item = new vscode.TreeItem(c.label, vscode.TreeItemCollapsibleState.None);
    item.description = c.isCurrent ? 'current' : undefined;
    item.contextValue = 'k9sPilotCluster';
    item.iconPath = new vscode.ThemeIcon(c.env === 'prod' ? 'shield' : 'server-environment');
    item.tooltip = c.context;
    item.command = { command: 'k9sPilot.connect', title: 'Connect', arguments: [node] };
    return item;
  }

  async getChildren(node?: Node): Promise<Node[]> {
    if (!node) {
      const clusters = await this.getClusters();
      const groups = new Map<string, Cluster[]>();
      for (const c of clusters) {
        const arr = groups.get(c.group) ?? [];
        arr.push(c);
        groups.set(c.group, arr);
      }
      return [...groups.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([label, cs]) => new GroupNode(label, cs));
    }

    if (node.kind === 'group') {
      return node.clusters
        .slice()
        .sort((a, b) => a.label.localeCompare(b.label))
        .map((c) => new ClusterNode(c));
    }

    return [];
  }

  /** Flat cluster list, used by the command-palette quick pick. */
  async getClusters(): Promise<Cluster[]> {
    const cfg = vscode.workspace.getConfiguration('k9sPilot');
    const aliases = cfg.get<Record<string, string>>('aliases', {});
    const groups = cfg.get<Record<string, string>>('groups', {});
    const kubectlPath = cfg.get<string>('kubectlPath', 'kubectl');

    const { contexts, current } = await listContexts(this.exec, kubectlPath);
    return contexts.map((ctx) => {
      const parsed = parseContextName(ctx);
      return {
        context: ctx,
        label: deriveDisplayName(parsed, aliases),
        group: deriveGroup(parsed, groups),
        env: detectEnv(ctx),
        isCurrent: ctx === current,
      };
    });
  }
}
