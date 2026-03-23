import { useMemo, useState } from "react";
import { members, statusMeta, statusOptions } from "@/components/workspace/constants";
import {
  addDays,
  diffInDays,
  getBrazilNationalHolidays,
  normalizeMentionHandle,
  parseIsoDate,
  toIsoDate,
  todayIso,
} from "@/components/workspace/utils";
import type { AccentMode, Task, ThemeMode } from "@/components/workspace/types";

export function CommentText({ text }: { text: string }) {
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

export function TopBar({
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

export function SideNavButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`ui-btn w-full px-3 py-2 text-left text-sm font-medium ${active ? "bg-[var(--accent-600)] text-white" : "ui-btn-ghost border-transparent text-slate-700"}`}>{label}</button>;
}

export function IconButton({ label }: { label: string }) {
  return (
    <button type="button" className="ui-icon-btn" aria-label={label} title={label}>
      {label === "Inbox" ? <InboxIcon /> : label === "Ajuda" ? <HelpIcon /> : <DotIcon />}
    </button>
  );
}

export function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</span><div className="mt-1">{children}</div></label>;
}

export function StatCard({ label, value }: { label: string; value: number }) {
  return <div className="glass-soft rounded-md border border-slate-200 px-3 py-2"><p className="text-[11px] uppercase tracking-[0.08em] text-slate-500">{label}</p><p className="mt-0.5 text-lg font-semibold text-slate-800">{value}</p></div>;
}

export function QuickDateField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
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

export function CalendarView({ monthDate, onPrevMonth, onNextMonth, onToday, tasks, onSelectTask }: { monthDate: Date; onPrevMonth: () => void; onNextMonth: () => void; onToday: () => void; tasks: Task[]; onSelectTask: (taskId: string) => void; }) {
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

export function TimelineView({ tasks, onSelectTask }: { tasks: Task[]; onSelectTask: (taskId: string) => void }) {
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

export function ReportsView({ tasks }: { tasks: Task[] }) {
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

