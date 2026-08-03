---
name: backend-dev
description: Sobe o backend Node/TS em modo dev (hot reload) na porta configurada. Use para rodar a API localmente do gift message suggester.
---

# Backend — dev server

Sobe a API Express em modo desenvolvimento com hot reload.

```bash
cd backend
npm install   # apenas na primeira vez
npm run dev
```

- Porta padrão: `8080` (configurável via `PORT` no `.env`).
- Sem `OPENAI_API_KEY` no `.env`, roda em **modo fallback-only**: nunca chama a LLM e devolve sugestões estáticas. É o esperado até configurar a chave.
- Endpoints: `GET /api/health`, `POST /api/suggestions` (body `{ "occasion": "...", "relationship": "...", "tone?": "..." }`).

Teste rápido:
```bash
curl -s -X POST localhost:8080/api/suggestions \
  -H 'Content-Type: application/json' \
  -d '{"occasion":"Birthday","relationship":"Friend"}'
```
