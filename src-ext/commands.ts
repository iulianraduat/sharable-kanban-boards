import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { TBoard, TJson, TTask } from './types';

const emptyBoard: TBoard = {
  name: '',
  statuses: ['Backlog', 'To do', 'In progress', 'Review', 'Done'],
  allowedSources: {
    Backlog: ['To do'],
    'To do': ['Backlog', 'In progress'],
    'In progress': ['Backlog', 'To do', 'Review'],
    Review: ['In progress'],
    Done: ['Review'],
  },
  tags: [],
  tasks: [],
};

const demoTags = ['Epic', 'Story', 'Task', 'Subtask', 'Bug', 'Blocked'];

const demoTasks: TTask[] = [
  {
    id: 'f037e9b4ec0d417f9c69dc8929f69700',
    title: 'Shareable Kanban board',
    status: 'In progress',
    tags: ['Story'],
    priority: 3,
    description: 'Using shareable Kanban board',
    assignees: ['Me', 'Team'],
    dependOn: [
      'f037e9b4ec0d417f9c69dc8929f69701',
      'f037e9b4ec0d417f9c69dc8929f69703',
      'f037e9b4ec0d417f9c69dc8929f69704',
    ],
  },
  {
    id: 'f037e9b4ec0d417f9c69dc8929f69701',
    title: 'Install the "Shareable Kanban board" extension',
    status: 'Done',
    tags: ['Task'],
    priority: 5,
    description: 'Shareable Kanban board is available inside of Visual Studio Code',
    assignees: ['Me'],
    comments: [
      {
        by: 'Me',
        on: new Date('2021-05-05'),
        text: 'An amazing product',
      },
    ],
  },
  {
    id: 'f037e9b4ec0d417f9c69dc8929f69702',
    title: 'Learn advanced use of the shareable Kanban board',
    status: 'Backlog',
    tags: ['Task'],
    priority: 2,
    description: 'At the end I will know how to use efficiently this board',
    assignees: ['Me'],
  },
  {
    id: 'f037e9b4ec0d417f9c69dc8929f69703',
    title: 'Learn using the shareable Kanban board',
    status: 'In progress',
    tags: ['Task'],
    priority: 3,
    description: 'At the end I will know how to use efficiently this board',
    assignees: ['Me', 'Team'],
  },
  {
    id: 'f037e9b4ec0d417f9c69dc8929f69704',
    title: 'Learn to use the filtering of tasks in shareable Kanban board',
    status: 'To do',
    tags: ['Task'],
    priority: 4,
    description:
      'At the end I will know how to find tickets according to different criterion:\n* assignee:\n  * assignee: partial user name\n* comment:\n  * comment: partial phrase\n* dependency:\n  * dependency: partial ticket name\n* done:\n  * done: today\n  * done: 3d\n* due:\n  * due: tomorrow\n  * due: 10d\n* priority:\n  * priority: priority_name\n* progress:\n  * progress: 25%\n  * progress: ?%\n* status:\n  * status: status name\n* tag:\n  * tag: partial tag name\n\nAlso that each criterion makes the selection even finer.',
    assignees: ['Me', 'Team'],
  },
];

const emptyJson: TJson = {
  'Demo board': {
    ...emptyBoard,
    name: 'Demo board',
    tags: demoTags,
    tasks: demoTasks,
  },
};

export function getAllBoards(): TJson | undefined {
  const configPath = getConfigPath();
  if (configPath === undefined) {
    return;
  }

  try {
    const content = fs.readFileSync(configPath, 'utf8');
    const boards: TJson = JSON.parse(content);
    return boards;
  } catch (err) {
    fs.writeFileSync(configPath, JSON.stringify(emptyJson, null, 2));
    return emptyJson;
  }
}

export function getBoard(name: string): TBoard | undefined {
  const configPath = getConfigPath();
  if (configPath === undefined) {
    return;
  }

  try {
    const boards = getAllBoards();
    const board: TBoard | undefined = boards?.[name];
    if (board !== undefined) {
      return board;
    }

    return getEmptyBoard(name);
  } catch (e) {
    return getEmptyBoard(name);
  }
}

export function getEmptyBoard(name: string): TBoard {
  return { ...emptyBoard, name };
}

export function saveBoard(board: TBoard) {
  const configPath = getConfigPath();
  if (configPath === undefined) {
    return;
  }

  const allBoards = getAllBoards();
  if (allBoards === undefined) {
    return;
  }

  const newAllBoards = { ...allBoards, [board.name]: board };
  saveAllBoards(newAllBoards);
}

export function saveAllBoards(boards: TJson) {
  const configPath = getConfigPath();
  if (configPath === undefined) {
    return;
  }

  fs.writeFileSync(configPath, JSON.stringify(boards, replacer, 2));
}

function replacer(key: string, value: any): any {
  switch (key) {
    case 'dueDate':
    case 'on':
    case 'startDate':
      return typeof value === 'string' ? value : formatDate(value);
    default:
      return value;
  }
}

function formatDate(date: Date): string {
  /* yyyy-MM-dd */
  const year = date.getFullYear();
  const month = date.getFullYear();
  const day = date.getFullYear();
  return `${year}-${to2digits(month)}-${to2digits(day)}`;
}

function to2digits(value: number): string {
  return value.toLocaleString('en-US', {
    minimumIntegerDigits: 2,
    useGrouping: false,
  });
}

export function getConfigPath(): string | undefined {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (workspaceFolders === undefined || workspaceFolders.length === 0) {
    return;
  }

  const rootPath = workspaceFolders[0].uri.fsPath;
  const vscodePath = `${rootPath}${path.sep}.vscode`;
  if (fs.existsSync(vscodePath) === false) {
    fs.mkdirSync(vscodePath);
  }
  return `${vscodePath}${path.sep}shareable-kanban-boards.json`;
}

export function getExistingNames(allBoards: TJson) {
  return Object.keys(allBoards);
}

export async function getInputName(existingNames: string[]) {
  const name = await vscode.window.showInputBox({
    placeHolder: 'Name of this new Kanban board',
    validateInput: (value: string) => getValidateInput(value, existingNames),
  });
  return name;
}

function getValidateInput(
  value: string,
  existingNames: string[]
): string | undefined | null | Thenable<string | undefined | null> {
  return existingNames.includes(value) ? 'This name is already used' : null;
}

export async function getSelectedName(existingNames: string[]) {
  const name = await vscode.window.showQuickPick(existingNames, {
    placeHolder: 'Name of an existing Kanban board',
    canPickMany: false,
  });
  return name;
}
