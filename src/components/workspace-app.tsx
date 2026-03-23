"use client";

import { FormEvent, Fragment, useEffect, useMemo, useRef, useState } from "react";

type TaskStatus = "backlog" | "in_progress" | "review" | "done";
type TaskPriority = "low" | "medium" | "high";
type ViewMode = "board" | "list" | "timeline" | "calendar";
type AppArea = "home" | "my_tasks" | "reports";
type Holiday = { date: string; name: string; optional?: boolean };
type ThemeMode = "light" | "dark";
type AccentMode =
  | "modern_blue"
  | "neon_purple"
  | "minimal_green"
  | "vibrant_orange"
  | "elegant_gray"
  | "cyan_tech";
type QuickFilter = "all" | "overdue" | "high_priority" | "no_due";
type ListGroupBy = "none" | "status" | "assignee";
type MarkerTone = "none" | "sky" | "emerald" | "amber" | "rose" | "violet";
type Subtask = { id: string; title: string; done: boolean };
type TaskComment = { id: string; author: string; text: string; createdAt: string; mentions: string[] };

type Task = {
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

type Project = {
  id: string;
  name: string;
  description: string;
  accent: string;
  tasks: Task[];
};

type WorkspaceState = {
  projects: Project[];
  activeProjectId: string;
};

const STORAGE_KEY = "agiliza-ai-workspace-v2";
const THEME_KEY = "agiliza-ai-theme-v1";
const ACCENT_KEY = "agiliza-ai-accent-v1";
const members = ["Raphael", "Ana", "Bruno", "Camila", "Diego"];
const statusOptions: TaskStatus[] = ["backlog", "in_progress", "review", "done"];
const markerOptions: MarkerTone[] = ["none", "sky", "emerald", "amber", "rose", "violet"];

const statusMeta: Record<TaskStatus, { label: string; tone: string }> = {
  backlog: { label: "Backlog", tone: "text-slate-600" },
  in_progress: { label: "Em andamento", tone: "text-[var(--accent-700)]" },
  review: { label: "Revisao", tone: "text-amber-400" },
  done: { label: "Concluido", tone: "text-emerald-700" },
};

const priorityMeta: Record<TaskPriority, { label: string; badge: string }> = {
  low: { label: "Baixa", badge: "bg-slate-100 text-slate-700 border-slate-200" },
  medium: { label: "Media", badge: "bg-amber-50 text-amber-700 border-amber-200" },
  high: { label: "Alta", badge: "bg-rose-50 text-rose-700 border-rose-200" },
};

const markerMeta: Record<MarkerTone, { label: string; strip: string }> = {
  none: { label: "Sem marcador", strip: "bg-transparent" },
  sky: { label: "Azul", strip: "bg-sky-500" },
  emerald: { label: "Verde", strip: "bg-emerald-500" },
  amber: { label: "Amarelo", strip: "bg-amber-500" },
  rose: { label: "Rosa", strip: "bg-rose-500" },
  violet: { label: "Violeta", strip: "bg-violet-500" },
};

const initialWorkspace: WorkspaceState = {
  activeProjectId: "proj-ops",
  projects: [
    {
      id: "proj-ops",
      name: "Operacao",
      description: "Fluxo diario da equipe de operacoes.",
      accent: "from-cyan-300 to-blue-400",
      tasks: [
        {
          id: "task-1",
          title: "Refinar playbook de atendimento",
          description: "Padronizar respostas para tickets com SLA de 4h.",
          status: "in_progress",
          priority: "high",
          dueDate: "2026-03-18",
          assignee: "Ana",
          marker: "rose",
          checklist: [
            { id: "sub-1", title: "Revisar base de respostas", done: true },
            { id: "sub-2", title: "Validar fluxo com lider", done: false },
          ],
          blockedBy: [],
          comments: [{ id: "c-1", author: "Raphael", text: "Validar com @Ana e @Bruno antes da publicacao.", createdAt: "2026-03-16", mentions: ["Ana", "Bruno"] }],
          activity: ["2026-03-15: tarefa criada"],
          labels: ["SLA", "Suporte"],
          createdAt: "2026-03-15",
          updatedAt: "2026-03-16",
        },
        {
          id: "task-2",
          title: "Consolidar dashboard semanal",
          description: "Unificar metricas de volume, tempo medio e backlog.",
          status: "review",
          priority: "medium",
          dueDate: "2026-03-19",
          assignee: "Bruno",
          marker: "amber",
          checklist: [{ id: "sub-3", title: "Consolidar metricas BI", done: true }],
          blockedBy: ["task-1"],
          comments: [],
          activity: ["2026-03-14: tarefa criada"],
          labels: ["BI", "KPI"],
          createdAt: "2026-03-14",
          updatedAt: "2026-03-16",
        },
        {
          id: "task-3",
          title: "Atualizar base de macros",
          description: "Remover templates antigos e validar 12 novos atalhos.",
          status: "backlog",
          priority: "low",
          dueDate: "",
          assignee: "Camila",
          marker: "sky",
          checklist: [],
          blockedBy: [],
          comments: [],
          activity: ["2026-03-13: tarefa criada"],
          labels: ["Base"],
          createdAt: "2026-03-13",
          updatedAt: "2026-03-13",
        },
      ],
    },
    {
      id: "proj-product",
      name: "Produto",
      description: "Roadmap e desenvolvimento do Agiliza Ai.",
      accent: "from-emerald-300 to-cyan-400",
      tasks: [
        {
          id: "task-4",
          title: "Definir onboarding inteligente",
          description: "Primeira experiencia com sugestoes de projeto por perfil.",
          status: "backlog",
          priority: "high",
          dueDate: "2026-03-22",
          assignee: "Raphael",
          marker: "violet",
          checklist: [{ id: "sub-4", title: "Mapear perfis de usuario", done: false }],
          blockedBy: [],
          comments: [],
          activity: ["2026-03-15: tarefa criada"],
          labels: ["UX", "IA"],
          createdAt: "2026-03-15",
          updatedAt: "2026-03-16",
        },
        {
          id: "task-5",
          title: "Tela de relatorios executivos",
          description: "Visao consolidada para lideranca com indicadores de entrega.",
          status: "done",
          priority: "medium",
          dueDate: "2026-03-16",
          assignee: "Diego",
          marker: "emerald",
          checklist: [],
          blockedBy: [],
          comments: [],
          activity: ["2026-03-13: tarefa criada", "2026-03-16: marcada como concluida"],
          labels: ["Dashboard"],
          createdAt: "2026-03-13",
          updatedAt: "2026-03-16",
        },
      ],
    },
  ],
};

function todayIso(): string {
  return new Date().toISOString().split("T")[0] ?? "";
}

function toIsoDate(year: number, month: number, day: number): string {
  const mm = String(month + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function parseIsoDate(iso: string): Date | null {
  if (!iso) return null;
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function diffInDays(start: Date, end: Date): number {
  const dayMs = 1000 * 60 * 60 * 24;
  const utcStart = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const utcEnd = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.floor((utcEnd - utcStart) / dayMs);
}

function normalizeMentionHandle(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function extractMentions(text: string): string[] {
  const mentionTokens = text.match(/@[A-Za-zÀ-ÿ0-9_]+/g) ?? [];
  const byHandle = new Map(members.map((member) => [normalizeMentionHandle(member), member]));
  const resolved = mentionTokens
    .map((token) => token.slice(1))
    .map((handle) => byHandle.get(normalizeMentionHandle(handle)))
    .filter(Boolean) as string[];
  return Array.from(new Set(resolved));
}

function normalizeWorkspace(input: WorkspaceState): WorkspaceState {
  return {
    ...input,
    projects: input.projects.map((project) => ({
      ...project,
      tasks: project.tasks.map((task) => {
        const checklist = Array.isArray(task.checklist) ? task.checklist : [];
        const blockedBy = Array.isArray(task.blockedBy) ? task.blockedBy : [];
        const comments = Array.isArray(task.comments)
          ? task.comments.map((comment) => ({
              ...comment,
              mentions: Array.isArray(comment.mentions) ? comment.mentions : extractMentions(comment.text ?? ""),
            }))
          : [];
        const activity = Array.isArray(task.activity) ? task.activity : [];
        return {
          ...task,
          marker: task.marker ?? "none",
          checklist,
          blockedBy,
          comments,
          activity,
        };
      }),
    })),
  };
}

function getEasterDate(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function getBrazilNationalHolidays(year: number): Holiday[] {
  const easter = getEasterDate(year);
  const carnivalMonday = addDays(easter, -48);
  const carnivalTuesday = addDays(easter, -47);
  const goodFriday = addDays(easter, -2);
  const corpusChristi = addDays(easter, 60);

  return [
    { date: toIsoDate(year, 0, 1), name: "Confraternizacao Universal" },
    { date: toIsoDate(year, 3, 21), name: "Tiradentes" },
    { date: toIsoDate(year, 4, 1), name: "Dia do Trabalhador" },
    { date: toIsoDate(year, 8, 7), name: "Independencia do Brasil" },
    { date: toIsoDate(year, 9, 12), name: "Nossa Senhora Aparecida" },
    { date: toIsoDate(year, 10, 2), name: "Finados" },
    { date: toIsoDate(year, 10, 15), name: "Proclamacao da Republica" },
    { date: toIsoDate(year, 10, 20), name: "Consciencia Negra" },
    { date: toIsoDate(year, 11, 25), name: "Natal" },
    { date: toIsoDate(carnivalMonday.getFullYear(), carnivalMonday.getMonth(), carnivalMonday.getDate()), name: "Carnaval (segunda)", optional: true },
    { date: toIsoDate(carnivalTuesday.getFullYear(), carnivalTuesday.getMonth(), carnivalTuesday.getDate()), name: "Carnaval (terca)", optional: true },
    { date: toIsoDate(goodFriday.getFullYear(), goodFriday.getMonth(), goodFriday.getDate()), name: "Sexta-feira Santa" },
    { date: toIsoDate(easter.getFullYear(), easter.getMonth(), easter.getDate()), name: "Pascoa", optional: true },
    { date: toIsoDate(corpusChristi.getFullYear(), corpusChristi.getMonth(), corpusChristi.getDate()), name: "Corpus Christi", optional: true },
  ];
}

export default function Home() {
  const [workspace, setWorkspace] = useState<WorkspaceState>(initialWorkspace);
  const [storageReady, setStorageReady] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("board");
  const [appArea, setAppArea] = useState<AppArea>("home");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | TaskStatus>("all");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [markerFilter, setMarkerFilter] = useState<"all" | MarkerTone>("all");
  const [listGroupBy, setListGroupBy] = useState<ListGroupBy>("status");
  const [collapsedListGroups, setCollapsedListGroups] = useState<Record<string, boolean>>({});
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [draggedTaskId, setDraggedTaskId] = useState("");
  const [dropTargetStatus, setDropTargetStatus] = useState<TaskStatus | "">("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>("medium");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState(members[0]);
  const [newTaskMarker, setNewTaskMarker] = useState<MarkerTone>("none");
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [newCommentText, setNewCommentText] = useState("");
  const [taskWarning, setTaskWarning] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");
  const [accentMode, setAccentMode] = useState<AccentMode>("modern_blue");
  const quickTaskInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      queueMicrotask(() => setStorageReady(true));
      return;
    }
    try {
      const parsed = JSON.parse(raw) as WorkspaceState;
      if (parsed?.projects?.length) queueMicrotask(() => setWorkspace(normalizeWorkspace(parsed)));
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      queueMicrotask(() => setStorageReady(true));
    }
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
  }, [workspace, storageReady]);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(THEME_KEY) as ThemeMode | null;
    const savedAccentRaw = window.localStorage.getItem(ACCENT_KEY);
    if (savedTheme === "light" || savedTheme === "dark") setThemeMode(savedTheme);
    const accentMap: Record<string, AccentMode> = {
      blue: "modern_blue",
      emerald: "minimal_green",
      rose: "vibrant_orange",
      violet: "neon_purple",
      modern_blue: "modern_blue",
      neon_purple: "neon_purple",
      minimal_green: "minimal_green",
      vibrant_orange: "vibrant_orange",
      elegant_gray: "elegant_gray",
      cyan_tech: "cyan_tech",
    };
    if (savedAccentRaw && accentMap[savedAccentRaw]) {
      setAccentMode(accentMap[savedAccentRaw]);
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", themeMode);
    document.documentElement.setAttribute("data-accent", accentMode);
    window.localStorage.setItem(THEME_KEY, themeMode);
    window.localStorage.setItem(ACCENT_KEY, accentMode);
  }, [themeMode, accentMode]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedTaskId("");
      if (
        event.key === "/" &&
        document.activeElement &&
        !["INPUT", "TEXTAREA", "SELECT"].includes((document.activeElement as HTMLElement).tagName)
      ) {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const activeProject = useMemo(() => {
    const byId = workspace.projects.find((project) => project.id === workspace.activeProjectId);
    return byId ?? workspace.projects[0] ?? null;
  }, [workspace]);

  const filteredTasks = useMemo(() => {
    if (!activeProject) return [];
    return activeProject.tasks.filter((task) => {
      const matchesQuery =
        query.trim().length === 0 ||
        task.title.toLowerCase().includes(query.toLowerCase()) ||
        task.description.toLowerCase().includes(query.toLowerCase()) ||
        task.labels.join(" ").toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === "all" || task.status === statusFilter;
      const matchesArea = appArea !== "my_tasks" || task.assignee === "Raphael";
      const isOverdue = !!task.dueDate && task.dueDate < todayIso() && task.status !== "done";
      const matchesQuickFilter =
        quickFilter === "all" ||
        (quickFilter === "overdue" && isOverdue) ||
        (quickFilter === "high_priority" && task.priority === "high" && task.status !== "done") ||
        (quickFilter === "no_due" && !task.dueDate);
      const matchesMarker = markerFilter === "all" || task.marker === markerFilter;
      return matchesQuery && matchesStatus && matchesArea && matchesQuickFilter && matchesMarker;
    });
  }, [activeProject, query, statusFilter, appArea, quickFilter, markerFilter]);

  const selectedTask = useMemo(() => {
    if (!activeProject) return null;
    return activeProject.tasks.find((task) => task.id === selectedTaskId) ?? null;
  }, [activeProject, selectedTaskId]);

  const metrics = useMemo(() => {
    if (!activeProject) return { total: 0, done: 0, dueToday: 0, highOpen: 0 };
    const total = filteredTasks.length;
    const done = filteredTasks.filter((task) => task.status === "done").length;
    const dueToday = filteredTasks.filter((task) => task.dueDate === todayIso() && task.status !== "done").length;
    const highOpen = filteredTasks.filter((task) => task.priority === "high" && task.status !== "done").length;
    return { total, done, dueToday, highOpen };
  }, [activeProject, filteredTasks]);

  const aiSuggestion = useMemo(() => {
    if (!activeProject) return "Sem projeto ativo.";
    if (metrics.highOpen > 2) return "Muitas prioridades altas abertas. Foque nas duas mais criticas.";
    if (metrics.dueToday > 0) return "Voce tem entregas para hoje. Resolva bloqueios antes de novas entradas.";
    return "Fluxo estavel. Mantenha backlog refinado para preservar previsibilidade.";
  }, [activeProject, metrics.highOpen, metrics.dueToday]);
  const selectedTaskBlocking = useMemo(() => {
    if (!activeProject || !selectedTask) return [];
    return getBlockingTasks(selectedTask, activeProject);
  }, [activeProject, selectedTask]);
  const selectedChecklistProgress = useMemo(() => {
    if (!selectedTask) return { done: 0, total: 0 };
    return getChecklistProgress(selectedTask);
  }, [selectedTask]);
  const groupedListTasks = useMemo(() => {
    if (listGroupBy === "none") {
      return [{ key: "all", label: "Todas as tarefas", tasks: filteredTasks }];
    }
    if (listGroupBy === "status") {
      return statusOptions.map((status) => ({
        key: `status:${status}`,
        label: statusMeta[status].label,
        tasks: filteredTasks.filter((task) => task.status === status),
      }));
    }
    return members
      .map((member) => ({
        key: `assignee:${member}`,
        label: member,
        tasks: filteredTasks.filter((task) => task.assignee === member),
      }))
      .filter((group) => group.tasks.length > 0 || filteredTasks.length === 0);
  }, [filteredTasks, listGroupBy]);

  function withActiveProject(updater: (project: Project) => Project) {
    setWorkspace((current) => {
      const fallbackProject = current.projects[0];
      const activeId = current.projects.some((project) => project.id === current.activeProjectId)
        ? current.activeProjectId
        : fallbackProject?.id;
      if (!activeId) return current;
      return {
        ...current,
        activeProjectId: activeId,
        projects: current.projects.map((project) => (project.id === activeId ? updater(project) : project)),
      };
    });
  }

  function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newTaskTitle.trim()) return;
    const now = todayIso();
    const task: Task = {
      id: crypto.randomUUID(),
      title: newTaskTitle.trim(),
      description: "",
      status: "backlog",
      priority: newTaskPriority,
      dueDate: newTaskDueDate,
      assignee: newTaskAssignee,
      marker: newTaskMarker,
      checklist: [],
      blockedBy: [],
      comments: [],
      activity: [`${now}: tarefa criada`],
      labels: [],
      createdAt: now,
      updatedAt: now,
    };

    withActiveProject((project) => ({ ...project, tasks: [task, ...project.tasks] }));
    setSelectedTaskId(task.id);
    setNewTaskTitle("");
    setNewTaskDueDate("");
    setNewTaskPriority("medium");
    setNewTaskAssignee(members[0]);
    setNewTaskMarker("none");
  }

  function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newProjectName.trim()) return;
    const project: Project = {
      id: crypto.randomUUID(),
      name: newProjectName.trim(),
      description: "Novo projeto criado no Agiliza Ai.",
      accent: "from-orange-300 to-rose-400",
      tasks: [],
    };
    setWorkspace((current) => ({ ...current, activeProjectId: project.id, projects: [project, ...current.projects] }));
    setNewProjectName("");
    setSelectedTaskId("");
  }

  function updateTask(taskId: string, patch: Partial<Task>) {
    withActiveProject((project) => ({
      ...project,
      tasks: project.tasks.map((task) => (task.id === taskId ? { ...task, ...patch, updatedAt: todayIso() } : task)),
    }));
  }

  function appendActivity(taskId: string, message: string) {
    withActiveProject((project) => ({
      ...project,
      tasks: project.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              activity: [`${todayIso()}: ${message}`, ...task.activity].slice(0, 30),
              updatedAt: todayIso(),
            }
          : task,
      ),
    }));
  }

  function getBlockingTasks(task: Task, project: Project): Task[] {
    if (task.blockedBy.length === 0) return [];
    return project.tasks.filter((candidate) => task.blockedBy.includes(candidate.id) && candidate.status !== "done");
  }

  function getChecklistProgress(task: Task): { done: number; total: number } {
    const total = task.checklist.length;
    const done = task.checklist.filter((item) => item.done).length;
    return { done, total };
  }

  function changeTaskStatus(taskId: string, status: TaskStatus) {
    if (!activeProject) return;
    const task = activeProject.tasks.find((item) => item.id === taskId);
    if (!task || task.status === status) return;
    if (status === "done") {
      const blockingTasks = getBlockingTasks(task, activeProject);
      if (blockingTasks.length > 0) {
        setTaskWarning(`A tarefa "${task.title}" ainda depende de: ${blockingTasks.map((item) => item.title).join(", ")}.`);
        return;
      }
      const pendingSubtasks = task.checklist.filter((item) => !item.done).length;
      if (pendingSubtasks > 0) {
        setTaskWarning(`Finalize ${pendingSubtasks} subtarefa(s) pendente(s) antes de concluir "${task.title}".`);
        return;
      }
    }
    setTaskWarning("");
    updateTask(taskId, { status });
    appendActivity(taskId, `status alterado para ${statusMeta[status].label}`);
  }

  function toggleTaskDone(task: Task) {
    if (task.status === "done") {
      changeTaskStatus(task.id, "in_progress");
      return;
    }
    changeTaskStatus(task.id, "done");
  }

  function addSubtask(taskId: string) {
    const title = newSubtaskTitle.trim();
    if (!title) return;
    withActiveProject((project) => ({
      ...project,
      tasks: project.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              checklist: [...task.checklist, { id: crypto.randomUUID(), title, done: false }],
              updatedAt: todayIso(),
            }
          : task,
      ),
    }));
    setNewSubtaskTitle("");
    appendActivity(taskId, "subtarefa adicionada");
  }

  function toggleSubtask(taskId: string, subtaskId: string) {
    withActiveProject((project) => ({
      ...project,
      tasks: project.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              checklist: task.checklist.map((item) => (item.id === subtaskId ? { ...item, done: !item.done } : item)),
              updatedAt: todayIso(),
            }
          : task,
      ),
    }));
    appendActivity(taskId, "checklist atualizada");
  }

  function removeSubtask(taskId: string, subtaskId: string) {
    withActiveProject((project) => ({
      ...project,
      tasks: project.tasks.map((task) =>
        task.id === taskId
          ? { ...task, checklist: task.checklist.filter((item) => item.id !== subtaskId), updatedAt: todayIso() }
          : task,
      ),
    }));
    appendActivity(taskId, "subtarefa removida");
  }

  function addComment(taskId: string) {
    const text = newCommentText.trim();
    if (!text) return;
    const mentions = extractMentions(text);
    withActiveProject((project) => ({
      ...project,
      tasks: project.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              comments: [{ id: crypto.randomUUID(), author: "Raphael", text, createdAt: todayIso(), mentions }, ...task.comments],
              updatedAt: todayIso(),
            }
          : task,
      ),
    }));
    setNewCommentText("");
    appendActivity(taskId, mentions.length > 0 ? `comentario com mencao para ${mentions.join(", ")}` : "comentario adicionado");
  }

  function duplicateTask(taskId: string) {
    if (!activeProject) return;
    const source = activeProject.tasks.find((task) => task.id === taskId);
    if (!source) return;
    const now = todayIso();
    const clone: Task = {
      ...source,
      id: crypto.randomUUID(),
      title: `${source.title} (copia)`,
      status: "backlog",
      blockedBy: [],
      comments: [],
      activity: [`${now}: tarefa duplicada de "${source.title}"`],
      createdAt: now,
      updatedAt: now,
    };
    withActiveProject((project) => ({ ...project, tasks: [clone, ...project.tasks] }));
    setSelectedTaskId(clone.id);
  }

  function removeTask(taskId: string) {
    withActiveProject((project) => ({
      ...project,
      tasks: project.tasks
        .filter((task) => task.id !== taskId)
        .map((task) => ({ ...task, blockedBy: task.blockedBy.filter((blockedId) => blockedId !== taskId) })),
    }));
    if (selectedTaskId === taskId) setSelectedTaskId("");
  }

  function handleColumnDrop(status: TaskStatus) {
    if (!draggedTaskId || !activeProject) return;
    const draggedTask = activeProject.tasks.find((task) => task.id === draggedTaskId);
    if (!draggedTask || draggedTask.status === status) {
      setDraggedTaskId("");
      setDropTargetStatus("");
      return;
    }
    changeTaskStatus(draggedTaskId, status);
    setDraggedTaskId("");
    setDropTargetStatus("");
  }

  if (!storageReady) {
    return <main className="flex min-h-screen w-full items-center justify-center px-4"><div className="glass-panel rounded-xl px-6 py-4 text-sm text-slate-600">Carregando workspace...</div></main>;
  }
  if (!activeProject) {
    return <main className="flex min-h-screen w-full items-center justify-center px-4"><div className="glass-panel rounded-xl px-6 py-4 text-sm text-slate-700">Nenhum projeto disponivel.</div></main>;
  }

  return (
    <main className="app-shell min-h-screen w-full">
      <div className="flex min-h-screen flex-col">
        <TopBar
          projectName={activeProject.name}
          themeMode={themeMode}
          accentMode={accentMode}
          onThemeChange={setThemeMode}
          onAccentChange={setAccentMode}
          onQuickAdd={() => {
            setViewMode("board");
            setTimeout(() => quickTaskInputRef.current?.focus(), 0);
          }}
        />
        <div className="flex min-h-0 flex-1">
          <aside className="glass-surface hidden w-[272px] shrink-0 border-r border-slate-200 lg:flex lg:flex-col">
            <div className="border-b border-slate-200 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Workspace</p>
              <h1 className="mt-1 text-xl font-semibold text-slate-900">Agiliza Ai</h1>
            </div>
            <nav className="space-y-1 p-3">
              <SideNavButton label="Inicio" active={appArea === "home"} onClick={() => setAppArea("home")} />
              <SideNavButton label="Minhas tarefas" active={appArea === "my_tasks"} onClick={() => setAppArea("my_tasks")} />
              <SideNavButton label="Relatorios" active={appArea === "reports"} onClick={() => setAppArea("reports")} />
            </nav>
            <form className="border-t border-slate-200 px-4 py-3" onSubmit={createProject}>
              <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Novo projeto</label>
              <input className="ui-control mt-2 w-full rounded-lg" placeholder="Ex: Marketing" value={newProjectName} onChange={(event) => setNewProjectName(event.target.value)} />
              <button type="submit" className="ui-btn ui-btn-ghost mt-2 w-full rounded-lg px-3 py-2 text-sm">Criar projeto</button>
            </form>
            <div className="min-h-0 flex-1 space-y-1 overflow-auto px-3 pb-3 pt-2">
              {workspace.projects.map((project) => {
                const active = project.id === activeProject.id;
                return <button key={project.id} type="button" onClick={() => { setWorkspace((current) => ({ ...current, activeProjectId: project.id })); setSelectedTaskId(""); }} className={`w-full rounded-lg border px-3 py-2 text-left transition ${active ? "border-[var(--accent-300)] bg-[var(--accent-soft)]" : "border-transparent bg-transparent hover:border-slate-200 hover:bg-slate-50"}`}><div className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full bg-gradient-to-r ${project.accent}`} /><p className="text-sm font-medium text-slate-800">{project.name}</p></div><p className="mt-0.5 text-xs text-slate-500">{project.tasks.length} tarefas</p></button>;
              })}
            </div>
          </aside>
          <section className="glass-soft flex min-w-0 flex-1 flex-col">
            <header className="glass-surface border-b border-slate-200 px-4 py-3 lg:px-6">
              <div className="flex flex-wrap items-center gap-2">
                {(["list","board","timeline","calendar"] as const).map((v) => <button key={v} type="button" onClick={() => setViewMode(v)} className={`border-b-2 px-2 py-2 text-sm font-medium transition ${viewMode === v ? "border-[var(--accent-600)] text-[var(--accent-700)]" : "border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-800"}`}>{v === "list" ? "Lista" : v === "board" ? "Board" : v === "timeline" ? "Timeline" : "Calendario"}</button>)}
                <div className="ml-auto flex min-w-[220px] items-center gap-2 max-sm:w-full">
                  <input ref={searchInputRef} className="ui-control w-full" placeholder="Buscar por titulo, descricao ou etiqueta (/)" value={query} onChange={(event) => setQuery(event.target.value)} />
                  <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "all" | TaskStatus)} className="ui-control"><option value="all">Todos</option>{statusOptions.map((status) => <option key={status} value={status}>{statusMeta[status].label}</option>)}</select>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {[
                  { id: "all", label: "Tudo" },
                  { id: "overdue", label: "Atrasadas" },
                  { id: "high_priority", label: "Alta prioridade" },
                  { id: "no_due", label: "Sem prazo" },
                ].map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setQuickFilter(filter.id as QuickFilter)}
                    className={`ui-chip-btn transition ${
                      quickFilter === filter.id
                        ? "border-[var(--accent-300)] bg-[var(--accent-soft)] text-[var(--accent-700)]"
                        : ""
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
                <select
                  value={markerFilter}
                  onChange={(event) => setMarkerFilter(event.target.value as "all" | MarkerTone)}
                  className="ui-chip-btn ml-1 outline-none focus:border-[var(--accent-400)]"
                  aria-label="Filtrar por marcador"
                >
                  <option value="all">Todos marcadores</option>
                  {markerOptions.map((marker) => (
                    <option key={marker} value={marker}>
                      {markerMeta[marker].label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <StatCard label="Total" value={metrics.total} />
                <StatCard label="Concluidas" value={metrics.done} />
                <StatCard label="Vence hoje" value={metrics.dueToday} />
                <StatCard label="Alta abertas" value={metrics.highOpen} />
              </div>
              {taskWarning ? (
                <div className="mt-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  {taskWarning}
                </div>
              ) : null}
            </header>

            <div className="min-h-0 flex-1 p-3 lg:p-4">
              <div className="flex h-full min-h-0 flex-col gap-3">
                <div className="glass-surface flex min-h-0 flex-col rounded-xl border border-slate-200 p-3">
                  <form className="mb-3 grid gap-2 md:grid-cols-[1.2fr_auto_auto_auto_auto_auto]" onSubmit={createTask}>
                    <input ref={quickTaskInputRef} className="ui-control w-full" placeholder="Nova tarefa" value={newTaskTitle} onChange={(event) => setNewTaskTitle(event.target.value)} />
                    <select className="ui-control" value={newTaskPriority} onChange={(event) => setNewTaskPriority(event.target.value as TaskPriority)}>{Object.keys(priorityMeta).map((priority) => <option key={priority} value={priority}>{priorityMeta[priority as TaskPriority].label}</option>)}</select>
                    <QuickDateField value={newTaskDueDate} onChange={setNewTaskDueDate} />
                    <select className="ui-control" value={newTaskAssignee} onChange={(event) => setNewTaskAssignee(event.target.value)}>{members.map((member) => <option key={member} value={member}>{member}</option>)}</select>
                    <select className="ui-control" value={newTaskMarker} onChange={(event) => setNewTaskMarker(event.target.value as MarkerTone)}>{markerOptions.map((marker) => <option key={marker} value={marker}>{markerMeta[marker].label}</option>)}</select>
                    <button type="submit" className="ui-btn ui-btn-primary px-4 py-2 text-sm">Adicionar</button>
                  </form>

                  <div className="min-h-0 flex-1 overflow-auto">
                    {appArea === "reports" ? (
                      <ReportsView tasks={filteredTasks} />
                    ) : viewMode === "board" ? (
                      <div className="grid gap-2 lg:grid-cols-2 2xl:grid-cols-4">
                        {statusOptions.map((status) => {
                          const tasksByStatus = filteredTasks.filter((task) => task.status === status);
                          return (
                            <div key={status} onDragOver={(event) => { event.preventDefault(); if (dropTargetStatus !== status) setDropTargetStatus(status); }} onDragLeave={() => { if (dropTargetStatus === status) setDropTargetStatus(""); }} onDrop={(event) => { event.preventDefault(); handleColumnDrop(status); }} className={`glass-soft rounded-lg border p-2 transition ${dropTargetStatus === status ? "border-[var(--accent-300)] ring-2 ring-[var(--accent-ring)]" : "border-slate-200"}`}>
                              <div className="mb-2 flex items-center justify-between px-1"><div className="flex items-center gap-1.5"><span className={`h-2 w-2 rounded-full ${status === "backlog" ? "bg-slate-400" : status === "in_progress" ? "bg-cyan-500" : status === "review" ? "bg-amber-400" : "bg-emerald-500"}`} /><h3 className={`text-[11px] font-semibold uppercase tracking-[0.08em] ${statusMeta[status].tone}`}>{statusMeta[status].label}</h3></div><span className="rounded-full border border-slate-300 px-2 py-0.5 text-[10px] text-slate-600">{tasksByStatus.length}</span></div>
                              <div className="space-y-2">
                                {tasksByStatus.length === 0 ? <p className="rounded-md border border-dashed border-slate-300 p-2 text-center text-[11px] text-slate-500">Sem tarefas</p> : null}
                                {tasksByStatus.map((task) => {
                                  const isActive = selectedTaskId === task.id;
                                  const isDragging = draggedTaskId === task.id;
                                  const checklistProgress = getChecklistProgress(task);
                                  const blockedPending = getBlockingTasks(task, activeProject).length;
                                  return (
                                    <div
                                      key={task.id}
                                      role="button"
                                      tabIndex={0}
                                      draggable
                                      onDragStart={(event) => {
                                        event.dataTransfer.setData("text/plain", task.id);
                                        event.dataTransfer.effectAllowed = "move";
                                        setDraggedTaskId(task.id);
                                      }}
                                      onDragEnd={() => {
                                        setDraggedTaskId("");
                                        setDropTargetStatus("");
                                      }}
                                      onClick={() => setSelectedTaskId(task.id)}
                                      onKeyDown={(event) => {
                                        if (event.key === "Enter" || event.key === " ") {
                                          event.preventDefault();
                                          setSelectedTaskId(task.id);
                                        }
                                      }}
                                      className={`glass-surface relative w-full cursor-grab active:cursor-grabbing rounded-md border p-2 pl-3 text-left transition ${
                                        isDragging ? "scale-[1.02] rotate-[0.6deg] opacity-80 shadow-xl" : ""
                                      } ${
                                        isActive
                                          ? "border-[var(--accent-300)] shadow-[0_0_0_2px_var(--accent-ring)]"
                                          : "border-slate-200 hover:-translate-y-0.5 hover:border-[var(--accent-300)] hover:bg-slate-50"
                                      }`}
                                    >
                                      <span className={`absolute inset-y-1 left-1 w-1 rounded-full ${markerMeta[task.marker].strip}`} />
                                      <div className="flex items-start gap-2">
                                        <button
                                          type="button"
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            toggleTaskDone(task);
                                          }}
                                          className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
                                            task.status === "done"
                                              ? "border-[var(--accent-600)] bg-[var(--accent-600)] text-white"
                                              : "border-slate-300 bg-white text-transparent hover:border-[var(--accent-400)]"
                                          }`}
                                          aria-label={task.status === "done" ? "Marcar como nao concluida" : "Marcar como concluida"}
                                        >
                                          ✓
                                        </button>
                                        <p className="text-sm font-medium text-slate-800">{task.title}</p>
                                      </div>
                                      {task.description ? <p className="mt-1 line-clamp-2 text-xs text-slate-500">{task.description}</p> : null}
                                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${priorityMeta[task.priority].badge}`}>
                                          {priorityMeta[task.priority].label}
                                        </span>
                                        {task.dueDate ? <span className="rounded-full border border-slate-300 px-2 py-0.5 text-[10px] text-slate-600">{task.dueDate}</span> : null}
                                        <span className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-1.5 py-0.5 text-[10px] text-slate-600">
                                          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[9px] font-semibold text-[var(--accent-700)]">
                                            {task.assignee.slice(0, 1).toUpperCase()}
                                          </span>
                                          {task.assignee}
                                        </span>
                                      </div>
                                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                        <span className="rounded-full border border-slate-300 px-2 py-0.5 text-[10px] text-slate-600">
                                          Checklist {checklistProgress.done}/{checklistProgress.total}
                                        </span>
                                        {blockedPending > 0 ? (
                                          <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] text-amber-700">
                                            Bloqueada: {blockedPending}
                                          </span>
                                        ) : null}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : viewMode === "list" ? (
                      <div className="glass-surface overflow-auto rounded-lg border border-slate-200">
                        <div className="glass-soft flex items-center gap-2 border-b border-slate-200 px-3 py-2">
                          <label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Agrupar</label>
                          <select
                            value={listGroupBy}
                            onChange={(event) => setListGroupBy(event.target.value as ListGroupBy)}
                            className="ui-control px-2 py-1 text-xs"
                          >
                            <option value="none">Sem grupo</option>
                            <option value="status">Por status</option>
                            <option value="assignee">Por responsavel</option>
                          </select>
                        </div>
                        <table className="w-full min-w-[760px] text-left text-sm">
                          <thead className="bg-slate-100 text-[11px] uppercase tracking-[0.08em] text-slate-600"><tr><th className="px-3 py-2">Tarefa</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Prioridade</th><th className="px-3 py-2">Responsavel</th><th className="px-3 py-2">Prazo</th></tr></thead>
                          <tbody>
                            {groupedListTasks.map((group) => {
                              const collapsed = !!collapsedListGroups[group.key];
                              return (
                                <Fragment key={group.key}>
                                  {listGroupBy !== "none" ? (
                                    <tr className="border-t border-slate-200 bg-slate-50">
                                      <td colSpan={5} className="px-2 py-1.5">
                                        <button
                                          type="button"
                                          onClick={() => setCollapsedListGroups((current) => ({ ...current, [group.key]: !current[group.key] }))}
                                          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                                        >
                                          <span>{collapsed ? ">" : "v"}</span>
                                          <span>{group.label}</span>
                                          <span className="rounded-full border border-slate-300 px-1.5 py-0 text-[10px]">{group.tasks.length}</span>
                                        </button>
                                      </td>
                                    </tr>
                                  ) : null}
                                  {!collapsed
                                    ? group.tasks.map((task) => {
                                        const checklistProgress = getChecklistProgress(task);
                                        const blockedPending = getBlockingTasks(task, activeProject).length;
                                        return (
                                          <tr key={task.id} onClick={() => setSelectedTaskId(task.id)} className="cursor-pointer border-t border-slate-200 transition hover:bg-slate-50">
                                            <td className="px-3 py-2.5 font-medium text-slate-800">
                                              <div className="flex items-center gap-2">
                                                <button
                                                  type="button"
                                                  onClick={(event) => {
                                                    event.stopPropagation();
                                                    toggleTaskDone(task);
                                                  }}
                                                  className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] transition ${
                                                    task.status === "done"
                                                      ? "border-[var(--accent-600)] bg-[var(--accent-600)] text-white"
                                                      : "border-slate-300 bg-white text-transparent hover:border-[var(--accent-400)]"
                                                  }`}
                                                  aria-label={task.status === "done" ? "Marcar como nao concluida" : "Marcar como concluida"}
                                                >
                                                  ✓
                                                </button>
                                                <span className={`h-5 w-1 rounded-full ${markerMeta[task.marker].strip}`} />
                                                <span>{task.title}</span>
                                              </div>
                                              <div className="mt-1 flex items-center gap-1.5 text-[10px] font-normal">
                                                <span className="rounded-full border border-slate-300 px-2 py-0.5 text-slate-600">
                                                  {checklistProgress.done}/{checklistProgress.total}
                                                </span>
                                                {blockedPending > 0 ? (
                                                  <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-amber-700">
                                                    bloqueada {blockedPending}
                                                  </span>
                                                ) : null}
                                              </div>
                                            </td>
                                            <td className="px-3 py-2.5 text-slate-600">{statusMeta[task.status].label}</td>
                                            <td className="px-3 py-2.5 text-slate-600">{priorityMeta[task.priority].label}</td>
                                            <td className="px-3 py-2.5 text-slate-600">
                                              <span className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-1.5 py-0.5 text-[11px]">
                                                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[9px] font-semibold text-[var(--accent-700)]">
                                                  {task.assignee.slice(0, 1).toUpperCase()}
                                                </span>
                                                {task.assignee}
                                              </span>
                                            </td>
                                            <td className="px-3 py-2.5 text-slate-600">{task.dueDate || "-"}</td>
                                          </tr>
                                        );
                                      })
                                    : null}
                                </Fragment>
                              );
                            })}
                            {filteredTasks.length === 0 ? <tr><td className="px-3 py-6 text-center text-slate-500" colSpan={5}>Nenhuma tarefa com os filtros atuais.</td></tr> : null}
                          </tbody>
                        </table>
                      </div>
                    ) : viewMode === "timeline" ? (
                      <TimelineView tasks={filteredTasks} onSelectTask={setSelectedTaskId} />
                    ) : (
                      <CalendarView monthDate={calendarMonth} onPrevMonth={() => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))} onNextMonth={() => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))} onToday={() => { const now = new Date(); setCalendarMonth(new Date(now.getFullYear(), now.getMonth(), 1)); }} tasks={filteredTasks} onSelectTask={setSelectedTaskId} />
                    )}
                  </div>
                </div>
                <div className="glass-soft rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-700">Pulse IA</p>
                  <p className="mt-1 text-sm text-emerald-900">{aiSuggestion}</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
      {selectedTask ? (
        <div className="task-overlay fixed inset-0 z-[120] flex items-center justify-center p-4 md:p-6" onClick={() => setSelectedTaskId("")}>
          <div className="task-drawer glass-l3 relative w-full max-w-[1040px] overflow-hidden rounded-3xl border border-slate-200 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="glass-l2 sticky top-0 z-10 border-b border-slate-200 px-4 pb-3 pt-4">
              <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.1em] text-slate-500">Detalhes da tarefa</p>
                <h3 className="text-lg font-semibold text-slate-900">{selectedTask.title}</h3>
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                  <span className={`rounded-full border px-2 py-0.5 ${priorityMeta[selectedTask.priority].badge}`}>{priorityMeta[selectedTask.priority].label}</span>
                  <span className="rounded-full border border-slate-300 px-2 py-0.5 text-slate-600">
                    Checklist {selectedChecklistProgress.done}/{selectedChecklistProgress.total}
                  </span>
                  {selectedTaskBlocking.length > 0 ? (
                    <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-amber-700">
                      Bloqueada por {selectedTaskBlocking.length}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => duplicateTask(selectedTask.id)} className="ui-btn ui-btn-ghost px-2 py-1 text-sm">
                  Duplicar
                </button>
                <button type="button" onClick={() => setSelectedTaskId("")} className="ui-btn ui-btn-ghost px-2 py-1 text-sm">
                  Fechar
                </button>
              </div>
            </div>
            </div>

            <div className="max-h-[calc(88vh-86px)] overflow-auto p-4">

            <div className="grid gap-3 lg:grid-cols-2">
              <FieldLabel label="Titulo"><input className="field-input" value={selectedTask.title} onChange={(event) => updateTask(selectedTask.id, { title: event.target.value })} /></FieldLabel>
              <FieldLabel label="Marcador"><select className="field-input" value={selectedTask.marker} onChange={(event) => updateTask(selectedTask.id, { marker: event.target.value as MarkerTone })}>{markerOptions.map((marker) => <option key={marker} value={marker}>{markerMeta[marker].label}</option>)}</select></FieldLabel>
              <FieldLabel label="Descricao"><textarea className="field-input h-24 resize-none" value={selectedTask.description} onChange={(event) => updateTask(selectedTask.id, { description: event.target.value })} /></FieldLabel>
              <div className="grid grid-cols-2 gap-2">
                <FieldLabel label="Status"><select className="field-input" value={selectedTask.status} onChange={(event) => changeTaskStatus(selectedTask.id, event.target.value as TaskStatus)}>{statusOptions.map((status) => <option key={status} value={status}>{statusMeta[status].label}</option>)}</select></FieldLabel>
                <FieldLabel label="Prioridade"><select className="field-input" value={selectedTask.priority} onChange={(event) => updateTask(selectedTask.id, { priority: event.target.value as TaskPriority })}>{Object.keys(priorityMeta).map((priority) => <option key={priority} value={priority}>{priorityMeta[priority as TaskPriority].label}</option>)}</select></FieldLabel>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <FieldLabel label="Responsavel"><select className="field-input" value={selectedTask.assignee} onChange={(event) => updateTask(selectedTask.id, { assignee: event.target.value })}>{members.map((member) => <option key={member} value={member}>{member}</option>)}</select></FieldLabel>
                <FieldLabel label="Prazo"><QuickDateField value={selectedTask.dueDate} onChange={(value) => updateTask(selectedTask.id, { dueDate: value })} /></FieldLabel>
              </div>
            </div>

            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              <FieldLabel label="Dependencias">
                <div className="glass-soft max-h-36 space-y-1 overflow-auto rounded-md border border-slate-200 p-2">
                  {activeProject.tasks.filter((task) => task.id !== selectedTask.id).length === 0 ? (
                    <p className="text-xs text-slate-500">Nao ha outras tarefas neste projeto.</p>
                  ) : (
                    activeProject.tasks.filter((task) => task.id !== selectedTask.id).map((task) => {
                      const checked = selectedTask.blockedBy.includes(task.id);
                      return (
                        <label key={task.id} className="flex items-center gap-2 text-xs text-slate-700">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(event) => {
                              const next = event.target.checked ? [...selectedTask.blockedBy, task.id] : selectedTask.blockedBy.filter((item) => item !== task.id);
                              updateTask(selectedTask.id, { blockedBy: next });
                            }}
                          />
                          <span className="truncate">{task.title}</span>
                          <span className="text-[10px] text-slate-500">({statusMeta[task.status].label})</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </FieldLabel>
              <FieldLabel label="Checklist">
                <div className="glass-soft space-y-2 rounded-md border border-slate-200 p-2">
                  <div className="flex gap-2">
                    <input className="field-input" placeholder="Nova subtarefa" value={newSubtaskTitle} onChange={(event) => setNewSubtaskTitle(event.target.value)} />
                    <button type="button" onClick={() => addSubtask(selectedTask.id)} className="ui-btn ui-btn-primary px-2.5 py-1.5 text-xs">+</button>
                  </div>
                  <div className="space-y-1.5">
                    {selectedTask.checklist.length === 0 ? <p className="text-xs text-slate-500">Sem subtarefas.</p> : selectedTask.checklist.map((item) => <div key={item.id} className="glass-l1 flex items-center gap-2 rounded-md border border-slate-200 px-2 py-1.5 text-xs"><input type="checkbox" checked={item.done} onChange={() => toggleSubtask(selectedTask.id, item.id)} /><span className={`flex-1 ${item.done ? "line-through text-slate-400" : "text-slate-700"}`}>{item.title}</span><button type="button" onClick={() => removeSubtask(selectedTask.id, item.id)} className="text-rose-600">x</button></div>)}
                  </div>
                </div>
              </FieldLabel>
            </div>

            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              <FieldLabel label="Comentarios">
                <div className="glass-soft space-y-2 rounded-md border border-slate-200 p-2">
                  <div className="flex gap-2">
                    <input className="field-input" placeholder="Escreva um comentario (use @Ana, @Bruno...)" value={newCommentText} onChange={(event) => setNewCommentText(event.target.value)} />
                    <button type="button" onClick={() => addComment(selectedTask.id)} className="ui-btn ui-btn-primary px-2.5 py-1.5 text-xs">Enviar</button>
                  </div>
                  <p className="text-[10px] text-slate-500">Mencoes disponiveis: {members.map((member) => `@${member}`).join(", ")}</p>
                  <div className="max-h-36 space-y-1.5 overflow-auto">
                    {selectedTask.comments.length === 0 ? <p className="text-xs text-slate-500">Sem comentarios.</p> : selectedTask.comments.map((comment) => <div key={comment.id} className="glass-l1 rounded-md border border-slate-200 px-2 py-1.5 text-xs"><p className="font-medium text-slate-700">{comment.author}</p><p className="mt-0.5 text-slate-600"><CommentText text={comment.text} /></p>{comment.mentions.length > 0 ? <div className="mt-1 flex flex-wrap gap-1">{comment.mentions.map((mention) => <span key={`${comment.id}-${mention}`} className="rounded-full border border-[var(--accent-300)] bg-[var(--accent-soft)] px-1.5 py-0.5 text-[10px] text-[var(--accent-700)]">@{mention}</span>)}</div> : null}<p className="mt-1 text-[10px] text-slate-500">{comment.createdAt}</p></div>)}
                  </div>
                </div>
              </FieldLabel>
              <FieldLabel label="Atividade">
                <div className="glass-soft max-h-44 space-y-1.5 overflow-auto rounded-md border border-slate-200 p-2">
                  {selectedTask.activity.length === 0 ? <p className="text-xs text-slate-500">Sem atividade recente.</p> : selectedTask.activity.map((line, index) => <p key={`${line}-${index}`} className="glass-l1 rounded-md border border-slate-200 px-2 py-1.5 text-xs text-slate-600">{line}</p>)}
                </div>
              </FieldLabel>
            </div>

            <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
              <FieldLabel label="Etiquetas (separadas por virgula)"><input className="field-input" value={selectedTask.labels.join(", ")} onChange={(event) => updateTask(selectedTask.id, { labels: event.target.value.split(",").map((label) => label.trim()).filter(Boolean) })} /></FieldLabel>
              <button type="button" onClick={() => removeTask(selectedTask.id)} className="rounded-md border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100">Remover tarefa</button>
            </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function CommentText({ text }: { text: string }) {
  const memberSet = new Set(members.map((member) => normalizeMentionHandle(member)));
  const parts = text.split(/(@[A-Za-zÀ-ÿ0-9_]+)/g);
  return (
    <>
      {parts.map((part, index) => {
        if (!part.startsWith("@")) return <span key={`${part}-${index}`}>{part}</span>;
        const handle = part.slice(1);
        const isKnownMember = memberSet.has(normalizeMentionHandle(handle));
        return (
          <span
            key={`${part}-${index}`}
            className={isKnownMember ? "rounded bg-[var(--accent-soft)] px-1 text-[var(--accent-700)] font-medium" : "text-slate-500"}
          >
            {part}
          </span>
        );
      })}
    </>
  );
}

function TopBar({
  projectName,
  themeMode,
  accentMode,
  onThemeChange,
  onAccentChange,
  onQuickAdd,
}: {
  projectName: string;
  themeMode: ThemeMode;
  accentMode: AccentMode;
  onThemeChange: (value: ThemeMode) => void;
  onAccentChange: (value: AccentMode) => void;
  onQuickAdd: () => void;
}) {
  const [showColors, setShowColors] = useState(false);
  const accents: AccentMode[] = ["modern_blue", "neon_purple", "minimal_green", "vibrant_orange", "elegant_gray", "cyan_tech"];
  const accentName: Record<AccentMode, string> = {
    modern_blue: "Azul moderno",
    neon_purple: "Roxo neon",
    minimal_green: "Verde minimalista",
    vibrant_orange: "Laranja vibrante",
    elegant_gray: "Cinza elegante",
    cyan_tech: "Azul + ciano",
  };
  const accentDot: Record<AccentMode, string> = {
    modern_blue: "bg-blue-500",
    neon_purple: "bg-fuchsia-500",
    minimal_green: "bg-emerald-500",
    vibrant_orange: "bg-orange-500",
    elegant_gray: "bg-slate-500",
    cyan_tech: "bg-cyan-500",
  };

  return (
    <header className="topbar-layer glass-surface border-b border-slate-200 px-3 py-2 lg:px-5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex min-w-0 items-center gap-2 text-sm text-slate-500">
          <span className="truncate">Meu espaco</span>
          <span>/</span>
          <span className="truncate font-medium text-slate-800">{projectName}</span>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onThemeChange(themeMode === "dark" ? "light" : "dark")}
            className="ui-btn ui-btn-ghost inline-flex h-8 w-[92px] items-center justify-center gap-1 px-2 text-xs font-medium"
            aria-label="Alternar tema"
            title={themeMode === "dark" ? "Mudar para tema claro" : "Mudar para tema escuro"}
          >
            {themeMode === "dark" ? <SunIcon /> : <MoonIcon />}
            <span className="hidden sm:inline">Tema</span>
          </button>

          <div className="relative z-[140]">
            <button
              type="button"
              onClick={() => setShowColors((current) => !current)}
              className="ui-btn ui-btn-ghost px-2.5 py-1.5 text-xs font-medium"
            >
              Cores
            </button>
            {showColors ? (
              <div className="theme-palette-popover glass-surface absolute right-0 top-full z-[220] mt-2 flex items-center gap-2 rounded-xl border border-slate-200 p-2 shadow-xl">
                {accents.map((accent) => (
                  <button
                    key={accent}
                    type="button"
                    onClick={() => {
                      onAccentChange(accent);
                      setShowColors(false);
                    }}
                    className={`h-5 w-5 rounded-full border-2 transition ${accentDot[accent]} ${
                      accentMode === accent ? "border-slate-900 scale-105" : "border-white hover:scale-105"
                    }`}
                    aria-label={`Paleta ${accentName[accent]}`}
                    title={accentName[accent]}
                  />
                ))}
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onQuickAdd}
            className="ui-btn ui-btn-primary inline-flex items-center gap-1 px-3 py-1.5 text-sm"
          >
            <PlusIcon />
            Adicionar rapido
          </button>
          <IconButton label="Inbox" />
          <IconButton label="Ajuda" />
          <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
            RA
          </div>
        </div>
      </div>
    </header>
  );
}

function SideNavButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`ui-btn w-full px-3 py-2 text-left text-sm font-medium ${active ? "bg-[var(--accent-600)] text-white" : "ui-btn-ghost border-transparent text-slate-700"}`}>{label}</button>;
}

function IconButton({ label }: { label: string }) {
  return (
    <button type="button" className="ui-icon-btn" aria-label={label} title={label}>
      {label === "Inbox" ? <InboxIcon /> : label === "Ajuda" ? <HelpIcon /> : <DotIcon />}
    </button>
  );
}

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</span><div className="mt-1">{children}</div></label>;
}

function StatCard({ label, value }: { label: string; value: number }) {
  return <div className="glass-soft rounded-md border border-slate-200 px-3 py-2"><p className="text-[11px] uppercase tracking-[0.08em] text-slate-500">{label}</p><p className="mt-0.5 text-lg font-semibold text-slate-800">{value}</p></div>;
}

function QuickDateField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const applyDays = (days: number) => {
    const date = addDays(new Date(), days);
    onChange(toIsoDate(date.getFullYear(), date.getMonth(), date.getDate()));
  };

  return (
    <div className="space-y-1">
      <input type="date" className="field-input" value={value} onChange={(event) => onChange(event.target.value)} />
      <div className="flex flex-wrap items-center gap-1">
        <button type="button" onClick={() => applyDays(0)} className="ui-btn ui-btn-ghost px-1.5 py-0.5 text-[10px]">Hoje</button>
        <button type="button" onClick={() => applyDays(1)} className="ui-btn ui-btn-ghost px-1.5 py-0.5 text-[10px]">Amanha</button>
        <button type="button" onClick={() => applyDays(7)} className="ui-btn ui-btn-ghost px-1.5 py-0.5 text-[10px]">+7d</button>
        <button type="button" onClick={() => onChange("")} className="ui-btn ui-btn-ghost px-1.5 py-0.5 text-[10px]">Limpar</button>
      </div>
    </div>
  );
}

function CalendarView({ monthDate, onPrevMonth, onNextMonth, onToday, tasks, onSelectTask }: { monthDate: Date; onPrevMonth: () => void; onNextMonth: () => void; onToday: () => void; tasks: Task[]; onSelectTask: (taskId: string) => void; }) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const weekStartOffset = (firstDay.getDay() + 6) % 7;
  const gridStart = new Date(year, month, 1 - weekStartOffset);
  const days = Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
  const yearsVisible = Array.from(new Set(days.map((date) => date.getFullYear())));
  const holidays = yearsVisible.flatMap((visibleYear) => getBrazilNationalHolidays(visibleYear));
  const holidayMap = new Map(holidays.map((holiday) => [holiday.date, holiday]));
  const tasksByDate = new Map<string, Task[]>();
  for (const task of tasks) { if (!task.dueDate) continue; const current = tasksByDate.get(task.dueDate) ?? []; current.push(task); tasksByDate.set(task.dueDate, current); }
  const weekLabels = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"];
  const today = todayIso();
  const monthLabel = monthDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return <div><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><button type="button" onClick={onPrevMonth} className="cal-btn">{"<"}</button><button type="button" onClick={onNextMonth} className="cal-btn">{">"}</button><button type="button" onClick={onToday} className="ui-btn ui-btn-primary px-3 py-1.5 text-sm">Hoje</button></div><p className="text-sm font-semibold capitalize text-slate-800">{monthLabel}</p></div><div className="grid grid-cols-7 gap-1.5">{weekLabels.map((label) => <div key={label} className="glass-soft rounded-md border border-slate-200 py-1.5 text-center text-[11px] text-slate-600">{label}</div>)}{days.map((date) => { const iso = toIsoDate(date.getFullYear(), date.getMonth(), date.getDate()); const inCurrentMonth = date.getMonth() === month; const holiday = holidayMap.get(iso); const dayTasks = tasksByDate.get(iso) ?? []; return <div key={iso} className={`glass-soft min-h-24 rounded-md border p-1.5 ${inCurrentMonth ? "border-slate-200" : "border-slate-300"} ${iso === today ? "ring-2 ring-[var(--accent-ring)]" : ""}`}><div className="mb-1 flex items-center justify-between"><span className={`text-[11px] ${inCurrentMonth ? "text-slate-800" : "text-slate-500"}`}>{date.getDate()}</span>{holiday ? <span className="rounded-full border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-[9px] text-rose-700">Feriado</span> : null}</div>{holiday ? <p className="mb-1 line-clamp-2 text-[9px] text-rose-700">{holiday.name}{holiday.optional ? " (opcional)" : ""}</p> : null}<div className="space-y-1">{dayTasks.slice(0, 2).map((task) => <button key={task.id} type="button" onClick={() => onSelectTask(task.id)} className="ui-chip-btn w-full rounded px-1.5 py-0.5 text-left text-[10px] text-[var(--accent-800)]">{task.title}</button>)}{dayTasks.length > 2 ? <p className="text-[9px] text-slate-500">+{dayTasks.length - 2} tarefa(s)</p> : null}</div></div>; })}</div></div>;
}

function TimelineView({ tasks, onSelectTask }: { tasks: Task[]; onSelectTask: (taskId: string) => void }) {
  const bars = useMemo(() => {
    return tasks
      .map((task) => {
        const rawStart = parseIsoDate(task.createdAt) ?? new Date();
        const rawEnd = parseIsoDate(task.dueDate) ?? addDays(rawStart, 3);
        const start = rawStart <= rawEnd ? rawStart : rawEnd;
        const end = rawEnd >= rawStart ? rawEnd : rawStart;
        return { task, start, end };
      })
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [tasks]);

  if (bars.length === 0) {
    return <div className="glass-soft rounded-lg border border-dashed border-slate-300 p-5"><p className="text-sm text-slate-600">Sem tarefas para exibir na timeline.</p></div>;
  }

  const rangeStart = bars[0]?.start ?? new Date();
  const rangeEnd = bars[bars.length - 1]?.end ?? addDays(rangeStart, 7);
  const totalDays = Math.max(diffInDays(rangeStart, rangeEnd) + 1, 1);
  const checkpoints = Array.from({ length: totalDays }, (_, index) => addDays(rangeStart, index)).filter((_, index) => index % 7 === 0);

  return (
    <div className="glass-surface rounded-lg border border-slate-200 p-3">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-800">Timeline de entregas</p>
        <p className="text-xs text-slate-500">
          {rangeStart.toLocaleDateString("pt-BR")} - {rangeEnd.toLocaleDateString("pt-BR")}
        </p>
      </div>
      <div className="mb-2 flex items-center gap-2 text-[11px] text-slate-500">
        {checkpoints.map((date) => (
          <span key={date.toISOString()} className="glass-soft rounded border border-slate-200 px-2 py-0.5">
            {date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
          </span>
        ))}
      </div>
      <div className="space-y-2">
        {bars.map(({ task, start, end }) => {
          const startOffset = diffInDays(rangeStart, start);
          const span = Math.max(diffInDays(start, end) + 1, 1);
          const left = (startOffset / totalDays) * 100;
          const width = (span / totalDays) * 100;
          return (
            <button
              key={task.id}
              type="button"
              onClick={() => onSelectTask(task.id)}
              className="glass-soft w-full rounded-md border border-slate-200 px-2 py-2 text-left transition hover:border-[var(--accent-300)]"
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <p className="truncate text-sm font-medium text-slate-800">{task.title}</p>
                <span className="shrink-0 text-[11px] text-slate-500">{task.assignee}</span>
              </div>
              <div className="glass-soft relative h-6 rounded-md border border-slate-200">
                <div
                  className="absolute inset-y-0.5 rounded bg-[var(--accent-600)]/90 shadow-sm"
                  style={{ left: `${left}%`, width: `${Math.max(width, 4)}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ReportsView({ tasks }: { tasks: Task[] }) {
  const overdue = tasks.filter((task) => task.dueDate && task.dueDate < todayIso() && task.status !== "done").length;
  const completed = tasks.filter((task) => task.status === "done").length;
  const completionRate = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

  const byStatus = statusOptions.map((status) => ({
    label: statusMeta[status].label,
    count: tasks.filter((task) => task.status === status).length,
  }));
  const maxStatus = Math.max(...byStatus.map((item) => item.count), 1);

  const byAssignee = members.map((member) => ({
    member,
    open: tasks.filter((task) => task.assignee === member && task.status !== "done").length,
  }));
  const maxAssignee = Math.max(...byAssignee.map((item) => item.open), 1);

  return (
    <div className="space-y-3">
      <div className="grid gap-2 md:grid-cols-3">
        <StatCard label="Taxa de conclusao" value={completionRate} />
        <StatCard label="Atrasadas" value={overdue} />
        <StatCard label="Em aberto" value={tasks.length - completed} />
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="glass-surface rounded-lg border border-slate-200 p-3">
          <h4 className="text-sm font-semibold text-slate-800">Volume por status</h4>
          <div className="mt-3 space-y-2">
            {byStatus.map((item) => (
              <div key={item.label}>
                <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                  <span>{item.label}</span>
                  <span>{item.count}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-[var(--accent-600)]" style={{ width: `${(item.count / maxStatus) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="glass-surface rounded-lg border border-slate-200 p-3">
          <h4 className="text-sm font-semibold text-slate-800">Carga por responsavel</h4>
          <div className="mt-3 space-y-2">
            {byAssignee.map((item) => (
              <div key={item.member}>
                <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                  <span>{item.member}</span>
                  <span>{item.open}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-[var(--accent-500)]" style={{ width: `${(item.open / maxAssignee) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PlusIcon() {
  return <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true"><path d="M10.75 4.5a.75.75 0 0 0-1.5 0v4.75H4.5a.75.75 0 0 0 0 1.5h4.75v4.75a.75.75 0 0 0 1.5 0v-4.75h4.75a.75.75 0 0 0 0-1.5h-4.75V4.5Z" /></svg>;
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 2.5V5.2M12 18.8V21.5M21.5 12H18.8M5.2 12H2.5M18.72 5.28L16.81 7.19M7.19 16.81L5.28 18.72M18.72 18.72L16.81 16.81M7.19 7.19L5.28 5.28"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M20.5 14.1A8.5 8.5 0 1 1 9.9 3.5a7 7 0 1 0 10.6 10.6Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DotIcon() {
  return <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true"><path d="M3 10a2 2 0 1 0 4.001.001A2 2 0 0 0 3 10Zm5 0a2 2 0 1 0 4.001.001A2 2 0 0 0 8 10Zm5 0a2 2 0 1 0 4.001.001A2 2 0 0 0 13 10Z" /></svg>;
}

function InboxIcon() {
  return <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true"><path d="M3.5 5.5h13v9h-13z" stroke="currentColor" strokeWidth="1.5" /><path d="M3.5 11.2h4.1l1 1.6h2.8l1-1.6h4.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function HelpIcon() {
  return <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true"><circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" /><path d="M8.8 8a1.4 1.4 0 1 1 2.4 1c-.7.6-1.2.9-1.2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><circle cx="10" cy="13.9" r=".8" fill="currentColor" /></svg>;
}


