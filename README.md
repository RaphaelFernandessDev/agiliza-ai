# Agiliza Ai

## 🇧🇷 Português (Brasil)

Organizador de tarefas inspirado em ferramentas modernas de produtividade, com foco em clareza visual, fluxo Kanban, timeline e calendário com feriados nacionais.

### Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4

### Scripts

```bash
npm run dev
npm run lint
npm run build
npm run start
```

### Estrutura de pastas

```text
src/
  app/
    globals.css
    layout.tsx
    page.tsx
  components/
    workspace-app.tsx              # Container principal (estado e regras)
    workspace/
      constants.ts                 # Constantes e metadados globais
      data.ts                      # Estado inicial (seed)
      index.ts                     # Barrel exports do módulo
      types.ts                     # Tipos de domínio
      utils.ts                     # Funções utilitárias puras
      workspace-ui.tsx             # Componentes de apresentação reutilizáveis
```

### Padrões do projeto

- Comentários curtos em português (pt-BR), com foco em contexto e intenção.
- Regras de negócio separadas de componentes de apresentação.
- Estado local persistido no `localStorage`.
- Estilo glassmorphism centralizado em `globals.css`.

### Contribuição

1. Crie uma branch com nome descritivo.
2. Faça alterações pequenas e objetivas.
3. Rode `npm run lint` e `npm run build` antes de abrir PR.
4. Descreva no PR: problema, solução e impacto visual/funcional.

### Roadmap curto

- Testes unitários para utilitários e regras de negócio.
- Extração gradual de hooks (`useWorkspaceState`, `useTaskActions`).
- Internacionalização (pt-BR/en-US).

---

## 🇺🇸 English

A task organizer inspired by modern productivity tools, focused on visual clarity, Kanban flow, timeline, and calendar with Brazilian public holidays.

### Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4

### Scripts

```bash
npm run dev
npm run lint
npm run build
npm run start
```

### Folder structure

```text
src/
  app/
    globals.css
    layout.tsx
    page.tsx
  components/
    workspace-app.tsx              # Main container (state and business logic)
    workspace/
      constants.ts                 # Global constants and metadata
      data.ts                      # Initial seed state
      index.ts                     # Barrel exports for the module
      types.ts                     # Domain types
      utils.ts                     # Pure utility functions
      workspace-ui.tsx             # Reusable presentation components
```

### Project conventions

- Short comments in Brazilian Portuguese (pt-BR), focused on context and intent.
- Business logic separated from presentation components.
- Local state persisted in `localStorage`.
- Glassmorphism styling centralized in `globals.css`.

### Contributing

1. Create a branch with a descriptive name.
2. Keep changes small and objective.
3. Run `npm run lint` and `npm run build` before opening a PR.
4. In the PR, describe: problem, solution, and visual/functional impact.

### Short roadmap

- Unit tests for utilities and business rules.
- Gradual extraction of hooks (`useWorkspaceState`, `useTaskActions`).
- Internationalization (pt-BR/en-US).
