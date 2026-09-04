# ADRs — Architecture Decision Records

Registro das decisões arquiteturais. Formato: **contexto → opções → decisão →
consequências**, onde "consequências" inclui obrigatoriamente o que se **perdeu** ao
escolher.

Um ADR que só lista vantagens não é análise de trade-off — é justificativa depois do fato.

| # | Decisão | Status |
|---|---|---|
| [0001](adr-0001-clean-architecture-backend.md) | Clean Architecture no backend | Aceito |
| [0002](adr-0002-llm-provider-port-and-adapters.md) | Port `LlmProvider` + três adapters | Aceito |
| [0003](adr-0003-fallback-strategy.md) | Fallback com HTTP 200 + `degraded: true` | Aceito |
| [0004](adr-0004-error-taxonomy.md) | Taxonomia de erros e ocultação de detalhes internos | Aceito |
| [0005](adr-0005-rate-limiting.md) | Rate limiting por IP | Aceito |
| [0006](adr-0006-caching-and-cost.md) | Cache em memória e estratégia de custo | Aceito |
| [0007](adr-0007-flutter-clean-dart.md) | Clean Dart + `ChangeNotifier` no Flutter | Aceito |
| [0008](adr-0008-firebase-out-of-runtime.md) | Firebase fora do runtime | Aceito |
| [0009](adr-0009-llm-security.md) | Segurança do LLM e defesa contra prompt injection | Aceito |
| [0010](adr-0010-application-security.md) | Baseline de segurança da aplicação | Aceito |
| [0011](adr-0011-style-retry.md) | Violação de estilo ganha uma segunda tentativa | Aceito |
| [0012](adr-0012-response-language.md) | O idioma da resposta é o de quem escreve o pedido | Aceito |

## Status possíveis

- **Proposto** — em discussão
- **Aceito** — vigente
- **Substituído por ADR-XXXX** — decisão revista; o ADR original permanece, não é apagado
