import { MarkerTone, TaskPriority, TaskStatus } from "@/components/workspace/types";

// Chaves de persistência local do app.
export const STORAGE_KEY = "agiliza-ai-workspace-v2";
export const THEME_KEY = "agiliza-ai-theme-v1";
export const ACCENT_KEY = "agiliza-ai-accent-v1";
export const UI_PREFS_KEY = "agiliza-ai-ui-prefs-v1";
export const AUTH_SESSION_KEY = "agiliza-ai-auth-user-v1";

// Opções globais usadas em vários controles.
export const members = ["Raphael", "Ana", "Bruno", "Camila", "Diego"];
export const statusOptions: TaskStatus[] = ["backlog", "in_progress", "review", "done"];
export const markerOptions: MarkerTone[] = ["none", "sky", "emerald", "amber", "rose", "violet"];

export const statusMeta: Record<TaskStatus, { label: string; tone: string }> = {
  backlog: { label: "Backlog", tone: "text-slate-600" },
  in_progress: { label: "Em andamento", tone: "text-[var(--accent-700)]" },
  review: { label: "Revisao", tone: "text-amber-400" },
  done: { label: "Concluido", tone: "text-emerald-700" },
};

export const priorityMeta: Record<TaskPriority, { label: string; badge: string }> = {
  low: { label: "Baixa", badge: "priority-badge priority-badge-low" },
  medium: { label: "Media", badge: "priority-badge priority-badge-medium" },
  high: { label: "Alta", badge: "priority-badge priority-badge-high" },
};

export const markerMeta: Record<MarkerTone, { label: string; strip: string }> = {
  none: { label: "Sem marcador", strip: "bg-transparent" },
  sky: { label: "Azul", strip: "bg-sky-500" },
  emerald: { label: "Verde", strip: "bg-emerald-500" },
  amber: { label: "Amarelo", strip: "bg-amber-500" },
  rose: { label: "Rosa", strip: "bg-rose-500" },
  violet: { label: "Violeta", strip: "bg-violet-500" },
};

