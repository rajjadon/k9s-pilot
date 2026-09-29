import { execFile } from 'node:child_process';

/** Result of running an external command. `code` is the process exit code (127 = not found). */
export interface ExecResult {
  code: number;
  stdout: string;
  stderr: string;
}

/**
 * The single boundary to the outside world. Everything that shells out (kubectl, gcloud) takes an
 * `Exec` so tests can inject a fake instead of touching the real CLIs.
 */
export type Exec = (command: string, args: string[]) => Promise<ExecResult>;

export const nodeExec: Exec = (command, args) =>
  new Promise((resolve) => {
    execFile(command, args, { encoding: 'utf8' }, (error, stdout, stderr) => {
      let code = 0;
      if (error) {
        code = typeof error.code === 'number' ? error.code : 1;
      }
      resolve({ code, stdout, stderr });
    });
  });
