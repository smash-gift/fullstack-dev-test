# web/ — smash-gift

Módulo Next.js do smash-gift. Leia primeiro o `CLAUDE.md` da raiz do repositório — as regras cross-module
(idioma, guardrails, papel de orquestrador) valem aqui também.

## Status

O módulo tem spec técnica própria: `docs/specs/2026-08-12-web-technical-design.md`. Ela define estrutura
exata de pastas, Server vs. Client Components, biblioteca de schema de validação, estratégia de fetching,
o que vai para Zustand vs. estado local, e framework de testes — e documenta as decisões de produto
implementadas nas rodadas seguintes (texto livre para ocasião/relação, login Google e Firestore reais,
"Gerar outras opções"). Consulte-a antes de alterar esse comportamento; mudanças de arquitetura além do
que já está decidido lá seguem o mesmo guardrail de approval-gate do `CLAUDE.md` raiz.

## O que já está decidido

- Gerenciamento de estado com zustand.
- Formulários com react-hook-form.
- Componentes de UI com shadcn/ui.
- Firebase client SDK usado diretamente para Auth (login Google), Analytics e Crashlytics; o token do
  usuário é enviado ao backend, que valida via Firebase Admin.
- Fluxo de acesso: usuário gera mensagens como convidado (guest, sem login) — caminho principal. Login
  Google desbloqueia recursos extras (favoritos, preferências, histórico).
- Módulo 100% independente: sem npm workspace com a raiz nem com `backend/`. `npm install` roda dentro
  de `web/` e gera `web/node_modules/` e `web/package-lock.json` próprios.
- Antes de estilizar qualquer tela, consulte `docs/design/design-tokens.md` (skill `design-consistency`)
  e use a skill `frontend-design:frontend-design`.
- Código, nomes de arquivo, funções, variáveis, classes, tipos sempre em inglês, camelCase para
  funções/variáveis.
- Estrutura de testes definida e aprovada antes de qualquer código de implementação (guardrail
  test-first).
- Zustand deve ser usado apenas para estado global/client compartilhado.
  Estado local de componente deve permanecer local.
  Estado remoto vindo do backend não deve ser duplicado no Zustand sem justificativa na spec.
- react-hook-form é o padrão para formulários.
  Biblioteca de schema/validação: Zod, integrado via `@hookform/resolvers/zod` (ver spec técnica).
- shadcn/ui é infraestrutura de componentes, não identidade visual.
  Não usar componentes com aparência padrão sem adaptação aos design tokens e à direção visual da aplicação.
- Não adicionar `"use client"` por conveniência.
  Componentes devem permanecer Server Components quando não precisarem de APIs do navegador,
  hooks client-side ou estado interativo.
- Estratégia de Server/Client Components e fetching detalhada na spec técnica: sem Route Handler/proxy
  para o backend nesta rodada (chamada HTTP feita diretamente do Client Component via
  `NEXT_PUBLIC_API_BASE_URL`) e sem lib de data-fetching (React Query/SWR) — `fetch` nativo e
  `onSnapshot` do Firestore cobrem as necessidades atuais.
- O frontend não deve acessar diretamente APIs externas que exijam segredo ou regras de negócio protegidas.
  Essas integrações devem passar pelo backend.
- Variáveis `NEXT_PUBLIC_*` são públicas por definição.
  Nunca colocar segredos, chaves privadas ou credenciais sensíveis nelas.

## Fronteiras do módulo

O Web é responsável por:

- renderização e experiência da aplicação web;
- interação e estado de interface;
- autenticação client-side via Firebase Auth;
- comunicação com o backend;
- recursos específicos da plataforma web.

O Web não é responsável por:

- validar autorização de operações protegidas;
- armazenar segredos;
- acessar Firebase Admin;
- implementar regras de negócio que devam ser compartilhadas com Mobile;
- redefinir contratos HTTP do backend unilateralmente.

Veja também `.claude/agents/web-agent.md`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
