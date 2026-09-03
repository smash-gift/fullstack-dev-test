# Fase 03 — Integração com o LLM

**Status:** ⬜ pendente · **Checklist:** item 3

## Objetivo

Substituir o stub por adapters reais de LLM, com prompt bem projetado e **validação
rigorosa da saída do modelo**. Ao fim desta fase, `birthday + friend` produz sugestões
geradas de verdade.

## Tasks

- [ ] Confirmar os identificadores exatos de modelo de cada provider
- [ ] Implementar `OpenAiProvider` (default)
- [ ] Implementar `OpenRouterProvider`
- [ ] Implementar `GeminiProvider`
- [ ] Criar `llm-provider.factory.ts` selecionando por `LLM_PROVIDER`
- [ ] Escrever o prompt compartilhado em `infra/llm/prompt/`
- [ ] Criar o schema Zod de validação da resposta do modelo
- [ ] Garantir 2–3 sugestões, de 1–2 frases cada
- [ ] Ler as keys **só** em `pkg/config/env.ts`
- [ ] Preencher os defaults de modelo em `04-operations/environment.md`
- [ ] Confirmar: **nenhuma key no lado Flutter**

## Design do prompt

O prompt vive em **um arquivo só**, compartilhado pelos três adapters. Isso mantém a
diferença entre providers restrita ao transporte — o que torna comparar modelos honesto.

Restrições que o prompt precisa impor:

| Restrição | Motivo |
|---|---|
| Saída em **JSON estruturado** | Parsear prosa de LLM é fonte crônica de bug |
| Exatamente `count` sugestões | O contrato promete 2–3; entregar 1 quebra o contrato |
| 1–2 frases por sugestão | Exigência literal do enunciado |
| Sem nome próprio inventado | O modelo não sabe o nome do destinatário; inventar produz constrangimento |
| Sem emoji por padrão | Nem todo cartão comporta; melhor deixar o usuário adicionar |
| Tom coerente com `tone` | O campo existe para ser respeitado |
| Idioma conforme `language` | Idem |

Onde o provider oferece *JSON mode* ou *structured output*, ele é usado — é mais confiável
que pedir JSON em prosa e torcer.

### Temperatura

Default `0.8`. O raciocínio: temperatura baixa produz três sugestões quase idênticas, o
que anula o propósito de pedir três; temperatura alta produz texto estranho para um cartão.
`0.8` é ponto de partida, ajustável por `LLM_TEMPERATURE` sem recompilar.

## Validação da saída — o ponto crítico

```
resposta bruta do provider
        ↓
JSON.parse          → falhou? LlmInvalidResponseError
        ↓
schema Zod          → falhou? LlmInvalidResponseError
        ↓
regras de negócio   → contagem errada, texto vazio, texto longo demais?
        ↓                 LlmInvalidResponseError
Suggestion[]
```

**Um `200 OK` com corpo inútil é falha.** É a classe de erro mais esquecida em integração
com LLM: trata-se o erro de transporte e ignora-se o erro de contrato, deixando dado
inválido seguir adiante para quebrar três camadas depois, longe da causa.

Aqui a validação acontece **dentro do adapter**, então a falha nasce no ponto exato onde a
informação sobre ela ainda existe.

## Segurança

> As defesas contra prompt injection são construídas na
> [`fase 05`](phase-05-llm-security.md). Esta fase deixa os pontos de extensão prontos:
> o prompt em arquivo próprio, e a validação da saída já isolada em
> `infra/llm/parsing/`, que é onde o guard de saída vai se apoiar.

- Keys lidas **exclusivamente** em `pkg/config/env.ts`
- Nenhuma key em log, em nenhum nível — nem em `debug`
- `.env` no `.gitignore`; `.env.example` sem valor real
- **Zero** credencial no projeto Flutter

## Pendência declarada

Os identificadores exatos de modelo de OpenRouter e Gemini estão marcados como pendentes
em [`../04-operations/environment.md`](../04-operations/environment.md). Serão confirmados
no catálogo vigente de cada provider **nesta fase**, e não antes — documentar um
identificador chutado produziria instrução que parece correta e falha na primeira execução.

O default do OpenAI (`gpt-4o-mini`) é o citado pelo próprio enunciado.

## Critério de pronto

- [ ] `LLM_PROVIDER=openai` gera sugestões reais para `birthday + friend`
- [ ] Todas as sugestões têm 1–2 frases
- [ ] A quantidade retornada é exatamente a pedida em `count`
- [ ] `LLM_PROVIDER=openrouter` funciona trocando só a variável
- [ ] JSON inválido simulado resulta em `LlmInvalidResponseError`
- [ ] `grep -ri "sk-" src/` não retorna nada
- [ ] Log em nível `info` não contém key nem prompt completo

## Riscos

| Risco | Mitigação |
|---|---|
| Modelo devolve prosa em vez de JSON | *Structured output* + validação Zod + caminho de fallback |
| Sugestões longas demais | Regra explícita no prompt + validação de tamanho + `max_tokens` |
| As 3 sugestões saem quase iguais | Temperatura calibrada e configurável |
| Identificador de modelo mudou no catálogo | Confirmado nesta fase; erro de modelo cai em `llm_unavailable`, com fallback |
| Custo durante o desenvolvimento | Modelo barato + cache ativo + rate limit |
