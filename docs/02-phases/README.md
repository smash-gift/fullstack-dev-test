# Fases de execução

16 fases. As 14 primeiras posições espelham o checklist original; **as fases 05 e 06 foram
acrescentadas** quando ficou claro que o LLM não é só uma dependência que pode cair — é
uma superfície de ataque. As demais foram renumeradas para que a ordem dos arquivos reflita
a ordem real de execução.

Nada é trabalhado fora de uma fase — se apareceu trabalho que não cabe em nenhuma, ou ele é
desnecessário, ou falta uma fase.

Status ao vivo: [`../00-overview/checklist.md`](../00-overview/checklist.md)

| # | Fase | Entregável | Status |
|---|---|---|---|
| 01 | [Preparar o repositório](phase-01-repository-setup.md) | Fork, branch, estrutura de pastas | ✅ |
| 02 | [Fundação do backend](phase-02-backend-foundation.md) | Projeto TS, camadas, endpoint validando | ✅ |
| 03 | [Integração com LLM](phase-03-llm-integration.md) | Três adapters, prompt, parsing | ⬜ |
| 04 | [Tratamento de falhas](phase-04-failure-handling.md) | Erros de domínio, fallback, logs | ⬜ |
| 05 | 🔒 [Segurança do LLM](phase-05-llm-security.md) | 4 camadas contra prompt injection | ⬜ |
| 06 | 🔒 [Baseline de segurança](phase-06-application-security.md) | Headers, limites, log, dependências | ⬜ |
| 07 | [Diferenciais do backend](phase-07-backend-extras.md) | Rate limit, CORS, cache, Swagger | ⬜ |
| 08 | [Testes do backend](phase-08-backend-tests.md) | Vitest: fallback + segurança | ⬜ |
| 09 | [App Flutter](phase-09-flutter-app.md) | Projeto e tela principal | ⬜ |
| 10 | [Arquitetura Flutter](phase-10-flutter-architecture.md) | 4 camadas, models, URL configurável | ⬜ |
| 11 | [Estados da interface](phase-11-ui-states.md) | Idle, Loading, Success, Error | ⬜ |
| 12 | [Fluxo ponta a ponta](phase-12-end-to-end.md) | Birthday + Friend + fallback | ⬜ |
| 13 | [Testes Flutter](phase-13-flutter-tests.md) | Widget e unit tests | ⬜ |
| 14 | [README](phase-14-readme.md) | Documento em inglês para o avaliador | ⬜ |
| 15 | [Revisão pré-entrega](phase-15-pre-delivery-review.md) | Lint, testes, clone limpo, auditoria | ⬜ |
| 16 | [Entrega](phase-16-delivery.md) | Push e Pull Request | ⬜ |

## Por que segurança vem nas posições 05 e 06

Não é ordem arbitrária. A **fase 04 constrói o caminho de fallback**, e a fase 05 o
reutiliza integralmente: toda violação de segurança detectada vira
`LlmInvalidResponseError` e cai no funil já pronto.

Colocar segurança antes teria exigido inventar um segundo mecanismo de degradação. Colocar
depois dos testes (fase 08) teria significado escrever a suíte duas vezes.

## Anatomia de uma fase

Cada documento traz:

- **Objetivo** — o que muda no mundo quando a fase termina
- **Tasks** — checkboxes rastreáveis, iguais aos do checklist
- **Critério de pronto** — condições objetivas, verificáveis por comando
- **Arquivos** — o que é criado ou tocado
- **Riscos** — o que pode dar errado e a mitigação prevista

## Regras de execução

1. **Fase não fecha com teste vermelho.** O ciclo é: desenvolver → testar → passar →
   documentar.
2. **Commit ao fim de cada fase**, com mensagem apresentada para autorização antes de
   executar.
3. **Nenhum `try/catch` sem tratamento explícito no `catch`.** Vale para todas as fases.
4. **Documentação acompanha o código na mesma fase**, não é dívida para o fim.
5. **Fase que revelar decisão nova** gera entrada em
   [`decisions-log.md`](../00-overview/decisions-log.md) e, se for relevante, um ADR.
