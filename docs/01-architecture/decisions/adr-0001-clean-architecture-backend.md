# ADR-0001 — Clean Architecture no backend

**Status:** Aceito · **Data:** 2026-09-03 · **Autoria:** Humano (D01)

## Contexto

O escopo funcional deste teste é pequeno: um endpoint que recebe dois campos e chama uma
API externa. Uma leitura apressada sugeriria um único arquivo `server.ts` com a chamada
HTTP dentro do handler — e para o *escopo funcional*, estaria certo.

Mas o enunciado declara o que está sendo medido:

> *"We are interested in your **architectural choices**, error handling, and how you
> document trade-offs — **not only in 'making the API call work.'**"*

E na lista de avaliação: *"Code quality: Readable, structured code; sensible naming and
**separation of concerns**"*.

Há ainda um requisito funcional que empurra na mesma direção: o sistema precisa **trocar
de comportamento quando o LLM falha**. Isso significa que a origem das sugestões é
intercambiável em tempo de execução — LLM, cache ou catálogo de fallback. Intercambiável
em runtime é exatamente o problema que inversão de dependência resolve.

## Opções consideradas

### Opção A — Arquivo único / handler gordo
Toda a lógica dentro do handler Express.

- ✅ Menor número de arquivos; leitura linear imediata.
- ❌ Testar o fallback exige subir servidor HTTP e interceptar rede.
- ❌ Trocar de provider de LLM significa editar a lógica de negócio.
- ❌ Contradiz frontalmente o critério "separation of concerns".

### Opção B — Camadas clássicas (controller → service → client)
Três camadas, dependência apontando para baixo.

- ✅ Familiar, comum em projetos Node.
- ✅ Suficiente para separar HTTP de regra de negócio.
- ❌ O *service* importa o cliente do LLM **diretamente** — a regra de negócio continua
  acoplada ao fornecedor.
- ❌ Testar o service ainda exige mockar o módulo do SDK, não uma interface própria.

### Opção C — Clean Architecture com ports & adapters *(escolhida)*
`domain` (entidades, ports, use cases) · `infra` (adapters) · `presentation` (HTTP) ·
`pkg` (utilitários) · `main` (composition root).

- ✅ O use case depende de `LlmProvider`, uma interface **nossa**. Testar o fallback é
  passar um duplo que lança `LlmTimeoutError` — sem rede, sem servidor, em milissegundos.
- ✅ Três providers de LLM coexistem sem que o use case saiba disso.
- ✅ Espelha o padrão de Clean Architecture que o desenvolvedor já usa em Go, o que
  mantém coerência entre os projetos dele.
- ❌ Mais arquivos e mais indireção do que o escopo funcional exige.
- ❌ Um leitor apressado pode achar exagerado para um endpoint só.

## Decisão

**Opção C.**

O fator determinante não foi purismo: foi o **teste obrigatório de fallback**. O enunciado
pede explicitamente *"at least one test that covers the fallback path when the LLM fails"*.
Com a Opção A ou B, esse teste exige interceptar HTTP e simular falha de rede. Com a Opção
C, é um duplo de teste implementando uma interface de cinco linhas.

Quando a arquitetura torna o requisito mais barato de cumprir, ela está pagando por si.

## Consequências

**Positivas**
- Testes unitários rodam sem rede, sem servidor e sem API key.
- Adicionar provider = 1 arquivo novo + 1 linha na factory. Nenhuma edição em código existente.
- O limite entre "o que o sistema faz" e "com quem ele fala" fica explícito na estrutura
  de pastas, não em convenção verbal.

**Negativas — assumidas conscientemente**
- Para ~500 linhas de lógica, a estrutura é maior que o necessário. **É deliberado:** o
  artefato avaliado é a decisão arquitetural, não a contagem de linhas.
- Rastrear uma requisição atravessa 4 arquivos. Mitigado pelo diagrama de sequência em
  [`../backend.md`](../backend.md).
- Um `container.ts` mal cuidado vira lixão de instanciação. Mitigado por ele ser o **único**
  lugar com permissão de fazer `new` em adapter — o que também o torna fácil de auditar.

**Neutras**
- `pkg/` duplica algumas conveniências que bibliotecas prontas ofereceriam, em troca de
  não acoplar o domínio a elas.
