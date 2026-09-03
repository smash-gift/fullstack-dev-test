# Fase 15 — Revisão pré-entrega

**Status:** ⬜ pendente · **Checklist:** item 15

## Objetivo

Provar que o projeto funciona **na máquina de outra pessoa**, e que nenhum segredo vazou.

## Tasks

- [ ] Formatter e linter do TypeScript
- [ ] `flutter analyze`
- [ ] Testes do backend
- [ ] Testes do Flutter
- [ ] **Confirmar que nenhuma API key foi commitada**
- [ ] Conferir `.gitignore`
- [ ] 🔒 **Executar o [checklist de segurança](../05-security/security-checklist.md) inteiro**
- [ ] 🔒 Confirmar cleartext HTTP restrito ao build de debug
- [ ] **Clone limpo e execução seguindo o README**

## Auditoria de segredo — a mais importante

Uma key commitada é o tipo de erro que não dá para desfazer: mesmo removida depois,
permanece no histórico do Git e no fork já publicado.

```bash
# 1. Nenhum .env rastreado
git ls-files | grep -E '\.env$' && echo "FALHA" || echo "ok"

# 2. Nenhum padrão de key no histórico completo
git log -p --all | grep -nE '(sk-[A-Za-z0-9]{20,}|AIza[0-9A-Za-z_-]{30,}|sk-or-v1-)' \
  && echo "FALHA" || echo "ok"

# 3. Nenhuma key na árvore atual
grep -rnE '(sk-[A-Za-z0-9]{20,}|AIza[0-9A-Za-z_-]{30,})' \
  --exclude-dir=node_modules --exclude-dir=.git . && echo "FALHA" || echo "ok"

# 4. .env.example sem valor real
cat backend/.env.example

# 5. Nada de credencial no Flutter
grep -rniE '(api[_-]?key|secret|token)' flutter_app/lib/ && echo "revisar" || echo "ok"
```

**Se qualquer um falhar**, a key é revogada no provider **antes** de qualquer tentativa de
limpar o histórico. Revogar primeiro; limpar depois. Uma key exposta em repositório
público é varrida por bots em minutos.

## Qualidade estática

```bash
cd backend
npm run lint          # zero erro
npm run format:check  # zero divergência
npm run build         # zero erro de tipo
npm test              # tudo verde

cd ../flutter_app
flutter analyze       # "No issues found!"
flutter test          # tudo verde
```

## Checklist de segurança

O [`security-checklist.md`](../05-security/security-checklist.md) traz nove blocos
verificáveis por comando. Dois são **bloqueantes** — se falharem, não há entrega:

1. **Segredos.** Nenhuma key na árvore nem no histórico. Se falhar: revogar no provider
   **antes** de tentar limpar o histórico. Repositório público é varrido por bots em
   minutos; limpar primeiro resolve a aparência, não o vazamento.
2. **Cleartext HTTP.** Permissão de tráfego não criptografado restrita ao build de debug.

```bash
# renderização segura no Flutter
grep -rn "flutter_html\|flutter_markdown\|linkify" flutter_app/ && echo "FALHA" || echo "ok"

# cleartext só em debug
grep -rn "usesCleartextTraffic\|NSAllowsArbitraryLoads" flutter_app/android flutter_app/ios

# dependências
cd backend && npm audit --audit-level=high
```

## Verificações de regra arquitetural

```bash
# domain do backend não conhece Express nem SDK de LLM
grep -rn "from 'express'"  backend/src/domain/ && echo "FALHA" || echo "ok"
grep -rn "from 'openai'"   backend/src/domain/ && echo "FALHA" || echo "ok"

# R1 — package:http só no adapter
grep -rln "package:http" flutter_app/lib/   # esperado: só http_client_adapter.dart

# R2 — nenhum widget declarado em page
grep -rn "Widget _build" flutter_app/lib/**/pages/ && echo "FALHA" || echo "ok"

# Regra do catch — inspeção manual de cada ocorrência
grep -rn "catch" backend/src/ flutter_app/lib/
```

## Clone limpo — o teste real

```bash
cd /tmp && rm -rf review-check
git clone -b candidate/tote-araujo https://github.com/ToteADS/fullstack-dev-test.git review-check
cd review-check
```

A partir daqui, **seguir o README literalmente**, sem usar conhecimento prévio do projeto.
Cada passo que exigir adivinhação é um defeito do README, e volta para a fase 14.

| # | Verificação |
|---|---|
| 1 | `backend/` instala e sobe seguindo só o README |
| 2 | `.env.example` traz tudo que é necessário |
| 3 | `curl /health` responde |
| 4 | `POST /api/v1/suggestions` funciona |
| 5 | `/docs` abre |
| 6 | `flutter_app/` roda com o comando do README |
| 7 | Birthday + Friend funciona ponta a ponta |
| 8 | `LLM_TIMEOUT_MS=1` demonstra o fallback |
| 9 | `npm test` e `flutter test` passam **sem API key** |

O item 9 merece destaque: o avaliador pode não ter key nenhuma. Se os testes exigirem
credencial, ele não consegue verificar o requisito mais importante do enunciado — o
fallback. Por isso todos os testes usam duplos.

## Revisão da documentação

- [ ] Todos os links internos de `/docs` funcionam
- [ ] `checklist.md` reflete o estado real
- [ ] `test-requirements.md` sem item pendente indevido
- [ ] `decisions-log.md` inclui as decisões tomadas durante a implementação
- [ ] `ai-usage.md` com as seções de implementação preenchidas
- [ ] `environment.md` sem pendência de identificador de modelo
- [ ] `05-security/` reflete o que foi de fato implementado
- [ ] Relatório da suíte live de red-team salvo e datado
- [ ] `deploy.md` atualizado com a decisão final

## Critério de pronto

- [ ] Todos os comandos de auditoria passam
- [ ] Lint e testes verdes nos dois projetos
- [ ] Clone limpo funciona seguindo apenas o README
- [ ] Testes rodam sem API key
- [ ] Documentação sem link quebrado nem informação desatualizada

## Riscos

| Risco | Mitigação |
|---|---|
| Key commitada | Auditoria em 5 comandos; revogar antes de limpar |
| README funcionar só aqui | Clone limpo em `/tmp`, sem `.env` herdado |
| Teste depender de rede | Verificado desligando o Wi-Fi |
| Doc desatualizada | Revisão explícita item a item |
