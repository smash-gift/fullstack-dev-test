# Checklist de segurança — verificação pré-entrega

Executado na [`fase 16`](../02-phases/phase-16-pre-delivery-review.md). Todo item é
verificável por comando ou por inspeção objetiva — nada aqui depende de opinião.

---

## 1. Segredos ⛔ bloqueante

```bash
# Nenhum .env rastreado pelo Git
git ls-files | grep -E '\.env$' && echo "FALHA" || echo "ok"

# Nenhum padrão de key em todo o histórico
git log -p --all | grep -nE '(sk-[A-Za-z0-9]{20,}|AIza[0-9A-Za-z_-]{30,}|sk-or-v1-)' \
  && echo "FALHA" || echo "ok"

# Nenhuma key na árvore atual
grep -rnE '(sk-[A-Za-z0-9]{20,}|AIza[0-9A-Za-z_-]{30,})' \
  --exclude-dir=node_modules --exclude-dir=.git . && echo "FALHA" || echo "ok"

# Nenhuma credencial no Flutter
grep -rniE '(api[_-]?key|secret|bearer)' flutter_app/lib/ && echo "revisar" || echo "ok"

# .env.example sem valor real
cat backend/.env.example
```

- [ ] Todos os cinco comandos limpos
- [ ] `.env` no `.gitignore`
- [ ] Key lida **apenas** em `pkg/config/env.ts`

> **Se qualquer um falhar: revogue a key no provider ANTES de tentar limpar o histórico.**
> Repositório público é varrido por bots em minutos; limpar o histórico primeiro resolve a
> aparência, não o vazamento.

## 2. Defesas de LLM

- [ ] Sanitizador aplica NFKC **antes** de qualquer verificação
- [ ] Bidi, zero-width, controle e tags Unicode rejeitados
- [ ] `\n`, `\r`, `\t` rejeitados
- [ ] Allowlist de caracteres ativa
- [ ] Entrada acentuada e não-latina legítima continua aceita
- [ ] System prompt é **constante** — nenhuma interpolação de dado do usuário
- [ ] Entrada vai como valor JSON na mensagem de usuário
- [ ] Canário presente, regenerado por processo, nunca versionado
- [ ] Guard de saída rejeita URL, e-mail, HTML, markdown de link, cerca de código, canário
- [ ] Guard de saída rejeita meta-resposta
- [ ] Toda rejeição termina em fallback, nunca em `5xx`
- [ ] Resposta de injeção bloqueada é **indistinguível** da de timeout

## 3. Renderização (Flutter)

```bash
grep -rn "flutter_html\|flutter_markdown\|linkify" flutter_app/ && echo "FALHA" || echo "ok"
```

- [x] Sugestão renderizada só com `Text` — *teste automatizado*
- [x] Nenhum widget que interprete marcação — *teste automatizado*
- [x] Sem `linkify` no texto de sugestão — *teste automatizado*
- [x] Nenhum ancestral do texto é `InkWell` ou `GestureDetector` — *teste automatizado*

## 4. HTTP

- [ ] `helmet` ativo
- [ ] `x-powered-by` desligado
- [ ] Limite de corpo em 4 KB
- [ ] `CORS_ORIGINS` explícito quando `NODE_ENV=production` *(o boot já impede o contrário)*
- [ ] `TRUST_PROXY_HOPS` igual ao número real de proxies à frente
- [ ] Rate limit ativo em `/api/v1/*`
- [ ] `/health` e `/docs` fora do rate limit
- [ ] `429` sem `data` — não degrada para sugestões
- [ ] `429` com cabeçalhos de CORS
- [ ] CSP presente em `/docs` e ausente nas rotas JSON
- [ ] `/docs` servindo só os três assets da allowlist
- [ ] Nenhuma resposta de erro com stack trace
- [ ] `AbortController` em toda chamada externa

## 5. Log

- [ ] Nível `info` sem key, sem prompt, sem valores de campo
- [ ] Nível `info` com `requestId`
- [ ] Log estruturado em JSON (imune a log injection)
- [ ] Key nunca logada, em nenhum nível
- [ ] `LOG_LEVEL=info` documentado como obrigatório em produção

## 6. Dependências

```bash
cd backend && npm audit --audit-level=high
cd ../flutter_app && flutter pub outdated
```

- [ ] Sem vulnerabilidade `high` ou `critical`
- [ ] `package-lock.json` e `pubspec.lock` versionados
- [ ] Dependências diretas mínimas e revisadas

## 7. Configuração de cliente

```bash
grep -rn "usesCleartextTraffic\|NSAllowsArbitraryLoads" flutter_app/android flutter_app/ios
```

- [ ] Cleartext HTTP permitido **somente** em build de debug
- [ ] Nenhuma exceção de ATS/cleartext no manifesto de release

## 8. Testes de segurança

- [ ] Suíte offline passa **sem key e sem rede**
- [ ] Corpus completo: nenhum `5xx`, nenhuma saída insegura
- [ ] Suíte live executada, relatório salvo
- [ ] Vazamentos da live: zero, ou corrigidos com caso de regressão

## 9. Documentação

- [ ] Modelo de ameaça reflete o sistema construído
- [ ] Controles não implementados estão declarados, com motivo
- [ ] Limitações de privacidade (T5) registradas
- [ ] README em inglês tem seção de segurança

---

## O que fazer se algo falhar

| Falha | Ação |
|---|---|
| **Key exposta** | 1. Revogar no provider · 2. Gerar nova · 3. Limpar histórico · 4. Entender como passou |
| Payload vazou na live | Adicionar como regressão offline · corrigir a defesa · rodar de novo |
| Vulnerabilidade `high` em dependência | Atualizar; se não houver correção, avaliar exposição real e registrar decisão |
| Cleartext em release | Corrigir antes de qualquer publicação — é bloqueante |
