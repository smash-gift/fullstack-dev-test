# Checklist de execução — status ao vivo

Cada item numerado corresponde a uma fase em [`../02-phases/`](../02-phases/). Este
arquivo é atualizado ao fim de cada fase.

Os itens **5 e 6 foram acrescentados** ao checklist original, quando ficou claro que o LLM
não é apenas uma dependência que pode cair — é uma superfície de ataque. Os demais
mantiveram o conteúdo e foram renumerados.

`✅ feito` · `🚧 em andamento` · `⬜ pendente`

**Progresso geral:** 8 / 16 fases concluídas

---

## 1. Preparar o repositório — ✅
→ [`phase-01-repository-setup.md`](../02-phases/phase-01-repository-setup.md)

- [x] Fazer fork do repositório original
- [x] Clonar o fork
- [x] Criar uma branch (`candidate/tote-araujo`)
- [x] Criar a pasta `backend/` *(`flutter_app/` na fase 09)*

## 2. Criar o backend Node.js + TypeScript — ✅
→ [`phase-02-backend-foundation.md`](../02-phases/phase-02-backend-foundation.md)

- [x] Configurar projeto Node.js 20+ com TypeScript
- [x] Criar endpoint para geração das mensagens
- [x] Receber `occasion` e `relationship`
- [x] Validar os dados recebidos
- [x] Definir contrato claro de request/response
- [x] Separar controller / service / integração com LLM
- [x] Configurar variáveis de ambiente

## 3. Integrar o LLM — ✅
→ [`phase-03-llm-integration.md`](../02-phases/phase-03-llm-integration.md)

- [x] Escolher provider (OpenAI default; OpenRouter e Gemini alternativos)
- [x] Configurar API Key via `.env`
- [x] Criar prompt para geração das mensagens
- [x] Solicitar 2–3 sugestões
- [x] Garantir mensagens curtas, de 1–2 frases
- [x] Tratar/validar a resposta do modelo
- [x] Nunca colocar a API Key no Flutter
- [x] **Executar uma chamada real bem-sucedida** — OpenAI, 2026-09-03

## 4. Implementar tratamento de falhas — ✅
→ [`phase-04-failure-handling.md`](../02-phases/phase-04-failure-handling.md)

- [x] Tratar timeout
- [x] Tratar 429 (rate limit do provider)
- [x] Tratar erros 5xx
- [x] Tratar resposta inválida do LLM
- [x] Não retornar stack trace / erro interno para o Flutter
- [x] Criar mensagens de fallback quando o LLM estiver indisponível
- [x] Registrar erros no backend de forma apropriada

## 5. Segurança do LLM 🔒 — ✅
→ [`phase-05-llm-security.md`](../02-phases/phase-05-llm-security.md)

*Item acrescentado ao checklist original.*

- [x] Sanitização de entrada: NFKC, controle, zero-width, bidi, tags Unicode
- [x] Rejeitar quebra de linha e caracteres fora da allowlist
- [x] Heurística de tentativa de injeção
- [x] System prompt constante, sem interpolação de dado do usuário
- [x] Entrada como valor JSON na mensagem de usuário (spotlighting)
- [x] Canário no system prompt para detectar vazamento
- [x] Guard de saída: URL, e-mail, HTML, markdown, cerca de código, canário
- [x] Guard de saída: detector de meta-resposta
- [x] Toda violação termina no fallback, nunca em `5xx`
- [x] Regra de renderização segura definida para o Flutter

## 6. Baseline de segurança da aplicação 🔒 — ✅ *(backend)*
→ [`phase-06-application-security.md`](../02-phases/phase-06-application-security.md)

*Item acrescentado ao checklist original.*

- [x] `helmet` e `x-powered-by` desligado
- [x] Limite de corpo (4 KB)
- [x] JSON malformado → `400` e `Content-Type` inválido → `415`, nunca `5xx`
- [x] Política de nível de log (`info` × `debug`)
- [x] Key nunca logada, em nenhum nível
- [x] Lockfile versionado e `npm audit` limpo
- [ ] Cleartext HTTP restrito ao build de debug — *fase 09*

## 7. Implementar diferenciais no backend — ✅
→ [`phase-07-backend-extras.md`](../02-phases/phase-07-backend-extras.md)

- [x] Rate limiting — 30 / 5 min por IP, `429` com `Retry-After`, sem fallback
- [x] Timeout explícito para chamadas ao LLM *(fase 04)*
- [x] Tipagem das respostas — inferida dos mesmos schemas que geram o OpenAPI
- [x] Configuração de CORS — por ambiente; `*` **impede o boot** em produção
- [x] Estrutura preparada para cache *(antecipado para a fase 02)*
- [ ] Explicar no README se o cache foi ou não implementado — *o README nasce na fase 14*
- [x] Swagger / OpenAPI *(extra além do checklist)* — `/docs`, gerado dos schemas Zod

## 8. Criar testes do backend — ✅
→ [`phase-08-backend-tests.md`](../02-phases/phase-08-backend-tests.md)

- [x] Testar geração normal de sugestões
- [x] **Testar prioritariamente o fallback quando o LLM falha** — 39 casos, no HTTP
- [x] Testar validação dos parâmetros
- [x] Testar resposta inválida do LLM — inclusive atravessando o adapter real
- [x] Testar rate limiting
- [x] 🔒 Suíte de segurança S1–S6 (sanitizador, guard de saída, corpus, regras estáticas)
- [x] 🔒 Corpus de injeção: nenhum `5xx`, nenhuma saída insegura — 38 payloads
- [x] 🔒 Suíte live de red-team executada, com relatório gerado
- [ ] 🔒 Suíte live de red-team (gated, pulada por default)

## 9. Criar aplicativo Flutter — ⬜
→ [`phase-09-flutter-app.md`](../02-phases/phase-09-flutter-app.md)

- [ ] Criar projeto com Flutter 3.38+
- [ ] Criar tela principal
- [ ] Campo/seleção para `occasion`
- [ ] Campo/seleção para `relationship`
- [ ] Botão para gerar sugestões
- [ ] Exibir as 2–3 sugestões retornadas

## 10. Organizar arquitetura Flutter — ⬜
→ [`phase-10-flutter-architecture.md`](../02-phases/phase-10-flutter-architecture.md)

- [ ] Separar UI
- [ ] Separar gerenciamento de estado
- [ ] Separar API client / repository
- [ ] Criar models para request/response
- [ ] Tornar a URL do backend configurável

## 11. Implementar estados da interface — ⬜
→ [`phase-11-ui-states.md`](../02-phases/phase-11-ui-states.md)

- [ ] Estado inicial
- [ ] Loading
- [ ] Success
- [ ] Error
- [ ] Desabilitar ações quando necessário
- [ ] Exibir feedback claro ao usuário

## 12. Testar fluxo completo — ⬜
→ [`phase-12-end-to-end.md`](../02-phases/phase-12-end-to-end.md)

- [ ] Flutter → Backend
- [ ] Backend → LLM
- [ ] LLM → Backend
- [ ] Backend → Flutter
- [ ] Testar pelo menos **Birthday + Friend**
- [ ] Simular falha do LLM e verificar o fallback

## 13. Criar testes Flutter — ⬜
→ [`phase-13-flutter-tests.md`](../02-phases/phase-13-flutter-tests.md)

- [ ] Widget test da tela principal
- [ ] Testar loading
- [ ] Testar exibição das sugestões
- [ ] Testar estado de erro

## 14. Caprichar no README — ⬜
→ [`phase-14-readme.md`](../02-phases/phase-14-readme.md)

- [ ] Explicar como executar o backend
- [ ] Explicar como executar o Flutter
- [ ] Explicar configuração do `.env`
- [ ] Explicar configuração da URL do backend
- [ ] Documentar endpoint, request e response
- [ ] Adicionar diagrama da arquitetura
- [ ] Explicar arquitetura escolhida
- [ ] Explicar tratamento de erros
- [ ] Explicar estratégia de fallback
- [ ] Explicar decisão sobre rate limiting
- [ ] Explicar estratégia de custos em produção
- [ ] Explicar decisão sobre cache
- [ ] 🔒 Explicar o modelo de ameaça e as defesas contra prompt injection
- [ ] Explicar como a IA foi utilizada no desenvolvimento
- [ ] Explicar quais decisões foram tomadas pelo autor

## 15. Revisão antes da entrega — ⬜
→ [`phase-15-pre-delivery-review.md`](../02-phases/phase-15-pre-delivery-review.md)

- [ ] Rodar formatter/linter do TypeScript
- [ ] Rodar `flutter analyze`
- [ ] Rodar testes backend
- [ ] Rodar testes Flutter
- [ ] **Confirmar que nenhuma API Key foi commitada**
- [ ] Conferir `.gitignore`
- [ ] 🔒 Executar o [checklist de segurança](../05-security/security-checklist.md) completo
- [ ] 🔒 Confirmar cleartext HTTP restrito ao build de debug
- [ ] Fazer clone limpo e verificar se o README realmente funciona

## 16. Entrega — ⬜
→ [`phase-16-delivery.md`](../02-phases/phase-16-delivery.md)

- [ ] Fazer commits organizados
- [ ] Push da branch
- [ ] Abrir Pull Request para o repositório original
- [ ] Descrição curta explicando a implementação
- [ ] Conferir se o avaliador consegue acessar o fork/branch
