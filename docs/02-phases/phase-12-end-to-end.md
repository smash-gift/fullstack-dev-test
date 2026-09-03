# Fase 12 — Fluxo ponta a ponta

**Status:** ⬜ pendente · **Checklist:** item 12

> *"At least one flow (e.g. **Birthday + Friend**) must work end-to-end."*

## Objetivo

Validar manualmente a cadeia inteira — **nos dois caminhos**: o feliz e o degradado.

## Tasks

- [ ] Flutter → Backend
- [ ] Backend → LLM
- [ ] LLM → Backend
- [ ] Backend → Flutter
- [ ] Testar **Birthday + Friend**
- [ ] Simular falha do LLM e verificar o fallback

## Roteiro A — caminho feliz

```bash
# terminal 1
cd backend && npm run dev

# terminal 2
cd flutter_app && flutter run -d chrome --dart-define=API_BASE_URL=http://localhost:3000
```

| # | Ação | Esperado |
|---|---|---|
| 1 | App abre | Estado Idle, formulário visível |
| 2 | `occasion` = Birthday | Campo aceita seleção e digitação |
| 3 | `relationship` = Friend | Idem |
| 4 | Tocar Generate | Loading aparece, botão desabilita |
| 5 | Aguardar | 2–3 sugestões aparecem |
| 6 | Ler as sugestões | 1–2 frases, coerentes com aniversário de amigo |
| 7 | Copiar uma | Confirmação visual |
| 8 | Conferir o log do backend | `info` com `requestId`, sem key |
| 9 | Gerar de novo, igual | `meta.cached: true`, resposta instantânea |

## Roteiro B — caminho degradado

```bash
# terminal 1 — timeout impossível de cumprir
cd backend && LLM_TIMEOUT_MS=1 npm run dev
```

| # | Ação | Esperado |
|---|---|---|
| 1 | Birthday + Friend + Generate | Loading aparece |
| 2 | Aguardar | **Sugestões aparecem** — não erro |
| 3 | Observar a tela | Aviso discreto de qualidade reduzida |
| 4 | Inspecionar a resposta | `200` · `degraded: true` · `source: fallback` · `reason: llm_timeout` |
| 5 | Ler as sugestões | Coerentes com birthday+friend, ainda que genéricas |
| 6 | Log do backend | `warn` com o motivo — **sem stack trace** |
| 7 | Tocar Tentar novamente | Fluxo repete sem travar |

**O passo 2 é o teste inteiro em uma linha.** Se aparecer erro em vez de sugestões, o
requisito central não foi cumprido.

## Roteiro C — outros modos de falha

| Cenário | Como | `reason` esperado |
|---|---|---|
| Key inválida | `OPENAI_API_KEY=invalid npm run dev` | `llm_auth_error` |
| Sem rede | Desligar Wi-Fi com o servidor rodando | `llm_unavailable` |
| Backend fora | Parar o servidor | Erro **no app** (não é caso de fallback) |

O último merece nota: se o **backend** está fora, não há fallback possível — o fallback
mora no backend. Aí o app mostra estado de erro com "Tentar novamente", que é o
comportamento correto.

## Roteiro D — outras plataformas

| Alvo | Comando | Observação |
|---|---|---|
| Chrome | `flutter run -d chrome` | Verificar CORS |
| macOS | `flutter run -d macos` | — |
| Android (emulador) | `--dart-define=API_BASE_URL=http://10.0.2.2:3000` | **Não** usar `localhost` |
| iOS Simulator | `localhost` funciona | — |

## Critério de pronto

- [ ] Roteiro A completo, sem erro
- [ ] Roteiro B mostra sugestões + aviso, nunca tela de erro
- [ ] Os três cenários do roteiro C se comportam como previsto
- [ ] Funciona em pelo menos duas plataformas
- [ ] Nenhuma key aparece em log
- [ ] Nenhuma resposta contém stack trace
- [ ] Capturas de tela dos estados salvas para o README

## Riscos

| Risco | Mitigação |
|---|---|
| Funcionar só na máquina de desenvolvimento | Fase 15 faz clone limpo seguindo o README |
| CORS quebrar no Flutter Web | Testado explicitamente no roteiro D |
| Fallback nunca ser exercitado de verdade | Roteiro B é obrigatório para fechar a fase |
