import * as vscode from 'vscode';
import {
  getAllBoards,
  getConfigPath,
  getEmptyBoard,
  getExistingNames,
  getInputName,
  getSelectedName,
  saveAllBoards,
  saveBoard,
} from './commands';
import { ReactPanel } from './reactPanel';

export function createBoard(context: vscode.ExtensionContext) {
  createKanbanBoard(context);
}

export function openBoard(context: vscode.ExtensionContext) {
  openKanbanBoard(context);
}

export function deleteBoard() {
  deleteKanbanBoard();
}

async function createKanbanBoard(context: vscode.ExtensionContext) {
  const allBoards = getAllBoards();
  if (allBoards === undefined) {
    return;
  }

  const existingNames: string[] = getExistingNames(allBoards);

  const name = await getInputName(existingNames);
  if (name === undefined) {
    return;
  }

  saveBoard(getEmptyBoard(name));
  ReactPanel.createOrShow(context, name);
}

async function openKanbanBoard(context: vscode.ExtensionContext) {
  const configPath = getConfigPath();
  if (configPath === undefined) {
    return;
  }

  const allBoards = getAllBoards();
  if (allBoards === undefined) {
    return;
  }

  const existingNames: string[] = getExistingNames(allBoards);
  if (existingNames.length === 0) {
    vscode.window.showInformationMessage(`Shareable Kanban boards: no saved boards exist in "${configPath}".`);
    return;
  }

  const name = await getSelectedName(existingNames);
  if (name === undefined) {
    return;
  }

  ReactPanel.createOrShow(context, name);
}

async function deleteKanbanBoard() {
  const configPath = getConfigPath();
  if (configPath === undefined) {
    return;
  }

  const allBoards = getAllBoards();
  if (allBoards === undefined) {
    return;
  }

  const existingNames: string[] = getExistingNames(allBoards);
  if (existingNames.length === 0) {
    return;
  }

  const name = await getSelectedName(existingNames);
  if (name === undefined) {
    return;
  }

  const boards = getAllBoards();
  if (name in boards === false) {
    return;
  }
  delete boards[name];
  saveAllBoards(boards);
  vscode.window.showInformationMessage(`Shareable Kanban boards: Removed board '${name}'`);
}
