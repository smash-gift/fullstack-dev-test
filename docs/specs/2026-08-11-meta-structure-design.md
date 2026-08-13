# Spec — Estrutura meta do monorepo smash-gift

- **Data:** 2026-08-11
- **Status:** Aprovado
- **Autor:** Definido em sessão de brainstorming com o Claude Code (skill `superpowers:brainstorming`)

## Contexto

O smash-gift é uma aplicação que sugere mensagens personalizadas para cartões de presente. O usuário
informa dois dados simples — a ocasião (ex: aniversário) e o nível de relacionamento com a pessoa (ex:
mãe) — e recebe 3 opções de mensagem geradas por uma LLM (OpenAI gpt-5-mini). Ao escolher uma, o app
exibe um cartão com a mensagem.

O produto tem duas camadas de acesso:

- **Convidado (guest)**: consegue gerar mensagens sem login — esse é o desafio central (core challenge)
  da aplicação.
- **Autenticado (Google login via Firebase Auth)**: ganha um recurso extra — histórico das mensagens
  geradas, persistido na coleção `history` do Firestore. (Decisão revista em 2026-08-12: a versão
  original desta spec também previa favoritos e preferências como recursos do usuário autenticado; o
  escopo foi reduzido a histórico durante as specs técnicas de backend/web/mobile e esses dois recursos
  nunca chegaram a ser implementados — continuam fora de escopo até que uma spec própria os justifique.)

A aplicação é dividida em um monorepo com três frentes de desenvolvimento (backend Node, web Next.js,
mobile Flutter) mais uma camada de integração direta com Firebase (Auth, Analytics, Crashlytics) nos
clientes. O backend é responsável pela lógica sensível: orquestração de prompt para a LLM, validações,
rate limiting, fallback, segurança e logs — e por validar o token do Firebase (via Firebase Admin) nas
requisições de usuários autenticados.

Antes de iniciar qualquer implementação de produto, decidiu-se estruturar primeiro a **camada meta** do
projeto: como o trabalho será organizado e delegado dentro do Claude Code (agentes customizados, skills,
contrato entre módulos, guardrails de processo). Esta spec documenta esse desenho. As specs técnicas de
cada módulo (backend, web, mobile) serão feitas depois, uma de cada vez, cada uma com seu próprio ciclo
spec → plano → implementação.

## Estrutura de pastas

```
smash-gift/
├── CLAUDE.md                 # regras cross-module, papel de orquestrador
├── .claude/
│   ├── agents/
│   │   ├── backend-agent.md
│   │   ├── web-agent.md
│   │   └── mobile-agent.md
│   └── skills/
│       └── design-consistency/
│           └── SKILL.md
├── docs/
│   ├── specs/                 # specs de arquitetura/produto (este arquivo mora aqui)
│   ├── contracts/
│   │   └── api-contracts.md   # fonte única de verdade dos endpoints do backend
│   └── design/
│       └── design-tokens.md   # fonte única de verdade dos tokens visuais
├── backend/                   # Node + Express, CLAUDE.md próprio
├── web/                       # Next.js, CLAUDE.md próprio
└── mobile/                    # Flutter, CLAUDE.md próprio
```

Decisão explícita: os três módulos são **totalmente independentes**, sem pacote de tipos/código
compartilhado entre eles, e sem nenhuma ferramenta de workspace/monorepo (npm workspaces, Turborepo, Nx
etc.) ligando `backend/` e `web/` — cada um tem seu próprio `package.json`, `node_modules/` e lockfile
dentro da própria pasta, sem nada compartilhado na raiz do repositório. (Decisão revista em 2026-08-12:
a versão original desta spec previa npm workspaces para `backend/`+`web/`; o dono do produto pediu para
manter os três módulos fora de qualquer ferramenta de workspace, já que `mobile/` já tem seu próprio
ecossistema de dependências independente — pub, do Flutter. Um workspace npm uniria só backend+web,
quebrando a simetria de três módulos igualmente independentes.)

## Papel do orquestrador

Não existe um agente "orquestrador" dedicado. Quem cumpre esse papel é a própria sessão principal do
Claude Code, seguindo as regras do `CLAUDE.md` raiz: decidir qual módulo uma tarefa afeta, delegar para o
agente customizado correspondente (`backend-agent`, `web-agent` ou `mobile-agent`), e garantir que o
contrato de API e os tokens de design estejam respeitados antes de considerar uma tarefa cross-module
concluída.

## Agentes customizados

Cada módulo tem um agente dedicado em `.claude/agents/`:

- **`backend-agent`**: atua só em `backend/`. Conhece Node.js/TypeScript, Express, integração com
  OpenAI, Firebase Admin, validações e segurança. Convenções arquiteturais detalhadas estão em
  `docs/specs/2026-08-12-backend-technical-design.md`.
- **`web-agent`**: atua só em `web/`. Conhece Next.js/TypeScript, zustand (estado), react-hook-form,
  shadcn/ui. Convenções detalhadas em `docs/specs/2026-08-12-web-technical-design.md`.
- **`mobile-agent`**: atua só em `mobile/`. Conhece Flutter/Dart. Convenções detalhadas em
  `docs/specs/2026-08-12-mobile-technical-design.md`.

Todos os três: leem o `CLAUDE.md` raiz + o `CLAUDE.md` do próprio módulo antes de agir; consultam
`docs/contracts/api-contracts.md` em tarefas de integração; e seguem o guardrail de test-first (ver
abaixo).

## Contrato entre módulos

Como não há código compartilhado, o contrato de API é um **documento**:
`docs/contracts/api-contracts.md`, a fonte única de verdade do contrato HTTP entre Backend, Web e Mobile.
Ele descreve, por endpoint: nome, método HTTP, path, payload de request, payload de response e códigos de
erro — tudo em inglês, com nomenclatura clara.

O `backend-agent` sinaliza no handoff qualquer mudança observável no contrato HTTP (endpoint, método,
parâmetros, payload, resposta, status code, autenticação ou formato de erro); o orquestrador aplica a
atualização no documento na mesma tarefa. `web-agent` e `mobile-agent` consultam o documento antes de
integrar.

## Consistência visual entre web e mobile

Skill customizada nova: **`design-consistency`** (`.claude/skills/design-consistency/SKILL.md`). Mantém
`docs/design/design-tokens.md` como fonte única de verdade para cores, espaçamento, tipografia, raios de
borda e breakpoints. `web-agent` e `mobile-agent` devem consultá-la antes de estilizar qualquer tela, em
conjunto com a skill já existente `frontend-design:frontend-design` para decisões estéticas gerais. Isso
evita que web e mobile tenham "cara" visual divergente, mesmo sem compartilhar código de estilo.
Paridade visual não significa reprodução pixel a pixel entre Web e Mobile; cada plataforma pode
adaptar interação e layout mantendo identidade, tokens e intenção visual consistentes.

## Guardrails de processo

1. **Approval-gate**: nenhuma implementação começa sem spec (`docs/specs/`) e plano aprovados
   previamente — segue o fluxo padrão brainstorming → plano.
2. **Test-first obrigatório**: para qualquer módulo, a estrutura de testes deve estar definida e aprovada
   _antes_ de qualquer código de implementação. Não é uma sugestão — é um portão obrigatório, ligado à
   skill `superpowers:test-driven-development`.
3. **Idioma**: documentos `.md` sempre em português, com linguagem humanizada e clara. Nomes de arquivo,
   código (funções, variáveis, classes, tipos) e nomes de endpoints sempre em inglês; código em
   camelCase.
4. **Segurança de credenciais**: nenhuma credencial (Firebase service account, chave da OpenAI) é
   commitada. Uso de `.env` + `.env.example` versionado sem valores reais.

Guardrails de **runtime** do produto (rate limit da LLM, validação de prompt, fallback, logs sensíveis)
não fazem parte desta spec — ficam para a spec específica do backend.

O `CLAUDE.md` raiz é a fonte operacional de verdade para os guardrails do dia a dia: ele pode detalhar ou
adicionar guardrails (ex: propriedade sobre `docs/contracts/api-contracts.md` e
`docs/design/design-tokens.md`, hierarquia de instruções, aprovação humana, handoff entre agentes,
Definition of Done) sem exigir revisão desta spec a cada ajuste. Esta seção documenta a intenção
original; o `CLAUDE.md` é o que os agentes de fato seguem no dia a dia.

## Specs e acompanhamento de tarefas

Specs (cross-module ou por módulo) ficam em `docs/specs/`, nomeadas como
`YYYY-MM-DD-<topico>-design.md`. Tarefas de implementação são rastreadas via TaskCreate/TaskList durante a
execução, com subagentes trabalhando em paralelo quando as tarefas dos três módulos forem independentes
entre si.

## Notas de escopo

- Nesta spec, "guest" representa apenas um estado de produto. Não implica Firebase Anonymous Auth,
  persistência específica de sessão guest ou estratégia de merge guest→user; essas decisões ficam para as
  specs técnicas dos clientes.
- A definição de aprovação humana, controle de escopo, dependências e Definition of Done é a estabelecida
  no `CLAUDE.md` raiz e não é redefinida nesta spec.

## Status dos próximos passos (atualizado)

Os itens que este documento originalmente listava como "fora do escopo, a fazer depois" já foram
concluídos:

- Spec técnica do backend: `docs/specs/2026-08-12-backend-technical-design.md`.
- Spec técnica do web: `docs/specs/2026-08-12-web-technical-design.md`.
- Spec técnica do mobile: `docs/specs/2026-08-12-mobile-technical-design.md`.
- `docs/contracts/api-contracts.md` e `docs/design/design-tokens.md` populados; um terceiro artefato
  compartilhado surgiu ao longo da implementação e não estava previsto aqui:
  `docs/contracts/firestore-schema.md` (modelo de dados Firestore usado diretamente pelos clientes
  autenticados, mesmo regime de propriedade do orquestrador que os outros dois).

Este documento registra a estrutura estável do projeto (pastas, papéis, guardrails de processo) e não
muda a cada rodada de implementação; o detalhe de cada rodada — o que foi feito, testado e as pendências
correntes — fica nas specs técnicas de cada módulo e nos handoffs entre agentes, não aqui.
