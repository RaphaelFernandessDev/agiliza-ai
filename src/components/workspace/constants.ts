import { MarkerTone, TaskPriority, TaskStatus } from "@/components/workspace/types";

// Chaves de persistência local do app.
export const STORAGE_KEY = "agiliza-ai-workspace-v2";
export const THEME_KEY = "agiliza-ai-theme-v1";
export const ACCENT_KEY = "agiliza-ai-accent-v1";

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
  low: { label: "Baixa", badge: "bg-slate-100 text-slate-700 border-slate-200" },
  medium: { label: "Media", badge: "bg-amber-50 text-amber-700 border-amber-200" },
  high: { label: "Alta", badge: "bg-rose-50 text-rose-700 border-rose-200" },
};

export const markerMeta: Record<MarkerTone, { label: string; strip: string }> = {
  none: { label: "Sem marcador", strip: "bg-transparent" },
  sky: { label: "Azul", strip: "bg-sky-500" },
  emerald: { label: "Verde", strip: "bg-emerald-500" },
  amber: { label: "Amarelo", strip: "bg-amber-500" },
  rose: { label: "Rosa", strip: "bg-rose-500" },
  violet: { label: "Violeta", strip: "bg-violet-500" },
};

