import { members } from "@/components/workspace/constants";
import { Holiday, WorkspaceState } from "@/components/workspace/types";

// Retorna data atual no formato ISO (YYYY-MM-DD).
export function todayIso(): string {
  return new Date().toISOString().split("T")[0] ?? "";
}

// Monta data ISO a partir de ano, mes (0-11) e dia.
export function toIsoDate(year: number, month: number, day: number): string {
  const mm = String(month + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

// Soma dias a uma data.
export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

// Converte string ISO em objeto Date.
export function parseIsoDate(iso: string): Date | null {
  if (!iso) return null;
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

// Diferença inteira entre dias, desconsiderando horário.
export function diffInDays(start: Date, end: Date): number {
  const dayMs = 1000 * 60 * 60 * 24;
  const utcStart = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const utcEnd = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.floor((utcEnd - utcStart) / dayMs);
}

// Normaliza nome para comparação de menções.
export function normalizeMentionHandle(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

// Extrai menções válidas no formato @Nome.
export function extractMentions(text: string, availableMembers: string[] = members): string[] {
  const mentionTokens = text.match(/@[A-Za-zÀ-ÿ0-9_]+/g) ?? [];
  const byHandle = new Map(availableMembers.map((member) => [normalizeMentionHandle(member), member]));
  const resolved = mentionTokens
    .map((token) => token.slice(1))
    .map((handle) => byHandle.get(normalizeMentionHandle(handle)))
    .filter(Boolean) as string[];
  return Array.from(new Set(resolved));
}

// Garante esquema compatível com a versão atual da aplicação.
export function normalizeWorkspace(input: WorkspaceState): WorkspaceState {
  const users = Array.isArray(input.users)
    ? input.users.map((user) => ({ ...user, password: user.password ?? "agiliza123" }))
    : members.map((name, index) => ({
        id: `user-seed-${index + 1}`,
        name,
        email: `${normalizeMentionHandle(name)}@agiliza.ai`,
        password: "agiliza123",
        role: index === 0 ? ("owner" as const) : ("member" as const),
        active: true,
      }));
  const teams = Array.isArray(input.teams) ? input.teams : [];
  const inbox = Array.isArray(input.inbox) ? input.inbox : [];
  const helpCenter = Array.isArray(input.helpCenter) ? input.helpCenter : [];
  const currentUserId = input.currentUserId ?? users[0]?.id ?? "";

  return {
    ...input,
    users,
    teams,
    inbox,
    helpCenter,
    currentUserId,
    projects: input.projects.map((project) => ({
      ...project,
      tasks: project.tasks.map((task) => {
        const checklist = Array.isArray(task.checklist) ? task.checklist : [];
        const blockedBy = Array.isArray(task.blockedBy) ? task.blockedBy : [];
        const comments = Array.isArray(task.comments)
          ? task.comments.map((comment) => ({
              ...comment,
              mentions: Array.isArray(comment.mentions) ? comment.mentions : extractMentions(comment.text ?? "", users.map((user) => user.name)),
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

// Lista feriados nacionais do Brasil para o ano informado.
export function getBrazilNationalHolidays(year: number): Holiday[] {
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
    {
      date: toIsoDate(carnivalMonday.getFullYear(), carnivalMonday.getMonth(), carnivalMonday.getDate()),
      name: "Carnaval (segunda)",
      optional: true,
    },
    {
      date: toIsoDate(carnivalTuesday.getFullYear(), carnivalTuesday.getMonth(), carnivalTuesday.getDate()),
      name: "Carnaval (terca)",
      optional: true,
    },
    { date: toIsoDate(goodFriday.getFullYear(), goodFriday.getMonth(), goodFriday.getDate()), name: "Sexta-feira Santa" },
    { date: toIsoDate(easter.getFullYear(), easter.getMonth(), easter.getDate()), name: "Pascoa", optional: true },
    {
      date: toIsoDate(corpusChristi.getFullYear(), corpusChristi.getMonth(), corpusChristi.getDate()),
      name: "Corpus Christi",
      optional: true,
    },
  ];
}

