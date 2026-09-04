# Variáveis de ambiente

## Regra de ouro

**Nenhuma API key existe do lado do Flutter.** O app conhece apenas a URL do backend.
Toda credencial de LLM vive no servidor.

Isso não é preferência de estilo: uma key embarcada em app publicado é extraível por
qualquer pessoa que descompile o binário ou abra o DevTools em uma build web. É a razão
de o enunciado pedir um backend em vez de o app falar direto com o LLM.

---

## Backend — `backend/.env`

O arquivo `backend/.env.example` é versionado, **sem valores reais**. Copie-o:

```bash
cd backend
cp .env.example .env
# edite .env e coloque a key do provider escolhido
```

`.env` está no `.gitignore` da raiz e **nunca** deve ser commitado.

### Servidor

| Variável | Obrigatória | Default | Descrição |
|---|---|---|---|
| `PORT` | ❌ | `3000` | Porta HTTP |
| `NODE_ENV` | ❌ | `development` | `development` \| `production` \| `test` |
| `LOG_LEVEL` | ❌ | `info` | `debug` \| `info` \| `warn` \| `error` |
| `CORS_ORIGINS` | ❌ | `*` | Lista separada por vírgula. Com `NODE_ENV=production`, `*` **impede o boot** |
| `TRUST_PROXY_HOPS` | ❌ | `0` | Quantos proxies reversos estão à frente. `true` é rejeitado — ver abaixo |
| `DOCS_ENABLED` | ❌ | `true` | `false` remove `/docs` e `/docs/openapi.json` |

### Provider de LLM

| Variável | Obrigatória | Default | Descrição |
|---|---|---|---|
| `LLM_PROVIDER` | ❌ | `openai` | `openai` \| `gemini` \| `openrouter` \| `stub` |
| `LLM_TIMEOUT_MS` | ❌ | `8000` | Timeout por tentativa |
| `LLM_MAX_RETRIES` | ❌ | `1` | Retries em timeout/5xx. Nunca em `429` |
| `LLM_TEMPERATURE` | ❌ | `0.8` | Criatividade. Baixo demais gera 3 sugestões iguais |
| `LLM_MAX_OUTPUT_TOKENS` | ❌ | `400` | Teto de saída — impede resposta inflada e limita custo. **Com `LLM_PROVIDER=gemini`, use ≥ 1200:** os `flash` recentes gastam parte deste orçamento raciocinando e truncam o JSON ([fase 15](../02-phases/phase-15-llm-benchmark.md)) |

**Apenas a key do provider ativo é obrigatória.** As outras podem ficar vazias.

> **Sem key, o servidor não sobe** — e a mensagem diz exatamente o que falta:
>
> ```
> Invalid environment:
>   - OPENAI_API_KEY: required when LLM_PROVIDER=openai
>     (or set LLM_PROVIDER=stub to run without credentials)
> ```
>
> **A saída de emergência é `LLM_PROVIDER=stub`**: um provider determinístico, sem rede e
> sem credencial. Permite explorar o contrato, a validação e o formato de resposta sem
> nenhuma API key — útil para quem quer inspecionar o projeto antes de criar conta em
> algum provider.

| Variável | Obrigatória quando | Default | Onde obter |
|---|---|---|---|
| `OPENAI_API_KEY` | `LLM_PROVIDER=openai` | — | https://platform.openai.com/api-keys |
| `OPENAI_MODEL` | ❌ | `gpt-4o-mini` | — |
| `OPENROUTER_API_KEY` | `LLM_PROVIDER=openrouter` | — | https://openrouter.ai/keys |
| `OPENROUTER_MODEL` | ❌ | `openai/gpt-4o-mini` | https://openrouter.ai/models |
| `GEMINI_API_KEY` | `LLM_PROVIDER=gemini` | — | https://aistudio.google.com/apikey |
| `GEMINI_MODEL` | ❌ | `gemini-3.8-flash` | https://ai.google.dev/gemini-api/docs/models |

> **Identificadores confirmados em 2026-09-03** contra os catálogos vivos de cada provider,
> não contra memória — a verificação mudou o valor do Gemini, que hoje está na linha 3.x e
> não na 2.x. As versões são **fixadas** em vez de usar alias `-latest`: um alias que sofre
> hot-swap a cada release muda latência, custo e comportamento sem aviso.
> Detalhes em [`phase-03`](../02-phases/phase-03-llm-integration.md).

### Rate limiting

| Variável | Obrigatória | Default | Descrição |
|---|---|---|---|
| `RATE_LIMIT_ENABLED` | ❌ | `true` | `false` desliga (útil em teste) |
| `RATE_LIMIT_WINDOW_MS` | ❌ | `300000` | Janela — 5 minutos |
| `RATE_LIMIT_MAX` | ❌ | `30` | Máximo por IP na janela |

Escopo: `/api/v1/*`. `/health` e `/docs` ficam de fora — health check de orquestrador bate
por design, e documentação não deve ser bloqueada por engano.

> **`TRUST_PROXY_HOPS` é o que faz o limite valer atrás de um proxy.** Sem ele, toda
> requisição chega com o endereço do proxy e todos os clientes viram um só. Com
> `trust proxy: true` — a correção que ocorre primeiro — o Express passa a acreditar no
> `X-Forwarded-For`, e um chamador forja identidade nova por requisição: o limite fica a um
> cabeçalho de distância de ser contornado. Por isso a variável é uma **contagem**, e o
> schema rejeita `true`.

Ver [`ADR-0005`](../01-architecture/decisions/adr-0005-rate-limiting.md).

### Cache

| Variável | Obrigatória | Default | Descrição |
|---|---|---|---|
| `CACHE_ENABLED` | ❌ | `true` | `false` desliga |
| `CACHE_TTL_MS` | ❌ | `600000` | TTL — 10 minutos |
| `CACHE_MAX_ENTRIES` | ❌ | `500` | Capacidade do LRU |

Ver [`ADR-0006`](../01-architecture/decisions/adr-0006-caching-and-cost.md).

---

## Validação na inicialização

Todas as variáveis são lidas em **um único arquivo**, `src/pkg/config/env.ts`, e validadas
com Zod na subida do processo.

**Se faltar uma variável obrigatória, o servidor não sobe** — ele imprime exatamente o que
falta e encerra com código diferente de zero:

```
[config] Invalid environment:
  - OPENAI_API_KEY: required when LLM_PROVIDER=openai
```

A mesma porta fecha a configuração de CORS insegura:

```
Invalid environment:
  - CORS_ORIGINS: must list explicit origins in production (for example
    https://app.example.com), never *
```

Falhar alto na inicialização é deliberado. A alternativa — subir e falhar na primeira
requisição real — troca um erro claro no `docker run` por um `500` misterioso em produção,
possivelmente horas depois, possivelmente para um usuário.

---

## Flutter — sem `.env`

O app **não** usa arquivo de ambiente. A URL é injetada em tempo de compilação:

```bash
flutter run --dart-define=API_BASE_URL=http://localhost:3000
```

| Chave | Default | Descrição |
|---|---|---|
| `API_BASE_URL` | `http://localhost:3000` | URL base do backend, sem barra final |

Lido em um só lugar, `lib/app/core/config/app_config.dart`.

**Por que não um `.env` como asset.** Arquivo de ambiente empacotado como asset é lido em
runtime e vai junto no bundle — e cria a impressão perigosa de que dá para guardar segredo
ali. Não dá. `--dart-define` resolve em compilação e deixa explícito que o valor é
configuração, não segredo.

### Endereços por plataforma

| Alvo | `API_BASE_URL` |
|---|---|
| Chrome / desktop / iOS Simulator | `http://localhost:3000` |
| **Emulador Android** | `http://10.0.2.2:3000` |
| Dispositivo físico na mesma rede | `http://<IP-da-máquina>:3000` |

`10.0.2.2` é o alias do emulador Android para o `localhost` da máquina host. Usar
`localhost` ali aponta para o próprio emulador, e a conexão falha — é a causa mais comum
de "o app não conecta" nesse cenário.

---

## Checklist de segurança

- [ ] `.env` está no `.gitignore` (raiz) ✅
- [ ] `.env.example` não contém nenhum valor real
- [ ] Nenhuma key aparece em código-fonte
- [ ] Nenhuma key aparece em log, em nenhum nível
- [ ] Nenhuma key existe no projeto Flutter
- [ ] `git log -p | grep -i "sk-"` não retorna nada antes da entrega
