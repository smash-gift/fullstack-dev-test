# Executando localmente

> Esta é a versão em português, com detalhes de troubleshooting. A versão curta e
> definitiva para o avaliador fica no `README.md` (inglês) na raiz.

---

## Pré-requisitos

| Ferramenta | Versão mínima | Conferir com |
|---|---|---|
| Node.js | 20+ | `node -v` |
| npm | 10+ | `npm -v` |
| Flutter | 3.38+ | `flutter --version` |
| Dart | 3.x | `dart --version` |
| API key de LLM | — | OpenAI, OpenRouter **ou** Gemini |

Versões verificadas nesta máquina de desenvolvimento: Node `v20.19.6`, npm `10.8.2`,
Flutter `3.44.2`, Dart `3.12.2`.

---

## 1. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Abra o `.env` e preencha a key do provider escolhido:

```env
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
```

Suba o servidor:

```bash
npm run dev        # com hot reload
# ou
npm run build && npm start
```

Confirme:

```bash
curl -sS http://localhost:3000/health | jq
```

```jsonc
{ "status": "ok", "uptimeSeconds": 2, "version": "1.0.0", "llmProvider": "openai" }
```

Swagger UI: **http://localhost:3000/docs**

### Testar o endpoint sem abrir o app

```bash
curl -sS -X POST http://localhost:3000/api/v1/suggestions \
  -H 'Content-Type: application/json' \
  -d '{"occasion":"birthday","relationship":"friend"}' | jq
```

---

## 2. Flutter

Com o backend rodando, em **outro terminal**:

```bash
cd flutter_app
flutter pub get
flutter run --dart-define=API_BASE_URL=http://localhost:3000
```

### Escolha do alvo

```bash
# Chrome — o caminho mais rápido para avaliar
flutter run -d chrome --dart-define=API_BASE_URL=http://localhost:3000

# macOS desktop
flutter run -d macos --dart-define=API_BASE_URL=http://localhost:3000

# Emulador Android — ATENÇÃO ao endereço
flutter run -d emulator-5554 --dart-define=API_BASE_URL=http://10.0.2.2:3000

# iOS Simulator
flutter run -d iPhone --dart-define=API_BASE_URL=http://localhost:3000
```

---

## 3. Fluxo mínimo exigido pelo enunciado

> *"At least one flow (e.g. **Birthday + Friend**) must work end-to-end."*

1. Abrir o app
2. `occasion` = **Birthday**
3. `relationship` = **Friend**
4. Tocar em **Generate**
5. Ver o indicador de carregamento
6. Ver **3 sugestões** na tela

---

## 4. Verificar o fallback

O caminho mais importante do teste. Três formas, da mais simples à mais realista:

### A. Key inválida → `llm_auth_error`

```bash
cd backend
OPENAI_API_KEY=invalid-key npm run dev
```

### B. Timeout absurdamente curto → `llm_timeout`

```bash
LLM_TIMEOUT_MS=1 npm run dev
```

Provavelmente a demonstração mais convincente: o provider está saudável, a rede está boa,
e ainda assim o orçamento de tempo estoura — que é exatamente o cenário de produção.

### C. Sem rede

Desligue o Wi-Fi com o servidor rodando → `llm_unavailable`.

**Em qualquer um dos três casos**, o resultado esperado é o mesmo:

- HTTP **200** (não erro)
- `data.degraded` = `true`
- `data.source` = `"fallback"`
- `meta.reason` com o motivo específico
- No app: as sugestões aparecem normalmente, com um aviso discreto de qualidade reduzida

```bash
curl -sS -X POST http://localhost:3000/api/v1/suggestions \
  -H 'Content-Type: application/json' \
  -d '{"occasion":"birthday","relationship":"friend"}' \
  | jq '{degraded: .data.degraded, source: .data.source, reason: .meta.reason}'
```

---

## 5. Testes

```bash
# Backend — 707 testes, ~2,5 s
cd backend
npm test
npm run test:coverage

# Tudo de uma vez: typecheck, lint, formatação e testes
npm run verify

# Flutter
cd flutter_app
flutter test
flutter test --coverage
```

Os testes **não precisam de API key nem de rede** — os providers são substituídos por
duplos de teste. É um efeito direto da arquitetura de ports
([`ADR-0001`](../01-architecture/decisions/adr-0001-clean-architecture-backend.md)).

### Suíte live de red-team — opcional, gasta dinheiro

```bash
RUN_LIVE_SECURITY_TESTS=true npm run test:security:live
```

Dispara os 38 payloads do corpus contra o **modelo real** e regenera
[`docs/05-security/live-redteam-report.md`](../05-security/live-redteam-report.md).
Custa centavos e leva cerca de um minuto.

**Não é necessária para avaliar o projeto.** Ela está fora do `npm test` por construção —
config separada, mais duas portas (a variável e a key) — justamente para que nada que gaste
dinheiro rode por acidente. O relatório da última execução já está no repositório.

---

## Troubleshooting

### `[config] Invalid environment: OPENAI_API_KEY: required`
O `.env` não foi criado ou a key está vazia. `cp .env.example .env` e preencha.
O servidor falha na subida de propósito — ver [`environment.md`](environment.md).

### App mostra erro de conexão, mas o `curl` funciona

**Emulador Android:** use `10.0.2.2`, não `localhost`.

```bash
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000
```

**Dispositivo físico:** descubra o IP da máquina e garanta a mesma rede.

```bash
ipconfig getifaddr en0        # macOS
flutter run --dart-define=API_BASE_URL=http://192.168.0.42:3000
```

### Erro de CORS no Flutter Web
Em desenvolvimento o backend responde `Access-Control-Allow-Origin: *`. Se aparecer erro
de CORS, verifique se `NODE_ENV` não está como `production` — nesse modo, só as origens
de `CORS_ORIGINS` são aceitas.

### `EADDRINUSE: address already in use :::3000`

```bash
lsof -ti:3000 | xargs kill -9
# ou
PORT=3001 npm run dev
```

Se trocar a porta, lembre de ajustar o `--dart-define` do app.

### Todas as respostas voltam `degraded: true`
O LLM está falhando. Investigue pelo motivo em `meta.reason`:

| `reason` | Causa provável |
|---|---|
| `llm_auth_error` | Key errada, expirada ou sem crédito |
| `llm_rate_limited` | Cota do provider estourada |
| `llm_timeout` | `LLM_TIMEOUT_MS` baixo demais, ou provider lento |
| `llm_unavailable` | Sem rede, ou incidente no provider |
| `llm_invalid_response` | Modelo devolveu formato inesperado — ver log em `debug` |

### As sugestões vêm sempre iguais
É o cache funcionando (`meta.cached: true`). Para desativar:

```bash
CACHE_ENABLED=false npm run dev
```

Trade-off documentado em [`ADR-0006`](../01-architecture/decisions/adr-0006-caching-and-cost.md).
