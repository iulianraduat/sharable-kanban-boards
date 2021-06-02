import * as path from 'path';
import * as vscode from 'vscode';
import { getBoard, saveBoard } from './commands';
import { getGitUserName } from './git';
import { TBoard } from './types';

export class ReactPanel {
  private static currentPanel: vscode.WebviewPanel | undefined = undefined;

  public static createOrShow(context: vscode.ExtensionContext, boardName: string): void {
    let columnToShowIn = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;
    if (columnToShowIn === undefined) {
      columnToShowIn = vscode.ViewColumn.One;
    }

    /* If we already have a panel, show it in the target column */
    if (this.currentPanel) {
      this.currentPanel.reveal(columnToShowIn);
      return;
    }

    /* Otherwise, create a new panel */
    this.currentPanel = vscode.window.createWebviewPanel(
      'ShareableKanbanBoard',
      'Shareable Kanban board',
      columnToShowIn,
      {
        /* Enable javascript in the webview */
        enableScripts: true,
        /* to keep the status when we switch between tabs */
        retainContextWhenHidden: true,
        /* And restrict the webview to only loading content from our extension's "out" directory */
        localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'out'))],
      }
    );

    const board = getBoard(boardName);
    this.currentPanel.webview.html = ReactPanel.getHtmlForWebview(context.extensionPath, board);

    this.currentPanel.webview.onDidReceiveMessage(
      (message) => {
        switch (message.command) {
          case 'save-kanban-board':
            saveBoard(message.payload);
            return;
        }
      },
      this,
      context.subscriptions
    );

    /* Reset when the current panel is closed */
    this.currentPanel.onDidDispose(() => (this.currentPanel = undefined), null, context.subscriptions);
  }

  private constructor() {}

  private static getHtmlForWebview(extensionPath: string, board: TBoard): string {
    const mainScript = 'webview.js';
    const mainStyle = 'webview.css';

    const scriptPathOnDisk = vscode.Uri.file(path.join(extensionPath, 'out', mainScript));
    const scriptUri = scriptPathOnDisk.with({ scheme: 'vscode-resource' });
    const stylePathOnDisk = vscode.Uri.file(path.join(extensionPath, 'out', mainStyle));
    const styleUri = stylePathOnDisk.with({ scheme: 'vscode-resource' });

    /* Use a nonce to whitelist which scripts can be run */
    const nonce = getNonce();
    const baseUrl = vscode.Uri.file(path.join(extensionPath, 'out')).with({ scheme: 'vscode-resource' });

    const gitUserName = getGitUserName();
    const boardJson = JSON.stringify(board, null, 2);

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1,shrink-to-fit=no">
    <meta name="theme-color" content="#000000">
    <title>Kanban Boards</title>
    <link rel="stylesheet" type="text/css" href="${styleUri}">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src vscode-resource: https:; script-src 'nonce-${nonce}';style-src vscode-resource: 'unsafe-inline' http: https: data:;">
    <base href="${baseUrl}/">
    <script nonce="${nonce}">
      gitUserName = ${gitUserName ? `\`${gitUserName}\`` : 'undefined'};
    </script>
    <script nonce="${nonce}">
      kanbanBoard = ${boardJson};
    </script>
</head>
<body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
    <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`.trim();
    return html;
  }

  private static async setUserEmail(webview: vscode.Webview) {
    const outputChannel = vscode.window.createOutputChannel('Kanban boards');
    outputChannel.append('setUserEmail started');
    outputChannel.show();

    let session = await vscode.authentication.getSession('github', ['read:user', 'user:email'], {
      createIfNone: false,
    });
    if (session) {
      outputChannel.append(JSON.stringify({ github: session }, null, 2));
      outputChannel.show();

      webview.postMessage({
        command: 'authUserEmail',
        payload: {
          user: session.account,
          email: '?',
        },
      });
      return;
    }

    session = await vscode.authentication.getSession('microsoft', ['profile', 'email'], {
      createIfNone: false,
    });
    if (session) {
      outputChannel.append(JSON.stringify({ microsoft: session }, null, 2));
      outputChannel.show();

      webview.postMessage({
        command: 'authUserEmail',
        payload: {
          user: session.account,
          email: '?',
        },
      });
      return;
    }

    outputChannel.append('setUserEmail done');
    outputChannel.show();
  }
}

function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
