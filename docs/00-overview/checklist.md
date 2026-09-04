# Checklist de execução — status ao vivo

Cada item numerado corresponde a uma fase em [`../02-phases/`](../02-phases/). Este
arquivo é atualizado ao fim de cada fase.

Os itens **5 e 6 foram acrescentados** ao checklist original, quando ficou claro que o LLM
não é apenas uma dependência que pode cair — é uma superfície de ataque. Os demais
mantiveram o conteúdo e foram renumerados.

`✅ feito` · `🚧 em andamento` · `⬜ pendente`

> **Convenção.** Uma caixa aberta dentro de uma fase marcada como ✅ significa **desvio
> consciente**, e vem sempre com o motivo ao lado — nunca tarefa esquecida. Promessa com
> data futura (*"na fase N"*) é fechada quando a fase N entrega, e não fica pendurada.

**Progresso geral:** 15 / 17 fases concluídas

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
- [x] Cleartext HTTP restrito ao build de debug — entregue na [fase 09](../02-phases/phase-09-flutter-app.md), **verificado nos quatro binários**

## 7. Implementar diferenciais no backend — ✅
→ [`phase-07-backend-extras.md`](../02-phases/phase-07-backend-extras.md)

- [x] Rate limiting — 30 / 5 min por IP, `429` com `Retry-After`, sem fallback
- [x] Timeout explícito para chamadas ao LLM *(fase 04)*
- [x] Tipagem das respostas — inferida dos mesmos schemas que geram o OpenAPI
- [x] Configuração de CORS — por ambiente; `*` **impede o boot** em produção
- [x] Estrutura preparada para cache *(antecipado para a fase 02)*
- [x] Explicar no README se o cache foi ou não implementado — [`README.md#cost-and-caching`](../../README.md#cost-and-caching), na [fase 14](../02-phases/phase-14-readme.md)
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
- [x] 🔒 Suíte live de red-team (gated, pulada por default) — executada; [relatório](../05-security/live-redteam-report.md)

## 9. Criar aplicativo Flutter — ✅
→ [`phase-09-flutter-app.md`](../02-phases/phase-09-flutter-app.md)

- [x] Criar projeto com Flutter 3.44
- [x] Criar tela principal
- [x] Campo para `occasion`
- [x] Campo para `relationship`
- [x] Seletor de `tone` *(além do checklist — o backend já aceitava)*
- [x] Botão para gerar sugestões
- [x] Exibir as 2–3 sugestões retornadas, com botão de copiar
- [x] 🔒 Sugestão renderizada só com `Text`
- [x] 🔒 Cleartext HTTP restrito a debug — verificado nos quatro binários

## 10. Organizar arquitetura Flutter — ✅
→ [`phase-10-flutter-architecture.md`](../02-phases/phase-10-flutter-architecture.md)

- [x] Separar UI — um widget por arquivo, page só compõe
- [x] Separar gerenciamento de estado — `SuggestionsStore` (`ChangeNotifier`)
- [x] Separar API client / repository — 4 camadas Clean Dart
- [x] Criar models para request/response — Entity × Model × DTO
- [x] Tornar a URL do backend configurável — `--dart-define` + modal em runtime
- [x] 22 testes estáticos guardando as três regras

## 11. Implementar estados da interface — ✅
→ [`phase-11-ui-states.md`](../02-phases/phase-11-ui-states.md)

- [x] Estado inicial
- [x] Loading
- [x] Success
- [x] Error — separado em campo × conexão
- [x] **Degradado** *(quarto estado, além do checklist)*
- [x] Desabilitar ações durante a requisição
- [x] Feedback que nomeia causa e ação

## 12. Testar fluxo completo — ✅
→ [`phase-12-end-to-end.md`](../02-phases/phase-12-end-to-end.md)

- [x] Flutter → Backend → LLM → Backend → Flutter
- [x] Testar **Birthday + Friend** — e o mesmo fluxo em português
- [x] Falha do LLM **real** (credencial inválida) → fallback verificado
- [x] Injeção barrada chega ao cliente como problema de campo

## 13. Criar testes Flutter — ✅
→ [`phase-13-flutter-tests.md`](../02-phases/phase-13-flutter-tests.md)

- [x] Widget test da tela principal — os cinco estados
- [x] Testar loading
- [x] Testar exibição das sugestões
- [x] Testar estado de erro
- [x] Testar o aviso de degradação
- [x] Unit test do store e do use case
- [x] 95 testes offline, sem rede e sem backend

## 14. Caprichar no README — ✅
→ [`phase-14-readme.md`](../02-phases/phase-14-readme.md)

- [x] Explicar como executar o backend
- [x] Explicar como executar o Flutter
- [x] Explicar configuração do `.env`
- [x] Explicar configuração da URL do backend
- [x] Documentar endpoint, request e response
- [x] Adicionar diagrama da arquitetura
- [x] Explicar arquitetura escolhida
- [x] Explicar tratamento de erros
- [x] Explicar estratégia de fallback
- [x] Explicar decisão sobre rate limiting
- [x] Explicar estratégia de custos em produção
- [x] Explicar decisão sobre cache
- [x] 🔒 Explicar o modelo de ameaça e as defesas contra prompt injection
- [x] Explicar como a IA foi utilizada no desenvolvimento
- [x] Explicar quais decisões foram tomadas pelo autor

## 15. Comparar os três providers 🔬 — ✅
→ [`phase-15-llm-benchmark.md`](../02-phases/phase-15-llm-benchmark.md)

- [x] Medir latência dos três ao vivo
- [x] Medir tokens de entrada e saída
- [x] Calcular custo por requisição com preço lido por máquina
- [x] Comparar qualidade da saída nos mesmos cenários
- [x] Testar idioma (`pt`) e tom
- [x] Testar resistência à injeção com a camada 1 contornada
- [x] Decidir o provider default com base na medição
- [x] Fechar a limitação declarada `D67` (OpenRouter e Gemini nunca verificados ao vivo)

## 16. Revisão antes da entrega — ⬜
→ [`phase-16-pre-delivery-review.md`](../02-phases/phase-16-pre-delivery-review.md)

- [ ] Rodar formatter/linter do TypeScript
- [ ] Rodar `flutter analyze`
- [ ] Rodar testes backend
- [ ] Rodar testes Flutter
- [ ] **Confirmar que nenhuma API Key foi commitada**
- [ ] Conferir `.gitignore`
- [ ] 🔒 Executar o [checklist de segurança](../05-security/security-checklist.md) completo
- [ ] 🔒 Confirmar cleartext HTTP restrito ao build de debug
- [ ] Fazer clone limpo e verificar se o README realmente funciona

## 17. Entrega — ⬜
→ [`phase-17-delivery.md`](../02-phases/phase-17-delivery.md)

- [ ] Fazer commits organizados
- [ ] Push da branch
- [ ] Abrir Pull Request para o repositório original
- [ ] Descrição curta explicando a implementação
- [ ] Conferir se o avaliador consegue acessar o fork/branch
