---
name: backend-test
description: Roda o typecheck e a suíte Jest do backend Node/TS do gift message suggester. Use após alterar qualquer arquivo em backend/.
---

# Backend — testes

```bash
cd backend
npm run typecheck   # tsc --noEmit
npm test            # jest --runInBand
```

Cobertura principal:
- `tests/suggestion.service.test.ts` — caminho de **fallback** (prioridade) + happy path + cache.
- `tests/api.route.test.ts` — HTTP end-to-end com provider mockado (200 happy, 200 fallback seguro, 400 inválido, health).
- `tests/parseSuggestions.test.ts` — parsing/normalização da saída da LLM e mapeamento de erros.

Os `console.error` que aparecem durante os testes de falha são os logs propositais do fallback — não são falhas.
