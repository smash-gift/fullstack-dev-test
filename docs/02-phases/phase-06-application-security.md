# Fase 06 — Baseline de segurança da aplicação

**Status:** ⬜ pendente · **Checklist:** item 6 *(adicionado ao checklist original)*

## Objetivo

Segurança que não é específica de LLM: cabeçalhos HTTP, limites, política de log,
dependências e configuração de cliente.

Referência: [`../05-security/application-security.md`](../05-security/application-security.md)

## Tasks

### HTTP
- [ ] `helmet`
- [ ] `app.disable('x-powered-by')`
- [ ] `express.json({ limit: '4kb' })`
- [ ] Tratamento de JSON malformado → `400`, nunca `5xx`
- [ ] `Content-Type` inválido → `400`
- [ ] Limite de profundidade de aninhamento

### Log
- [ ] Política de nível implementada (`info` × `debug`)
- [ ] Valores de campo e prompt **fora** do nível `info`
- [ ] Key nunca logada, em nenhum nível
- [ ] `requestId` em toda linha
- [ ] Confirmar que o log é JSON estruturado (imune a log injection)

### Segredos
- [ ] Key lida apenas em `pkg/config/env.ts`
- [ ] `.env.example` completo e sem valor real
- [ ] Nenhuma credencial no projeto Flutter

### Dependências
- [ ] `package-lock.json` versionado
- [ ] `npm audit --audit-level=high` limpo
- [ ] Versões fixadas nas dependências de runtime
- [ ] Revisar a necessidade de cada dependência direta

### Cliente
- [ ] Cleartext HTTP **só** em build de debug (Android e iOS)
- [ ] Nenhuma exceção de ATS/cleartext no manifesto de release
- [ ] *(aplicação na [fase 09](phase-09-flutter-app.md); a regra nasce aqui)*

## O que esta fase deliberadamente **não** faz

Aplicar controle onde não há ameaça é teatro. Estas superfícies não existem neste sistema:

| Ausência | Elimina |
|---|---|
| Nenhum banco | SQL / NoSQL injection |
| Nenhuma URL controlada pelo usuário | SSRF |
| Nenhum `exec` / `eval` | Command injection |
| Nenhum upload | Malware, path traversal |
| Nenhuma sessão ou cookie | CSRF, fixação de sessão |
| Nenhuma renderização de HTML no servidor | XSS refletido |

A tabela é parte do entregável: ela diz **o que precisa ser reavaliado** quando alguém
adicionar um desses recursos.

Descartados com justificativa em
[`ADR-0010`](../01-architecture/decisions/adr-0010-application-security.md): WAF,
autenticação de API, CSP restritiva, `--ignore-scripts`, certificate pinning.

## O item que mais merece atenção

**Cleartext HTTP no manifesto.** Para o app falar com `http://10.0.2.2:3000` em
desenvolvimento, Android (API 28+) e iOS exigem permissão explícita de tráfego não
criptografado. Essa permissão vazando para o build de release transformaria **todo** o
tráfego do app em texto claro, interceptável em qualquer rede hostil.

É o tipo de erro que passa despercebido justamente porque "funciona". Vira item
**bloqueante** no checklist da fase 15.

## Critério de pronto

- [ ] Cabeçalhos do `helmet` presentes na resposta
- [ ] `X-Powered-By` ausente
- [ ] Corpo acima de 4 KB → `413`
- [ ] JSON malformado → `400`, sem `5xx`
- [ ] Log em `info` sem key, sem prompt, sem valores de campo
- [ ] `npm audit --audit-level=high` limpo
- [ ] Cleartext restrito a debug, verificado por grep no manifesto

## Riscos

| Risco | Mitigação |
|---|---|
| `helmet` quebrar o Swagger UI | Testar `/docs` após ativar; ajustar só o necessário |
| Limite de corpo apertado demais | 4 KB para campos de 60 caracteres tem folga ampla |
| Cleartext vazar para release | Item bloqueante na fase 15, verificado por comando |
| Dependência sem correção disponível | Avaliar exposição real e registrar a decisão, em vez de ignorar |
