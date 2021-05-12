import * as vscode from 'vscode';
import { fetchGitUserName } from './git';
import { createBoard, deleteBoard, openBoard } from './kanbanBoards';

export function activate(context: vscode.ExtensionContext) {
  fetchGitUserName();

  let disposable = vscode.commands.registerCommand('sharableKanbanBoards.create', () => {
    createBoard(context);
  });
  context.subscriptions.push(disposable);

  disposable = vscode.commands.registerCommand('sharableKanbanBoards.open', () => {
    openBoard(context);
  });
  context.subscriptions.push(disposable);

  disposable = vscode.commands.registerCommand('sharableKanbanBoards.delete', () => {
    deleteBoard();
  });
  context.subscriptions.push(disposable);
}

export function deactivate() {}
