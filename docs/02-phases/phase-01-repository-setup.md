# Fase 01 — Preparar o repositório

**Status:** ✅ concluída (exceto pastas de código) · **Checklist:** item 1

## Objetivo

Ter o fork, a branch e a estrutura de pastas prontos, com proteção contra vazamento de
segredo **antes** de qualquer key entrar no projeto.

## Tasks

- [x] Fazer fork do repositório original
- [x] Clonar o fork
- [x] Criar branch `candidate/tote-araujo`
- [x] Adicionar `upstream` apontando para o repositório original
- [x] Criar `.gitignore` na raiz protegendo `.env` e artefatos de build
- [x] Preservar o enunciado original em `docs/00-overview/original-test.md`
- [x] Criar a estrutura `docs/`
- [x] Criar `backend/` — feito na [fase 02](phase-02-backend-foundation.md)
- [x] Criar `flutter_app/` — feito na [fase 09](phase-09-flutter-app.md)

## O que foi feito

```bash
gh repo fork smash-gift/fullstack-dev-test --clone=false
git clone https://github.com/ToteADS/fullstack-dev-test.git .
git remote add upstream https://github.com/smash-gift/fullstack-dev-test.git
git checkout -b candidate/tote-araujo
```

| Item | Valor |
|---|---|
| Upstream | `smash-gift/fullstack-dev-test` |
| Fork | `ToteADS/fullstack-dev-test` |
| Branch | `candidate/tote-araujo` |

O enunciado sugere o formato `candidate/jane-doe`; seguimos essa convenção.

### Sobre mover o README original

O `README.md` original foi movido para `docs/00-overview/original-test.md` com `git mv`,
preservando o histórico. A raiz passa a hospedar o README da **solução**, que é o
documento que o enunciado manda escrever:

> *"**Your fork's README** must include: how to run the project..."*

O enunciado original permanece acessível — com a única alteração sendo o caminho relativo da imagem, que quebrou com a mudança de pasta — para que a matriz de
rastreabilidade possa citá-lo textualmente.

### `.gitignore` antes de tudo

Criado **na primeira fase**, antes de existir qualquer `.env`. A ordem importa: um `.env`
criado antes do `.gitignore` pode ser commitado por acidente, e remover segredo do
histórico do Git é trabalhoso e deixa rastro.

Cobre segredos (`.env`, `*.pem`, `*-service-account*.json`), artefatos de Node, artefatos
de Flutter/Dart e ruído de sistema operacional.

## Critério de pronto

- [x] `git remote -v` mostra `origin` (fork) e `upstream` (original)
- [x] `git branch --show-current` retorna `candidate/tote-araujo`
- [x] `.gitignore` contém `.env` e `!.env.example`
- [x] `docs/` criada com as seis subpastas

## Riscos

| Risco | Mitigação |
|---|---|
| Commitar `.env` com key real | `.gitignore` criado na fase 01; auditoria explícita na fase 16 |
| Trabalhar em `main` por engano | Branch criada antes de qualquer arquivo ser escrito |
| Perder o texto original do enunciado | Preservado via `git mv`; só o caminho da imagem foi ajustado, com nota no arquivo |
