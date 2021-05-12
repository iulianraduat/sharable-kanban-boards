export type TJson = Record<string, TBoard>;

export interface TBoard {
  allowedSources: Record<string, string[]>;
  name: string;
  statuses: string[];
  tags: string[];
  tasks: TTask[];
}

enum TaskRelation {
  /* The other ticket must be started for this ticket to start */
  STARTED_TO_START,
  /* The other ticket must be started for this ticket to end */
  STARTED_TO_FINISH,
  /* The other ticket must be completed for this ticket to start */
  FINISHED_TO_START,
  /* This ticket can’t end unless the other ticket has ended */
  FINISHED_TO_FINISH,
  /* It is a subtask of the other task */
  SUBTASK_OF,
  /* It is related in an unknown mode */
  RELATES_TO,
}

export interface TTask {
  assignees?: string[];
  comments?: TComment[];
  dependOn?: string[];
  description?: string;
  dueDate?: Date;
  id: string;
  /* 1 (lowest) - 2 (low) - 3 (normal)[default] - 4 (high) - 5 (highest) */
  priority: number;
  /* 0 - 100 */
  progress?: number;
  /* it is set when we move in a new column and there is no progress set OR the progress is set to 0  */
  startDate?: Date;
  /* it is a column id */
  status: string;
  tags?: string[];
  title: string;
}

interface TComment {
  by: string;
  on: Date;
  text: string;
}
