# ADR-0004 — Taxonomia de erros e ocultação de detalhes internos

**Status:** Aceito · **Data:** 2026-09-03 · **Autoria:** Assistente

## Contexto

Exigência literal do enunciado:

> *"the backend **must not expose raw errors** to the client."*

"Raw error" aqui é mais amplo do que stack trace. Também vaza informação indevida:

- nome e versão do provider de LLM em uso;
- mensagens de erro do SDK (que às vezes ecoam parte da requisição, incluindo prompt);
- caminhos de arquivo do servidor;
- nomes de tabela, host interno, versão de dependência.

Além do risco de segurança, há um problema de contrato: sem taxonomia estável, o cliente
acaba fazendo `if (message.contains('timeout'))`. Isso quebra na primeira vez que alguém
reescreve uma string de erro.

## Decisão

Toda resposta de erro segue **um único formato**, com **código estável** — o campo que o
cliente pode inspecionar com segurança.

```jsonc
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "occasion is required",
    "details": [ { "field": "occasion", "issue": "required" } ]
  },
  "meta": { "requestId": "req_01J...", "timestamp": "2026-09-03T14:22:10.512Z" }
}
```

### Tabela de erros

| Código | HTTP | Quando | `details` | Fallback? |
|---|---|---|---|---|
| `VALIDATION_ERROR` | `400` | Body malformado, campo faltando, `count` fora de 2–3 | Lista de campo + problema | Não |
| `RATE_LIMITED` | `429` | Nosso rate limit estourou | `retryAfterSeconds` | Não |
| `NOT_FOUND` | `404` | Rota inexistente | — | Não |
| `METHOD_NOT_ALLOWED` | `405` | Verbo errado na rota | — | Não |
| `PAYLOAD_TOO_LARGE` | `413` | Body acima do limite | — | Não |
| `INTERNAL_ERROR` | `500` | Qualquer exceção não prevista | — | Não |

**Falha do LLM não aparece nesta tabela** — e essa ausência é intencional. Ela não gera
resposta de erro: gera `200` com `degraded: true`, conforme
[`ADR-0003`](adr-0003-fallback-strategy.md).

### Os dois lados de cada erro

| | Cliente recebe | Log do servidor registra |
|---|---|---|
| **Mensagem** | Frase curta, acionável, sem jargão | Mensagem original completa |
| **Stack trace** | ❌ nunca | ✅ sempre, em `error` |
| **Provider / modelo** | Só quando a resposta é de sucesso | ✅ sempre |
| **`requestId`** | ✅ | ✅ — é o que costura os dois lados |

O `requestId` é a peça que torna essa separação operável: o usuário reporta um id opaco, o
suporte encontra o evento completo no log. Diagnóstico sem exposição.

## Implementação

Um `error-handler.middleware.ts` como **último** middleware do Express concentra a
tradução:

```
DomainError      → código e HTTP correspondentes na tabela
ZodError         → VALIDATION_ERROR 400 (com details por campo)
qualquer outro   → INTERNAL_ERROR 500 · log em nível error com stack
```

O ramo `qualquer outro` é o que garante o requisito: **nenhuma exceção escapa sem passar
por aqui.** Uma exceção que ninguém previu ainda assim sai como `INTERNAL_ERROR` genérico,
nunca como stack trace na resposta.

### Regra de código do projeto

> **Nenhum `try/catch` sem tratamento explícito no `catch`.**

Um `catch` vazio, ou que apenas relança sem contexto, é considerado defeito neste projeto.
Todo `catch` faz pelo menos uma destas coisas:

1. **classifica** o erro em um tipo de domínio;
2. **registra** com `requestId` e contexto suficiente para diagnóstico;
3. **decide** o caminho — degradar, propagar ou traduzir.

O motivo é direto: `catch` silencioso transforma falha em comportamento estranho sem
rastro. O bug reaparece três camadas adiante, sem nenhuma pista de onde nasceu.

## Consequências

**Positivas**
- Cliente pode fazer `switch` em `error.code` com segurança — é contrato, não texto livre.
- Superfície de informação exposta é auditável: está toda em uma tabela.
- Erro não previsto tem comportamento definido por padrão, não por acaso.

**Negativas — assumidas**
- Mensagens genéricas dificultam o debug de quem consome a API sem acesso aos logs.
  Mitigado pelo `requestId`, que dá caminho para o suporte.
- Manter a tabela sincronizada com o código exige disciplina; um código novo criado sem
  entrada aqui vira dívida silenciosa.

**Nota sobre i18n**
As mensagens saem em inglês. Traduzir para o usuário final é responsabilidade do cliente,
que faz o mapeamento a partir de `error.code` — não da string. Isso mantém o backend
livre de decisões de idioma e preserva a estabilidade do contrato.
