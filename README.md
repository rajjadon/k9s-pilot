# k9s Pilot

Pick a Kubernetes cluster by a name you recognise and drop straight into
[k9s](https://k9scli.io/). No memorising cryptic context strings, no hunting for the
login incantation. Local-first — no account, no telemetry, no data leaves your machine.

## Why

`kubectl` context names are unreadable (`gke_my-project_us-central1_my-cluster`), the
gcloud login/re-auth step is easy to forget, and getting into k9s means retyping the same
`--context`/`-n` flags every time. k9s Pilot turns all of that into one click.

## What it does

- Lists every context from your kubeconfig in a **Clusters** view, grouped by project, with
  friendly names.
- On connect (GKE): checks `gcloud` is authenticated first and offers to log you in if not,
  so k9s never opens onto a dead token.
- Launches `k9s --context <ctx> -n <namespace>` in a dedicated terminal. Uses `--context`
  only, so it never changes what your other terminals point at.
- Remembers the namespace per cluster after the first connect. Use **Connect (choose
  namespace)…** to change it.

## Requirements

- [`kubectl`](https://kubernetes.io/docs/tasks/tools/) on your `PATH`
- [`k9s`](https://k9scli.io/topics/install/) on your `PATH`
- [`gcloud`](https://cloud.google.com/sdk/docs/install) — only needed for GKE contexts, for
  the pre-connect auth check

## Settings

| Setting | Purpose |
| --- | --- |
| `k9sPilot.aliases` | Friendly display names, keyed by full context name. |
| `k9sPilot.groups` | Override the group a context is filed under (defaults to the GKE project). |
| `k9sPilot.defaultNamespaces` | Default namespace per context for the first connect. |
| `k9sPilot.k9sPath` / `k9sPilot.kubectlPath` / `k9sPilot.gcloudPath` | Binary paths, if not on `PATH`. |

Example:

```jsonc
{
  "k9sPilot.aliases": {
    "gke_my-project_us-central1_my-cluster": "Prod (US)"
  },
  "k9sPilot.defaultNamespaces": {
    "gke_my-project_us-central1_my-cluster": "web"
  }
}
```

## Develop

```bash
npm install
npm run compile     # typecheck + bundle
npm run test:unit   # pure-logic unit tests
```

Press **F5** in VS Code to launch an Extension Development Host.

## Publishing

Set a real `publisher` in `package.json` (currently `REPLACE_ME`), then `npm run package`.

## License

MIT
