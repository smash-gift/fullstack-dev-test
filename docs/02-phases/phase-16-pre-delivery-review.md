# Fase 16 — Revisão pré-entrega

**Status:** ✅ concluída · **Checklist:** item 16

## Objetivo

Provar que o projeto funciona **na máquina de outra pessoa**, e que nenhum segredo vazou.

## Tasks

- [x] Formatter e linter do TypeScript
- [x] `flutter analyze`
- [x] Testes do backend
- [x] Testes do Flutter
- [x] **Confirmar que nenhuma API key foi commitada**
- [x] Conferir `.gitignore`
- [x] 🔒 **Executar o [checklist de segurança](../05-security/security-checklist.md) inteiro**
- [x] 🔒 Confirmar cleartext HTTP restrito ao build de debug
- [x] **Clone limpo e execução seguindo o README**

## Auditoria de segredo — a mais importante

Uma key commitada é o tipo de erro que não dá para desfazer: mesmo removida depois,
permanece no histórico do Git e no fork já publicado.

```bash
# 1. Nenhum .env rastreado
git ls-files | grep -E '\.env$' && echo "FALHA" || echo "ok"

# 2. Nenhum padrão de key no histórico completo
git log -p --all | grep -nE '(sk-[A-Za-z0-9]{20,}|AIza[0-9A-Za-z_-]{30,}|sk-or-v1-[A-Za-z0-9]{20,}|AQ\.[A-Za-z0-9]{20,})' \
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
grep -nE "^\s+(flutter_html|flutter_markdown|linkify):" flutter_app/pubspec.yaml && echo "FALHA" || echo "ok"

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

- [x] Todos os links internos de `/docs` funcionam
- [x] `checklist.md` reflete o estado real
- [x] **Nenhuma caixa aberta dentro de fase marcada como ✅** — exceto desvio consciente com
      o motivo escrito ao lado. Promessa com data futura (*"na fase N"*) é dívida de
      documentação: parece pendência esquecida para quem lê, e some do radar de quem
      escreveu. Verificável por comando:

```bash
# lista toda caixa aberta em documento de fase concluída
grep -rn -- '- \[ \]' docs/02-phases/*.md docs/00-overview/checklist.md
```
- [x] `test-requirements.md` sem item pendente indevido
- [x] `decisions-log.md` inclui as decisões tomadas durante a implementação
- [x] `ai-usage.md` com as seções de implementação preenchidas
- [x] `environment.md` sem pendência de identificador de modelo
- [x] `05-security/` reflete o que foi de fato implementado
- [x] Relatório da suíte live de red-team salvo e datado
- [ ] `deploy.md` atualizado com a decisão final — **não cumprido de propósito**: a decisão
      de publicar é do autor e segue adiada; se houver deploy, a URL entra na
      [fase 17](phase-17-delivery.md)

## Critério de pronto

- [x] Todos os comandos de auditoria passam
- [x] Lint e testes verdes nos dois projetos
- [x] Clone limpo funciona seguindo apenas o README
- [x] Testes rodam sem API key
- [x] Documentação sem link quebrado nem informação desatualizada

## Resultado da execução — 2026-09-03

Tudo abaixo foi executado nesta fase, e o clone limpo saiu do **repositório local** em vez
do GitHub: a fase 17 é que faz o push, e inverter a ordem só para poder clonar seria trocar
a verificação pelo teatro dela. O efeito buscado é o mesmo — nenhum `.env` herdado, nenhum
`node_modules`, nenhuma variável de ambiente da máquina de desenvolvimento.

| Verificação | Resultado |
|---|---|
| `npm run lint` · `format:check` · `build` | limpos |
| `npm test` | **707 passando**, 27 arquivos |
| `flutter analyze` | `No issues found!` |
| `flutter test` | **95 passando**, 4 pulados |
| `npm audit --audit-level=high` | **0 vulnerabilidades** |
| `.env` rastreado pelo Git | nenhum — ignorado por `.gitignore:2` |
| Key no histórico completo ou na árvore | nenhuma |
| Isolamento do `domain` (Express, SDK) | ok |
| R1 — `package:http` fora do adapter | ok |
| R2 — widget declarado em page | ok |
| Caixa aberta em fase concluída | só a intencional da fase 08 |
| Links internos da documentação | **259 verificados, 0 quebrados** |

### O clone limpo, seguindo o README ao pé da letra

| # | Verificação | Resultado |
|---|---|---|
| 1 | `backend/` instala e sobe | ok |
| 2 | `.env.example` traz o necessário | ok |
| 3 | `curl /health` | `{"status":"ok",...,"llmProvider":"stub"}` |
| 4 | `POST /api/v1/suggestions` | 3 sugestões, `degraded: false` |
| 5 | `/docs` | `HTTP 200 text/html` |
| 6 | `flutter pub get` · `analyze` · `test` | ok · limpo · 95 passando |
| 7 | Birthday + Friend ponta a ponta | suíte live, 4 casos contra a API real |
| 8 | Fallback pelo comando do README | `200` · `degraded: true` · `llm_auth_error` |
| 9 | Testes **sem nenhuma API key** | **707 passando** em clone sem `.env` |

O item 9 foi executado com `env -u OPENAI_API_KEY -u OPENROUTER_API_KEY -u GEMINI_API_KEY`,
para que "não precisa de key" não dependesse do ambiente desta máquina.

O item 7 não repetiu a captura de tela: rodou a suíte que dirige a **pilha real do cliente**
contra a API real, primeiro com o provider `stub` e depois contra um backend subido com
credencial inválida de propósito — quatro casos verdes, incluindo o degradado com
`DegradationReason.llmAuthError`. A key inválida **não apareceu no log**, em nenhum nível.

## O que esta fase encontrou

Três defeitos, todos na própria camada de verificação — que é onde ninguém procura.

### 1. e 2. Dois comandos de auditoria casavam com a definição de si mesmos

A auditoria de segredo procurava `sk-or-v1-` **sem exigir nada depois do prefixo**. As quatro
ocorrências no histórico eram a própria regex, escrita nos dois testes de arquitetura e nos
dois documentos que publicam o comando. O mesmo aconteceu com o `grep` de renderização
insegura, que acusou `suggestion_card.dart` por causa do comentário que promete *"never
`flutter_html`, never `flutter_markdown`"*.

Nenhum dos dois era vazamento. Os dois eram piores que um falso positivo isolado: **o comando
mais importante da entrega estava condenado a dizer FALHA para sempre**, e um vazamento real
se perderia no meio do ruído. Um detector que sempre acusa é um detector desligado.

Corrigidos: o padrão de segredo agora exige corpo de key depois do prefixo, e a verificação
de renderização olha a **dependência declarada no `pubspec.yaml`** em vez do texto do código —
que é onde a biblioteca perigosa entraria de verdade.

### 3. O detector não conhecia o formato de key deste projeto

As chaves do Gemini usadas aqui começam com `AQ.`, e nenhum dos dois detectores — nem o de
TypeScript, nem o de Dart — cobria esse prefixo. Uma key colada no código teria passado.

Ambos passaram a cobri-lo, e a correção foi verificada do jeito que este repositório verifica
regra: **plantando a violação**. Com uma credencial falsa em formato `AQ.` dentro de
`src/pkg/config/env.ts`, o teste do backend falha; removida, volta a passar. O mesmo em
`lib/app/core/theme/app_colors.dart` para o Flutter.

### 4. A suíte falhava sozinha uma vez a cada dez execuções

O achado mais sério da fase, e o que quase passou: rodar `npm test` **uma vez** dizia
707 verdes. Rodar trinta vezes dizia outra coisa — **duas a três execuções vermelhas**, em
testes diferentes a cada vez, sem nenhuma mudança de código entre elas.

Um avaliador que rodasse o comando tinha ~10% de chance de ver a suíte quebrada. Não há
defesa possível contra essa primeira impressão, e a explicação "é flaky" é exatamente o que
não se quer dizer numa entrega.

**Duas causas independentes, e nenhuma delas era o transporte no primeiro caso:**

**a) Uma asserção que colidia com os próprios identificadores.** O teste que garante que a
resposta não vaza o motivo de origem fazia `expect(body).not.toContain('401')` sobre o JSON
inteiro. O corpo carrega ids hexadecimais aleatórios — `fb_8f8…`, `req_…` —, e `401` são três
dígitos hexadecimais válidos. Em ~60 caracteres aleatórios, a chance de a sequência aparecer
por acaso é de cerca de **1,4% por execução**. O teste acusava vazamento onde não havia.

Corrigido buscando só nos campos que carregam texto escrito por gente — as sugestões, o
`model`, o `source`, o `reason` e o erro —, com os ids fora da busca. A intenção do teste não
mudou; o que mudou é que ela agora é verificada onde um vazamento poderia estar.

**b) Rotatividade de servidores efêmeros.** O supertest sobe um servidor HTTP por requisição
e o derruba ao fim dela. O arquivo do corpus de injeção fazia isso ~200 vezes em meio segundo.
O resultado eram `ECONNRESET`, `socket hang up` e — a prova definitiva — respostas `403` e
`404` em rotas saudáveis. **Esta API nunca responde `403`**, então aquela resposta veio de um
servidor que não é o nosso.

O que **não** resolveu, e foi revertido por isso: desligar o `keepAlive` do agente global e
manter os servidores abertos até o fim do arquivo, isoladamente, mediram 2/25 contra 2/25 —
nada. O que resolveu foi atacar a origem: o corpus passou a **compartilhar um app** entre os
203 casos, indo de ~200 servidores para 2. O provider é sem estado e o cache está desligado,
então cada caso continua partindo do mesmo lugar; o rate limiter é a única coisa que mudaria
com um app compartilhado, e por isso está explicitamente desligado ali — ele tem arquivo
próprio.

| Medição | Antes | Depois |
|---|---|---|
| `npm test` vermelho | **3 em 30** | **0 em 40** |
| Execuções que precisaram de retry | — | **0 em 40** |
| Tempo do arquivo do corpus | ~500 ms | **183 ms** |
| `flutter test` | 0 em 10 | 0 em 10 |

Há também um `retry: 1` no `vitest.config.ts`, como rede para o resíduo. Ele **não escondeu
nada**: em 40 execuções não chegou a disparar, e a garantia de que não mascara falha real foi
verificada plantando uma — uma asserção deliberadamente errada falha nas duas tentativas e a
suíte volta vermelha.

O método aqui é a lição: **rodar a suíte uma vez não é verificá-la**. Um comando executado
trinta vezes seguidas encontrou o que trinta leituras do código não encontrariam.

### 5. Coverage: 99,58% e 91,64% viraram 100% e 100%

O ciclo de desenvolvimento deste projeto exige 100% de coverage, e a métrica nunca tinha sido
medida. Medida, dizia **99,58% de statements e 93,3% de branches** no backend, e **91,64% de
linhas** no Flutter.

O número do Flutter escondia o pior item: **`http_client_adapter.dart` com 7,7%**. É o arquivo
que a regra R1 existe para proteger — o único que importa `package:http` — e só era exercitado
pelos testes *live*, que ficam pulados sem backend rodando. A camada mais defendida no README
era a menos testada.

| | Antes | Depois |
|---|---|---|
| Backend — statements | 99,58% | **100%** (479/479) |
| Backend — branches | 93,3% | **100%** (218/218) |
| Backend — funções | 100% | **100%** (124/124) |
| Backend — linhas | 99,77% | **100%** (446/446) |
| Backend — testes | 707 | **727** |
| Flutter — linhas | 91,64% | **100%** (634/634) |
| Flutter — testes | 95 | **151** |

**Nenhuma exclusão de coverage foi declarada.** Nem para constantes de tema, nem para
interfaces — o que costuma ser o atalho para um 100% que não significa nada.

#### Cinco branches não eram testáveis, e a resposta foi apagar código

Quatro delas eram guardas que nenhuma entrada podia acionar:

| Guarda | Por que era inalcançável | O que fizemos |
|---|---|---|
| `if (oldest.done) break` no cache | a condição do `while` já garante que o `Map` não está vazio | trocado por `for...of` sobre as chaves, onde os dois ramos acontecem |
| `?? FALLBACK_MESSAGES.en` | `SuggestionLanguage` é exatamente o conjunto de chaves do catálogo | removido; **o compilador já garantia** |
| `if (occasionDefault && ...)` | toda ocasião carrega um `_default` | a garantia virou **tipo**: `RelationshipMessages` exige a chave |
| `byLanguage[DEFAULT_KEY]!` | mesma coisa, com `!` escondendo | os dois `!` sumiram junto |

A quinta — o `Retry-After` quando o *store* não informa `resetTime` — é alcançável por um
store Redis, mas nunca por uma requisição HTTP. Virou `rateLimitedError()`, exportada, com
teste próprio. Mesmo tratamento para o `contentTypeMiddleware`: o cliente do supertest sempre
anexa um `Content-Type` e o Node escreve o `Transfer-Encoding` sozinho, então os dois casos —
um corpo sem tipo declarado, um corpo em *chunks* — são exercitados direto no middleware.

O ganho aqui não é a métrica. É que **três garantias que viviam em comentário agora vivem no
tipo**, e uma ocasião nova sem `_default` deixou de compilar.

#### O que os 56 testes novos do Flutter cobrem

- **`HttpClientAdapter`** contra o `package:http` real, com `MockClient`: corpo e cabeçalho
  enviados, `429` e `500` chegando como resposta e não como exceção, *timeout* e host
  inalcançável virando `HttpClientException`, e — o mais importante — a mensagem original,
  que carrega host e porta, **parando na fronteira**.
- **`Result`**, os dois lados de cada acessor, porque um acessor testado só no caminho feliz
  é como um `null` chega a uma tela.
- **`FailureBanner`**, os cinco ramos: dois já vinham pela página, três nunca tinham sido
  renderizados. Uma frase que ninguém leu é uma frase que pode estar errada.
- **`SettingsDialog`**, as três saídas mais o teclado. Aqui um teste falhou e **estava certo**:
  o botão que abre o diálogo também é um `TextButton`, e contar do zero fazia "cancelar" tocar
  em "resetar" — um teste que passaria exercitando o caminho errado.
- **`AppPalette.copyWith` e `lerp`**, que quem chama é o Flutter ao animar entre temas. Um
  campo esquecido ali não lança erro: congela uma cor enquanto as outras se movem.

## Decisão que continua aberta

O `deploy.md` diz que a decisão de publicar seria tomada ao fim desta fase. **Ela é do autor**,
não desta revisão, e por isso segue registrada como adiada. Se houver deploy, a URL entra na
[fase 17](phase-17-delivery.md).

## Riscos

| Risco | Mitigação |
|---|---|
| Key commitada | Auditoria em 5 comandos; revogar antes de limpar |
| README funcionar só aqui | Clone limpo em `/tmp`, sem `.env` herdado |
| Teste depender de rede | Verificado desligando o Wi-Fi |
| Doc desatualizada | Revisão explícita item a item |
