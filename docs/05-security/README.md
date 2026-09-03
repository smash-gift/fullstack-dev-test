# Segurança

Esta seção existe porque o LLM não é só uma dependência que pode **cair** — é uma
superfície de ataque. O usuário controla texto que entra num prompt, e vê texto que sai de
um modelo. Tratar isso apenas como problema de disponibilidade seria incompleto.

## Mapa

| Documento | Conteúdo |
|---|---|
| [`threat-model.md`](threat-model.md) | O que pode ser atacado, por quem, com qual impacto |
| [`llm-security.md`](llm-security.md) | Prompt injection e as 4 camadas de defesa |
| [`application-security.md`](application-security.md) | Baseline de segurança web, segredos, dependências |
| [`security-testing.md`](security-testing.md) | Plano de testes, corpus de ataque, suíte live |
| [`security-checklist.md`](security-checklist.md) | Verificação pré-entrega |
| [`injection-baseline-2026-09-03.md`](injection-baseline-2026-09-03.md) | **Medição real** contra `gpt-4o-mini`, antes das defesas da fase 05 |

## A premissa que orienta tudo

> **O LLM deste sistema não tem ferramenta nenhuma.**
> Não chama função, não lê banco, não acessa arquivo, não faz requisição de rede.

Isso elimina de saída a categoria mais grave do OWASP LLM Top 10 — **LLM06 Excessive
Agency**. O pior caso de uma injeção bem-sucedida aqui **não é execução remota**: é o
modelo produzir texto que nós exibimos como se fosse nosso produto.

Essa constatação reposiciona a defesa inteira:

> Impedir 100% das injeções na entrada é objetivo que ninguém consegue garantir.
> **Validar o que sai antes de exibir, esse sim, é garantia.**

Por isso a camada de **validação de saída** é a mais rigorosa deste projeto, e não a de
entrada.

## O reaproveitamento que torna isso barato

Toda violação de segurança detectada — entrada suspeita, saída com URL, canário vazado —
termina no **mesmo caminho já construído para falha do LLM**:

```
violação detectada → LlmInvalidResponseError → fallback → 200 · degraded: true
```

O usuário recebe sugestões seguras. O atacante não recebe sinal útil sobre o que
disparou a defesa. E não foi preciso inventar um segundo mecanismo de tratamento — a
arquitetura do [`ADR-0003`](../01-architecture/decisions/adr-0003-fallback-strategy.md)
já tinha a forma certa.

## Evidência, não alegação

Em 2026-09-03, seis payloads de injeção foram disparados contra o modelo real com apenas a
camada 2 ativa. **Cinco resistiram; um vazou** — e o que vazou (`You are now a pirate`)
produziu texto formalmente limpo: sem URL, sem HTML, sem vazamento de prompt.

Ou seja: a medição **confirmou empiricamente o risco residual** que o ADR-0009 já declarava,
e mostrou que a única defesa que pega esse caso é a heurística de entrada da camada 1.

→ [`injection-baseline-2026-09-03.md`](injection-baseline-2026-09-03.md)

## ADRs

- [`ADR-0009`](../01-architecture/decisions/adr-0009-llm-security.md) — segurança do LLM e prompt injection
- [`ADR-0010`](../01-architecture/decisions/adr-0010-application-security.md) — baseline de segurança da aplicação
