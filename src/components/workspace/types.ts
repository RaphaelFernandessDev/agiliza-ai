// Tipos centrais do domínio do workspace.
export type TaskStatus = "backlog" | "in_progress" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high";
export type ViewMode = "board" | "list" | "timeline" | "calendar";
export type AppArea = "home" | "my_tasks" | "reports";

export type Holiday = { date: string; name: string; optional?: boolean };

export type ThemeMode = "light" | "dark";
export type AccentMode =
  | "modern_blue"
  | "neon_purple"
  | "minimal_green"
  | "vibrant_orange"
  | "elegant_gray"
  | "cyan_tech";

export type QuickFilter = "all" | "overdue" | "high_priority" | "no_due";
export type ListGroupBy = "none" | "status" | "assignee";
export type MarkerTone = "none" | "sky" | "emerald" | "amber" | "rose" | "violet";

export type Subtask = { id: string; title: string; done: boolean };
export type TaskComment = {
  id: string;
  author: string;
  text: string;
  createdAt: string;
  mentions: string[];
};

export type Task = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  assignee: string;
  marker: MarkerTone;
  checklist: Subtask[];
  blockedBy: string[];
  comments: TaskComment[];
  activity: string[];
  labels: string[];
  createdAt: string;
  updatedAt: string;
};

export type Project = {
  id: string;
  name: string;
  description: string;
  accent: string;
  tasks: Task[];
};

export type WorkspaceState = {
  projects: Project[];
  activeProjectId: string;
};

