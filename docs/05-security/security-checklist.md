# Checklist de segurança — verificação pré-entrega

Executado na [`fase 16`](../02-phases/phase-16-pre-delivery-review.md) em **2026-09-03**, com
o resultado de cada bloco registrado lá. Todo item é verificável por comando ou por inspeção
objetiva — nada aqui depende de opinião. As caixas abaixo refletem aquela execução; para
reexecutar, os comandos estão em cada bloco.

---

## 1. Segredos ⛔ bloqueante

```bash
# Nenhum .env rastreado pelo Git
git ls-files | grep -E '\.env$' && echo "FALHA" || echo "ok"

# Nenhum padrão de key em todo o histórico
git log -p --all | grep -nE '(sk-[A-Za-z0-9]{20,}|AIza[0-9A-Za-z_-]{30,}|sk-or-v1-[A-Za-z0-9]{20,}|AQ\.[A-Za-z0-9]{20,})' \
  && echo "FALHA" || echo "ok"

# Nenhuma key na árvore atual
grep -rnE '(sk-[A-Za-z0-9]{20,}|AIza[0-9A-Za-z_-]{30,})' \
  --exclude-dir=node_modules --exclude-dir=.git . && echo "FALHA" || echo "ok"

# Nenhuma credencial no Flutter
grep -rniE '(api[_-]?key|secret|bearer)' flutter_app/lib/ && echo "revisar" || echo "ok"

# .env.example sem valor real
cat backend/.env.example
```

- [x] Todos os cinco comandos limpos
- [x] `.env` no `.gitignore`
- [x] Key lida **apenas** em `pkg/config/env.ts`

> **Se qualquer um falhar: revogue a key no provider ANTES de tentar limpar o histórico.**
> Repositório público é varrido por bots em minutos; limpar o histórico primeiro resolve a
> aparência, não o vazamento.

## 2. Defesas de LLM

- [x] Sanitizador aplica NFKC **antes** de qualquer verificação
- [x] Bidi, zero-width, controle e tags Unicode rejeitados
- [x] `\n`, `\r`, `\t` rejeitados
- [x] Allowlist de caracteres ativa
- [x] Entrada acentuada e não-latina legítima continua aceita
- [x] System prompt é **constante** — nenhuma interpolação de dado do usuário
- [x] Entrada vai como valor JSON na mensagem de usuário
- [x] Canário presente, regenerado por processo, nunca versionado
- [x] Guard de saída rejeita URL, e-mail, HTML, markdown de link, cerca de código, canário
- [x] Guard de saída rejeita meta-resposta
- [x] Toda rejeição termina em fallback, nunca em `5xx`
- [x] Resposta de injeção bloqueada é **indistinguível** da de timeout

## 3. Renderização (Flutter)

```bash
grep -nE "^\s+(flutter_html|flutter_markdown|linkify):" flutter_app/pubspec.yaml && echo "FALHA" || echo "ok"
```

- [x] Sugestão renderizada só com `Text` — *teste automatizado*
- [x] Nenhum widget que interprete marcação — *teste automatizado*
- [x] Sem `linkify` no texto de sugestão — *teste automatizado*
- [x] Nenhum ancestral do texto é `InkWell` ou `GestureDetector` — *teste automatizado*

## 4. HTTP

- [x] `helmet` ativo
- [x] `x-powered-by` desligado
- [x] Limite de corpo em 4 KB
- [x] `CORS_ORIGINS` explícito quando `NODE_ENV=production` *(o boot já impede o contrário)*
- [x] `TRUST_PROXY_HOPS` igual ao número real de proxies à frente
- [x] Rate limit ativo em `/api/v1/*`
- [x] `/health` e `/docs` fora do rate limit
- [x] `429` sem `data` — não degrada para sugestões
- [x] `429` com cabeçalhos de CORS
- [x] CSP presente em `/docs` e ausente nas rotas JSON
- [x] `/docs` servindo só os três assets da allowlist
- [x] Nenhuma resposta de erro com stack trace
- [x] `AbortController` em toda chamada externa

## 5. Log

- [x] Nível `info` sem key, sem prompt, sem valores de campo
- [x] Nível `info` com `requestId`
- [x] Log estruturado em JSON (imune a log injection)
- [x] Key nunca logada, em nenhum nível
- [x] `LOG_LEVEL=info` documentado como obrigatório em produção

## 6. Dependências

```bash
cd backend && npm audit --audit-level=high
cd ../flutter_app && flutter pub outdated
```

- [x] Sem vulnerabilidade `high` ou `critical`
- [x] `package-lock.json` e `pubspec.lock` versionados
- [x] Dependências diretas mínimas e revisadas

## 7. Configuração de cliente

```bash
grep -rn "usesCleartextTraffic\|NSAllowsArbitraryLoads" flutter_app/android flutter_app/ios
```

- [x] Cleartext HTTP permitido **somente** em build de debug
- [x] Nenhuma exceção de ATS/cleartext no manifesto de release

## 8. Testes de segurança

- [x] Suíte offline passa **sem key e sem rede**
- [x] Corpus completo: nenhum `5xx`, nenhuma saída insegura
- [x] Suíte live executada, relatório salvo
- [x] Vazamentos da live: zero, ou corrigidos com caso de regressão

## 9. Documentação

- [x] Modelo de ameaça reflete o sistema construído
- [x] Controles não implementados estão declarados, com motivo
- [x] Limitações de privacidade (T5) registradas
- [x] README em inglês tem seção de segurança

---

## O que fazer se algo falhar

| Falha | Ação |
|---|---|
| **Key exposta** | 1. Revogar no provider · 2. Gerar nova · 3. Limpar histórico · 4. Entender como passou |
| Payload vazou na live | Adicionar como regressão offline · corrigir a defesa · rodar de novo |
| Vulnerabilidade `high` em dependência | Atualizar; se não houver correção, avaliar exposição real e registrar decisão |
| Cleartext em release | Corrigir antes de qualquer publicação — é bloqueante |
