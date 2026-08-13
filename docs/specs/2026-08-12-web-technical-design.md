# Spec — Design técnico do módulo Web (Next.js)

- **Data:** 2026-08-12
- **Autor:** `web-agent`, seguindo os guardrails de `CLAUDE.md` (raiz) e `web/CLAUDE.md`.

## Contexto

Esta spec documenta o estado atual das decisões técnicas de `web/`: estrutura de pastas, Server vs.
Client Components, validação, estratégia de fetching, o que vai para Zustand vs. estado local,
autenticação/Firestore e framework de testes. Não redefine nada do `CLAUDE.md` raiz nem da spec de
meta-estrutura. Escopo funcional coberto: fluxo guest completo (formulário de ocasião/relação em texto
livre → chamada ao backend → 3 opções de mensagem → seleção → exibição em cartão, com regeneração de
opções), login Google funcional e histórico de mensagens via Firestore para usuários autenticados. O
contrato HTTP está em `docs/contracts/api-contracts.md`; o modelo de dados do Firestore está em
`docs/contracts/firestore-schema.md` — esta spec não duplica esse conteúdo, só referencia onde cada
decisão de código se conecta a eles.

## Estrutura de pastas

App Router do Next.js, dentro de `web/`:

```
web/
├── src/
│   ├── app/
│   │   ├── layout.tsx, page.tsx    # Server Components — página guest é a única rota
│   │   ├── globals.css             # tokens visuais como CSS variables + Tailwind
│   │   └── favicon.ico
│   ├── components/
│   │   ├── ui/                # primitives shadcn: button, input, label, card, textarea, skeleton
│   │   ├── gift-flow/          # GiftMessageForm, MessageOptionsList, GiftCard, GiftFlow, GiftFlow.states
│   │   ├── auth/               # AuthHeader.tsx
│   │   └── history/            # HistorySection.tsx, HistoryList.tsx
│   ├── lib/
│   │   ├── api/                # generateMessages.ts (client HTTP) + .types.ts
│   │   ├── validation/         # giftMessageForm.schema.ts (zod)
│   │   ├── firebase/           # client.ts, auth.ts, firestore.ts
│   │   └── utils.ts            # `cn()` (clsx + tailwind-merge), padrão shadcn
│   ├── store/
│   │   └── useAuthStore.ts     # zustand — estado de sessão (guest/authenticated), client-only
│   └── test/
│       └── setup.ts            # setup Vitest + Testing Library
├── public/
├── .env.example
├── package.json / tsconfig.json / next.config.ts / vitest.config.ts
├── postcss.config.mjs   # Tailwind v4 — sem tailwind.config.ts (tokens em app/globals.css)
└── README.md
```

Justificativa: `components/gift-flow` isola o domínio funcional (única feature do produto) de
`components/ui` (infraestrutura shadcn). Não há pasta `features/` genérica nem abstração para módulos que
ainda não existem.

## Server vs. Client Components

`app/layout.tsx`, `app/page.tsx` e `GiftCard.tsx` são Server Components: `page.tsx` só monta a árvore
(`AuthHeader`, `GiftFlow`, `HistorySection`) sem estado próprio; `GiftCard.tsx` recebe a mensagem via
props e apenas renderiza. `GiftMessageForm.tsx`, `MessageOptionsList.tsx`, `GiftFlow.tsx`,
`AuthHeader.tsx`, `HistorySection.tsx` e `HistoryList.tsx` são Client Components (`"use client"`) — todos
dependem de estado interativo, de `useAuthStore` (client-only), de efeitos (`onAuthStateChanged`,
`onSnapshot`) ou de interação do usuário. `page.tsx` importa esses componentes como filhos sem precisar
virar Client Component ele mesmo. Componentes `ui/` seguem o padrão shadcn: `"use client"` só quando
envolvem estado ou eventos do DOM.

Não há fetching de dados no servidor — a geração de mensagem é sempre uma ação disparada pelo usuário, não
dado inicial de página. A chamada acontece diretamente do Client Component para a URL pública do backend
(`NEXT_PUBLIC_API_BASE_URL`), via `lib/api/generateMessages.ts`, sem Route Handler/proxy, porque a rota é
guest/sem autenticação e não expõe segredo algum do cliente. Se uma chamada futura exigir esconder alguma
credencial do navegador, essa decisão deve ser revista em nova spec.

## Validação

**Zod**, integrado ao `react-hook-form` via `@hookform/resolvers/zod` — par mais comum e simples com
react-hook-form no ecossistema Next.js atual. Schema único em `lib/validation/giftMessageForm.schema.ts`.

`occasion` e `relationship` são texto livre digitado pelo usuário (não uma lista curada de opções), para
deixar o usuário descrever a ocasião e a relação com as próprias palavras. Limite de **1 a 300 caracteres
após trim** em ambos os campos (`MAX_FIELD_LENGTH` no schema), alinhado a `docs/contracts/api-contracts.md`.
`GiftMessageForm.tsx` usa `Textarea` (`components/ui/textarea.tsx`) para os dois campos.

## Estratégia de fetching

Fetch nativo do navegador (`fetch`), sem biblioteca de data-fetching (React Query, SWR etc.): há uma
única chamada de rede, disparada por ação explícita do usuário, sem necessidade de cache, revalidação em
background ou refetch automático. O estado de request (`idle | loading | success | error`) é local ao
componente orquestrador (`GiftFlow.tsx`), via `useState`/reducer — não vai para o Zustand, por ser estado
remoto/efêmero da tela atual. O histórico (`HistoryList.tsx`) segue a mesma lógica sem lib de cache: usa
`onSnapshot` do Firestore diretamente dentro de um `useEffect`, que já entrega tempo real nativamente.

## Zustand vs. estado local

Zustand é usado **apenas** para o estado de sessão de autenticação (`useAuthStore`): se o usuário é guest
ou autenticado, e dados mínimos do usuário Firebase (uid, nome, e-mail, avatar) quando logado. Esse
estado é lido por várias partes da árvore (header, gate de recursos extras) e sobrevive a navegação — por
isso justifica estado global. Não vai para o Zustand: estado do formulário (react-hook-form já gerencia),
as 3 opções de mensagem geradas/seleção/status da chamada HTTP (estado local de `GiftFlow.tsx`), nem
estado remoto do backend, conforme `web/CLAUDE.md`.

## Fluxo guest

Máquina de estados simples dentro de `GiftFlow.tsx`, sem lib de state machine:

1. **form** (inicial): mostra `GiftMessageForm`.
2. **loading**: usuário submeteu; chamada em andamento; formulário desabilitado.
3. **options**: resposta recebeu 3 mensagens; `MessageOptionsList` exibe as opções; usuário escolhe uma.
4. **result**: mensagem escolhida renderizada em `GiftCard`; ação "gerar novamente" retorna a `form`.
5. **error**: falha de rede ou erro do backend; ação de tentar novamente retorna a `form`, preservando os
   valores já digitados (react-hook-form não é resetado nesse caminho).

Nenhuma persistência de sessão guest é introduzida (sem localStorage, cookie próprio ou Firebase Anonymous
Auth) — cada visita começa do zero em `form`, conforme a spec de meta-estrutura (guest é um estado de
produto, não uma sessão persistida). Quando autenticado, a transição de **options** para **result** também
dispara `addHistoryEntry` no Firestore em paralelo (melhor esforço — ver seção seguinte).

**Regeneração de opções**: dentro do próprio step `options` (sem transição de `FlowStep`), o usuário pode
pedir 3 novas opções para o mesmo `occasion`/`relationship` já preenchido, sem reabrir o formulário. Dois
campos locais em `FlowState` (`isRegenerating`, `regenerateErrorMessage`) controlam esse sub-fluxo;
`handleRegenerate` reusa o mesmo client HTTP (`generateMessages`). Em sucesso, `state.messages` é
substituído; em erro, as opções antigas permanecem visíveis e o erro aparece inline, sem usar o painel de
erro de tela cheia (que derrubaria as opções já geradas). Durante a regeneração, `MessageOptionsList`
mostra 3 placeholders (`Skeleton`) no lugar dos cards.

## Login Google e Firestore

Login Google é funcional, com integração **direta do cliente** com o Firestore para dados de usuário
autenticado — sem mediação do backend, conforme `docs/contracts/firestore-schema.md` (fonte única de
verdade do modelo de dados dessa camada).

**Login (`lib/firebase/auth.ts`)**: `signInWithGoogle()` usa `signInWithPopup` + `GoogleAuthProvider` —
popup em vez de redirect porque o produto não tem navegação de página cheia que justifique lidar com
`getRedirectResult()` após reload. `signOutUser()` chama `signOut` do Firebase Auth.
`subscribeToAuthChanges(onChange)` assina `onAuthStateChanged`, repassa o usuário mapeado (ou `null`) ao
callback — quem atualiza `useAuthStore` é o chamador (`AuthHeader.tsx`) — e dispara `upsertUserProfile`
sempre que há usuário autenticado (login explícito ou sessão restaurada ao recarregar, mesmo caminho de
código para os dois casos). Quando `isFirebaseConfigured()` é falso, vira um no-op — a UI permanece em
`guest` sem lançar erro.

**UI (`components/auth/AuthHeader.tsx`)**: assina `subscribeToAuthChanges` em `useEffect`; mostra "Entrar
com Google" (guest) ou avatar + nome + "Sair" (autenticado). Avatar (`size-8`) usa `<img>` simples (não
`next/image` — a foto vem de `lh3.googleusercontent.com` e configurar `remotePatterns` para ~32px não
compensa), com fallback de iniciais quando `photoUrl` é `null`; tratado como decorativo
(`alt=""`/`aria-hidden`) porque o nome já é anunciado pelo texto ao lado. Erros de login (ex.: popup
fechado) são capturados e mostrados inline (`role="alert"`).

**Firestore (`lib/firebase/firestore.ts`)**: único módulo do projeto que importa `firebase/firestore`,
mesmo padrão de isolamento do client HTTP. Três funções, mapeadas 1:1 nas coleções de
`docs/contracts/firestore-schema.md`: `upsertUserProfile(user)` (`setDoc(..., { merge: true })` em
`users/{uid}`, com `createdAt: serverTimestamp()` só na primeira escrita e `lastLoginAt` sempre
atualizado, chamada por `subscribeToAuthChanges`); `addHistoryEntry(uid, entry)` (`addDoc` em
`users/{uid}/history`, chamada por `GiftFlow.tsx` na seleção de mensagem, melhor esforço — falha é
capturada e ignorada silenciosamente, guests nunca chamam); e `subscribeToHistoryEntries(uid, onUpdate,
onError)` (`onSnapshot` em `query(..., orderBy("createdAt", "desc"), limit(3))`, chamada por
`HistoryList.tsx` num `useEffect` com unsubscribe no cleanup — o listener vive e morre com o componente,
que só monta quando `status === "authenticated"`).

**Histórico (`components/history/HistorySection.tsx` + `HistoryList.tsx`)**: `HistorySection` só
renderiza `HistoryList` quando autenticado. `HistoryList` cobre loading/erro/vazio/sucesso, como lista de
cards (ocasião + relação, mensagem selecionada, data em `pt-BR`), mais recente primeiro.

**Pendência**: sem projeto Firebase real provisionado neste ambiente, não é possível testar login/Firestore
ponta a ponta, nem implantar as regras de segurança do Firestore (`firebase deploy --only
firestore:rules`) — mitigado com testes de unidade sobre o SDK mockado; a intenção das regras já está
documentada em `docs/contracts/firestore-schema.md`.

## Framework de testes

**Vitest** + **React Testing Library** + `@testing-library/jest-dom` + `@testing-library/user-event`,
ambiente `jsdom` — par padrão para projetos Next.js modernos, rápido o suficiente para test-first.

Cobertura atual, todos test-first, com SDKs externos (fetch, `firebase/auth`, `firebase/firestore`)
mockados no nível do módulo:

- Validação e client HTTP: schema zod (trim, min/max) e `generateMessages.ts` (sucesso, erro HTTP, erro
  de rede).
- Fluxo guest: `GiftMessageForm` (render, validação, submit), `MessageOptionsList` (opções, seleção,
  regeneração), `GiftCard` (renderização pura) e `GiftFlow` (integração dos estados
  `form → loading → options → result` e `form → loading → error → form`, incluindo que `addHistoryEntry`
  só é chamado quando autenticado).
- Auth: `lib/firebase/auth.ts` (login/logout/listener, com e sem Firebase configurado) e `AuthHeader.tsx`
  (render condicional, avatar/iniciais, entrar/sair, erro de login).
- Firestore/histórico: `lib/firebase/firestore.ts` (`upsertUserProfile`, `addHistoryEntry`,
  `subscribeToHistoryEntries`) e `HistoryList.tsx`/`HistorySection.tsx` (loading/vazio/erro/sucesso,
  atualização em tempo real, unsubscribe ao desmontar/deslogar).

Server Components puros (ex.: `GiftCard`) são testados via render direto com Testing Library.

## Tokens de design usados

Todos os valores visuais vêm de `docs/design/design-tokens.md` (cores, tipografia Montserrat/Poppins,
espaçamento múltiplo de 4, raios, alturas de input/botão de 56px). Os tokens de feedback (`success`,
`warning`, `error`, `errorSoft`, `info`) já estão definidos no documento e são os valores usados em
produção nos estados de erro (`GiftFlowErrorState`, mensagens inline de formulário/regeneração/login).

## Fora de escopo

Firebase Anonymous Auth, merge guest → user e persistência de sessão guest (guest continua sendo um
estado de produto, não uma sessão persistida); Route Handler/proxy para o backend; data-fetching library
(React Query/SWR), inclusive para o histórico; favoritos e preferências como conceito distinto de
`history` (ver `docs/contracts/firestore-schema.md`); merge de mensagens geradas como guest para o
histórico após login posterior; internacionalização.
