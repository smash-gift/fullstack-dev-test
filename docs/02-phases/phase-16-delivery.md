# Fase 16 — Entrega

**Status:** ⬜ pendente · **Checklist:** item 16

## Objetivo

Publicar a branch e abrir o Pull Request, garantindo que o avaliador consiga acessar e
entender a entrega sem depender de contexto que ele não tem.

## Tasks

- [ ] Revisar o histórico de commits
- [ ] Push da branch `candidate/tote-araujo`
- [ ] Abrir Pull Request para `smash-gift/fullstack-dev-test`
- [ ] Escrever descrição curta do PR
- [ ] Confirmar acessibilidade do fork e da branch

## Histórico de commits

O enunciado pede *"commits organizados"*. A convenção adotada:

```
docs: <o que>      documentação
feat: <o que>      funcionalidade
test: <o que>      testes
fix:  <o que>      correção
chore: <o que>     configuração e ferramental
```

Um commit por fase concluída, o que faz o histórico contar a ordem em que o problema foi
atacado.

**Sem assinatura de assistente de IA.** Nem `Co-Authored-By`, nem "Generated with", nem
variação disso — em nenhuma mensagem de commit, corpo de PR, issue ou comentário. A
transparência sobre uso de IA está onde deve estar: no README e em
[`../06-ai-usage/ai-usage.md`](../06-ai-usage/ai-usage.md), escrita em prosa e com
detalhe, que é o que o enunciado pede. Rodapé automático em commit não é transparência,
é ruído.

## Push e PR

```bash
git push -u origin candidate/tote-araujo

gh pr create \
  --repo smash-gift/fullstack-dev-test \
  --base main \
  --head ToteADS:candidate/tote-araujo \
  --title "Senior dev test – AI message suggester" \
  --body-file .github/pr-body.md
```

O enunciado sugere o título: *"The PR description can be short (e.g. 'Senior dev test –
AI message suggester')"*.

## Descrição do PR

Curta, como o enunciado permite, mas com os atalhos que economizam o tempo do avaliador:

```markdown
Senior dev test – AI message suggester.

- `backend/` — Node 20 + TypeScript, Clean Architecture, Express, Zod, Vitest
- `flutter_app/` — Flutter, Clean Dart, ChangeNotifier
- `docs/` — architecture, ADRs, phases, API contract (Portuguese)
- `README.md` — how to run, architecture, trade-offs (English)

Highlights:
- LLM failure returns HTTP 200 with `degraded: true` and curated fallback — never a raw error
- `LlmProvider` port with three adapters (OpenAI default, OpenRouter, Gemini)
- Rate limiting, in-memory cache, Swagger UI at `/docs`
- Tests cover the fallback path without network or API key

Firebase was intentionally left out of the runtime — reasoning in
`docs/01-architecture/decisions/adr-0008-firebase-out-of-runtime.md`.
```

## Plano B

O enunciado prevê:

> *"If the original repo does not allow PRs from forks, send the link to your fork (with
> the branch) instead."*

Se o PR for bloqueado, o link a enviar é:

```
https://github.com/ToteADS/fullstack-dev-test/tree/candidate/tote-araujo
```

## Verificação final de acesso

- [ ] O fork é **público**
- [ ] A branch `candidate/tote-araujo` aparece no fork
- [ ] O PR aparece no repositório original
- [ ] O README renderiza corretamente na página do PR
- [ ] Os diagramas Mermaid renderizam no GitHub
- [ ] Abrir a URL do fork em janela anônima (sem sessão) e confirmar o acesso

O último item pega o erro clássico: o repositório parece acessível porque **você** está
logado. Janela anônima é o teste honesto.

## Critério de pronto

- [ ] Branch publicada com todos os commits
- [ ] PR aberto com título e descrição
- [ ] Fork acessível sem autenticação
- [ ] Todos os links da descrição do PR funcionam

## Riscos

| Risco | Mitigação |
|---|---|
| PR de fork bloqueado | Plano B com o link direto da branch |
| Fork privado por engano | Verificação em janela anônima |
| Commit com key no histórico | Auditoria da fase 15 antes do push |
| Mermaid não renderizar | Conferido na pré-visualização do GitHub |
