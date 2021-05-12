import * as vscode from 'vscode';
import { exec } from 'child_process';

const USER_NAME = 'user_name';
const gitVariables: Record<string, any> = {};

export async function fetchGitUserName() {
  const cmd = 'git config user.name';
  exec(cmd, (err, stdout, stderr) => {
    if (err) {
      gitVariables[USER_NAME] = 'unknown';
      return;
    }

    gitVariables[USER_NAME] = stdout.toString().trim();
    if (gitVariables[USER_NAME] === '') {
      gitVariables[USER_NAME] = 'unknown';
    }
  });
}

export function getGitUserName(): string | undefined {
  return gitVariables[USER_NAME];
}
