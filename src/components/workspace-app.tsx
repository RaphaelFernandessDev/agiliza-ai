"use client";

import { FormEvent, Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
  ACCENT_KEY,
  CalendarView,
  CommentText,
  extractMentions,
  FieldLabel,
  initialWorkspace,
  markerMeta,
  markerOptions,
  members,
  normalizeWorkspace,
  priorityMeta,
  QuickDateField,
  ReportsView,
  SideNavButton,
  StatCard,
  statusMeta,
  statusOptions,
  STORAGE_KEY,
  THEME_KEY,
  TimelineView,
  todayIso,
  TopBar,
  UI_PREFS_KEY,
} from "@/components/workspace";
import type {
  AccentMode,
  AppArea,
  ListGroupBy,
  MarkerTone,
  Project,
  QuickFilter,
  Task,
  TaskPriority,
  TaskStatus,
  ThemeMode,
  ViewMode,
  WorkspaceState,
} from "@/components/workspace";
export default function Home() {
  type SortMode = "updated_desc" | "due_asc" | "priority_desc" | "title_asc";
  type UiPrefs = {
    viewMode: ViewMode;
    statusFilter: "all" | TaskStatus;
    quickFilter: QuickFilter;
    markerFilter: "all" | MarkerTone;
    listGroupBy: ListGroupBy;
    sortMode: SortMode;
  };

  // Estado principal do workspace e preferências de visualização.
  const [workspace, setWorkspace] = useState<WorkspaceState>(initialWorkspace);
  const [storageReady, setStorageReady] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("board");
  const [appArea, setAppArea] = useState<AppArea>("home");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | TaskStatus>("all");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [markerFilter, setMarkerFilter] = useState<"all" | MarkerTone>("all");
  const [listGroupBy, setListGroupBy] = useState<ListGroupBy>("status");
  const [sortMode, setSortMode] = useState<SortMode>("updated_desc");
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

  // Carrega estado persistido no navegador ao iniciar.
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

  // Persiste alterações do workspace localmente.
  useEffect(() => {
    if (!storageReady) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
  }, [workspace, storageReady]);

  // Carrega preferências de tema e paleta.
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

  // Mantém atributos de tema sincronizados no documento.
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", themeMode);
    document.documentElement.setAttribute("data-accent", accentMode);
    window.localStorage.setItem(THEME_KEY, themeMode);
    window.localStorage.setItem(ACCENT_KEY, accentMode);
  }, [themeMode, accentMode]);

  // Atalhos globais de produtividade.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedTaskId("");
      if (
        event.key.toLowerCase() === "n" &&
        document.activeElement &&
        !["INPUT", "TEXTAREA", "SELECT"].includes((document.activeElement as HTMLElement).tagName)
      ) {
        event.preventDefault();
        setViewMode("board");
        quickTaskInputRef.current?.focus();
      }
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
  const activeProjectId = activeProject?.id ?? "";

  // Carrega preferências de uso por projeto para melhorar continuidade.
  useEffect(() => {
    if (!activeProjectId) return;
    const rawPrefs = window.localStorage.getItem(UI_PREFS_KEY);
    if (!rawPrefs) return;
    try {
      const parsed = JSON.parse(rawPrefs) as Record<string, Partial<UiPrefs>>;
      const prefs = parsed[activeProjectId];
      if (!prefs) return;
      if (prefs.viewMode) setViewMode(prefs.viewMode);
      if (prefs.statusFilter) setStatusFilter(prefs.statusFilter);
      if (prefs.quickFilter) setQuickFilter(prefs.quickFilter);
      if (prefs.markerFilter) setMarkerFilter(prefs.markerFilter);
      if (prefs.listGroupBy) setListGroupBy(prefs.listGroupBy);
      if (prefs.sortMode) setSortMode(prefs.sortMode);
    } catch {
      window.localStorage.removeItem(UI_PREFS_KEY);
    }
  }, [activeProjectId]);

  // Persiste preferências de uso por projeto.
  useEffect(() => {
    if (!activeProjectId) return;
    const rawPrefs = window.localStorage.getItem(UI_PREFS_KEY);
    let parsed: Record<string, Partial<UiPrefs>> = {};
    if (rawPrefs) {
      try {
        parsed = JSON.parse(rawPrefs) as Record<string, Partial<UiPrefs>>;
      } catch {
        parsed = {};
      }
    }
    parsed[activeProjectId] = {
      viewMode,
      statusFilter,
      quickFilter,
      markerFilter,
      listGroupBy,
      sortMode,
    };
    window.localStorage.setItem(UI_PREFS_KEY, JSON.stringify(parsed));
  }, [activeProjectId, listGroupBy, markerFilter, quickFilter, sortMode, statusFilter, viewMode]);

  const filteredTasks = useMemo(() => {
    if (!activeProject) return [];
    const priorityOrder: Record<TaskPriority, number> = { high: 3, medium: 2, low: 1 };
    const tasks = activeProject.tasks.filter((task) => {
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
    return tasks.sort((a, b) => {
      if (sortMode === "title_asc") return a.title.localeCompare(b.title, "pt-BR");
      if (sortMode === "priority_desc") return priorityOrder[b.priority] - priorityOrder[a.priority];
      if (sortMode === "due_asc") {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      }
      return b.updatedAt.localeCompare(a.updatedAt);
    });
  }, [activeProject, query, statusFilter, appArea, quickFilter, markerFilter, sortMode]);

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

  // Aplica mutações apenas no projeto ativo.
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
                  <select
                    value={sortMode}
                    onChange={(event) => setSortMode(event.target.value as "updated_desc" | "due_asc" | "priority_desc" | "title_asc")}
                    className="ui-control"
                    aria-label="Ordenar tarefas"
                    title="Ordenar tarefas"
                  >
                    <option value="updated_desc">Mais recentes</option>
                    <option value="due_asc">Prazo crescente</option>
                    <option value="priority_desc">Prioridade</option>
                    <option value="title_asc">Titulo A-Z</option>
                  </select>
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
                                          ?
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
                                                  ?
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


