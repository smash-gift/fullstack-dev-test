# Uso de IA no desenvolvimento

> **Este documento é um item avaliado.** O enunciado pede:
>
> *"if you used an AI assistant — **how you used it and what you implemented or decided
> yourself**."*
>
> A resposta honesta e específica é mais útil — para você e para mim — do que uma
> declaração genérica de "usei IA para acelerar". O que segue é o registro real.
>
> **Status:** este arquivo é atualizado ao fim de cada fase. Hoje ele cobre até a **fase
> 14** — backend, app Flutter, testes e README, ou seja, todo o código entregue. As seções
> foram preenchidas conforme o trabalho aconteceu, **e não antes**, porque descrever
> trabalho que ainda não aconteceu seria ficção.

---

## Ferramenta

**Claude Code** (Anthropic), no terminal, com acesso ao sistema de arquivos e ao shell.
Modelo: Claude Opus 5.

---

## O modelo de trabalho adotado

Não foi "pedir código pronto". O ciclo, repetido a cada bloco de trabalho, foi:

```
1. Eu defino a intenção e as restrições
        ↓
2. O assistente levanta ambiguidades e apresenta opções com trade-offs
        ↓
3. EU decido    ← este passo nunca foi delegado
        ↓
4. O assistente redige/implementa a decisão
        ↓
5. Eu reviso, corrijo e aprovo antes do commit
```

A regra operacional dada ao assistente no início da sessão foi explícita:
**"se não souber ou se for necessária minha decisão, pergunte; jamais invente fatos ou
regras."** Isso mudou o comportamento de forma verificável — o assistente parou o trabalho
para perguntar em vez de assumir em pelo menos três momentos documentados abaixo.

---

## O que **eu** decidi

Registro completo em [`../00-overview/decisions-log.md`](../00-overview/decisions-log.md),
com a autoria marcada linha a linha. Resumo do que foi decisão humana:

| Decisão | O que eu determinei |
|---|---|
| **Arquitetura** | Clean Architecture + SOLID nos dois projetos, com modularização |
| **Três adapters de LLM** | Não aceitei restringir a um provider — quis a substituição demonstrável |
| **Provider default** | OpenAI, para cumprir a letra do enunciado (ver conflito abaixo) |
| **Firebase fora do runtime** | Decisão minha após o assistente apresentar quatro caminhos |
| **`ChangeNotifier` em vez de MobX** | Abri mão do meu padrão pessoal para eliminar codegen |
| **DI manual, sem `flutter_modular`** | Não se justifica com um módulo só |
| **Rate limit e cache** | Implementar ambos, apesar de serem opcionais no enunciado |
| **Idioma** | README em inglês, `/docs` em português, código 100% em inglês |
| **`/docs` por fases** | 1 fase = 1 item do checklist, para não haver trabalho fora de rastreio |
| **Regra de código** | Nenhum `try/catch` sem tratamento explícito no `catch` |
| **Segurança como escopo** | Exigi cobertura de prompt injection e dos riscos conhecidos de IA, com testes — o enunciado não pede |
| **Red-team ao vivo** | Suíte que dispara injeções reais contra o modelo, gated e pulada por default |
| **Deploy** | Adiar a decisão até existir artefato pronto |

---

## Os três momentos em que o assistente mudou o rumo

Estes são os pontos onde o uso de IA agregou algo além de velocidade de digitação. Cada
um está documentado no ADR correspondente.

### 1. O conflito OpenRouter × enunciado

**O que eu queria.** Usar OpenRouter como gateway, pela facilidade de trocar de modelo.

**O que o assistente apontou.** Que o enunciado exige literalmente *"Call one LLM provider
(OpenAI **or** Google AI)"* e que OpenRouter, sendo um intermediário, não é nenhum dos
dois — o que um avaliador criterioso poderia marcar como requisito não atendido, logo no
primeiro critério da lista ("Correctness").

**Como resolvi.** Mantive os três adapters, mas promovi **OpenAI a default**. Cumpre a
letra do requisito sem abrir mão da flexibilidade.

→ [`ADR-0002`](../01-architecture/decisions/adr-0002-llm-provider-port-and-adapters.md)

### 2. A questão do Firebase

**O que eu perguntei.** Se o Firebase citado no cabeçalho do enunciado seria o banco de
dados da solução.

**O que o assistente levantou.** Duas evidências textuais que eu não havia isolado: que
Firebase aparece **uma única vez** no documento inteiro e está **ausente da seção
*Prerequisites*** — que lista explicitamente a necessidade de uma key de LLM; e que a
feature especificada é *stateless*, sem entidade a persistir. Apresentou quatro caminhos,
incluindo abrir uma issue no repositório original (opção que o próprio enunciado sugere).

**Como resolvi.** Fora do runtime, com ADR dedicado documentando onde cada peça
encaixaria. Preserva o "clone e roda", que é critério avaliado.

→ [`ADR-0008`](../01-architecture/decisions/adr-0008-firebase-out-of-runtime.md)

### 3. A lacuna de segurança — apontada por mim

**O que faltava.** A proposta de arquitetura do assistente tratava o LLM apenas como
dependência que pode **falhar** — timeout, `429`, `5xx`. Eu apontei que faltava a dimensão
de **segurança**: o LLM também é superfície de ataque, e o projeto precisava cobrir prompt
injection e os demais riscos conhecidos de IA, com testes automatizados.

**O que veio disso.** O assistente montou o modelo de ameaça, mapeou o OWASP LLM Top 10
contra este sistema específico e trouxe uma observação que mudou o desenho: como **o LLM
aqui não tem ferramenta nenhuma**, o pior caso de uma injeção não é execução remota — é
texto arbitrário exibido como nosso produto. Isso deslocou o peso da defesa da entrada para
a **saída**.

**Como resolvi.** Aceitei a estratégia de quatro camadas com peso na validação de saída, e
determinei que a suíte live de red-team fosse implementada mas pulada por padrão, para não
quebrar o requisito de o avaliador conseguir rodar os testes sem API key.

→ [`ADR-0009`](../01-architecture/decisions/adr-0009-llm-security.md) ·
[`05-security/`](../05-security/)

### 4. O status HTTP do fallback

**A pergunta em aberto.** O enunciado pede *"a safe fallback instead of an error stack"*,
mas não define o status.

**O que o assistente propôs.** `200` com `degraded: true`, argumentando que a operação foi
concluída com sucesso — apenas com qualidade reduzida — e que `5xx` significaria "não
consegui atender", o que seria falso. Também descartou `203` por comportamento
inconsistente em proxies e clientes HTTP.

**Como resolvi.** Aceitei a proposta e o raciocínio. É a decisão mais consequente do
projeto inteiro, e o campo `degraded` existe justamente para que o `200` não seja
desonesto com o cliente.

→ [`ADR-0003`](../01-architecture/decisions/adr-0003-fallback-strategy.md)

---

## O que o assistente fez

### Documentação
Redigiu esta pasta `/docs` inteira a partir das minhas decisões: os 10 ADRs, o contrato da
API, os guias operacionais, a seção de segurança e o detalhamento das 16 fases. A estrutura por fases, o idioma
de cada parte e o nível de detalhe foram determinações minhas; a redação é dele, revisada
por mim antes de cada commit.

### Levantamento de ambiguidades
Produziu a análise textual do enunciado que gerou as quatro ambiguidades documentadas em
[`test-requirements.md`](../00-overview/test-requirements.md) — inclusive a leitura de que
*"call one provider"* restringe o runtime, não a base de código.

### Implementação

Escreveu o código dos dois projetos a partir das decisões acima: a API em Clean
Architecture com os três adapters, o fallback, as quatro camadas de defesa contra injeção,
o rate limiting, o documento OpenAPI e o app Flutter em Clean Dart. E escreveu a suíte de
testes — **707 no backend e 95 no app**, todos offline.

Duas coisas dessa parte merecem registro, porque não são "gerar código":

**Mediu antes de instalar.** A dependência prevista para gerar o OpenAPI
(`@asteasolutions/zod-to-openapi`) não entrou: um `npm install --dry-run` contra o projeto
real mostrou que o Zod 4.5 já emite JSON Schema nativamente (`z.toJSONSchema`). Três
dependências a menos, com a propriedade que interessava — schema único validando requisição
e documentando o contrato — intacta.

**Leu o que a dependência executa.** O `swagger-ui-dist` traz `@scarf/scarf`, que roda um
`postinstall` reportando a instalação para um terceiro. O `report.js` foi lido, a opção de
saída encontrada no próprio código, e o *opt-out* entrou no `package.json` — em vez de
`ignore-scripts=true`, que silenciaria o script de instalação de toda dependência. O que
ficou documentado é o caminho de código, não uma requisição medida: fora de uma instalação
real, a chamada não foi reproduzida.

**Verificou no artefato, não no fonte.** As duas regras de cleartext HTTP foram conferidas
nos quatro binários construídos (`aapt2 dump xmltree`, `plutil -p`), e não lendo os
arquivos de configuração. Foi assim que apareceram três coisas que o fonte não mostrava —
entre elas o manifesto de release do Flutter **sem permissão de INTERNET**, que faria toda
requisição falhar num build de produção.

---

## O que o assistente **não** fez

- **Não escolheu a arquitetura.** Clean Architecture + SOLID foi determinação minha, na
  primeira mensagem.
- **Não decidiu nada sozinho em ponto de bifurcação.** Toda decisão da tabela acima passou
  por pergunta explícita antes de virar código ou documento.
- **Não commitou nada sem aprovação.** Toda mensagem de commit foi apresentada para
  autorização antes de executar.
- **Não tratou segurança até eu pedir.** A lacuna existiu, e está registrada acima em vez
  de ser silenciosamente corrigida como se sempre tivesse estado lá.
- **Não inventou dado.** Onde faltava informação verificável — o identificador exato de
  modelo do OpenRouter e do Gemini, por exemplo — deixou o campo marcado como pendente em
  [`environment.md`](../04-operations/environment.md) em vez de chutar um valor com cara
  de correto.

---

## Onde a revisão humana pegou coisa

A parte que mostra que a revisão foi real, e não carimbo.

| O que veio | O que eu determinei |
|---|---|
| Primeira paleta do app, roxa demais em toda a interface | Cor de marca gasta **em um lugar só**; fundo, texto e borda numa escala neutra que serve claro e escuro sem inverter nada |
| Proposta de ir direto para a tela | **Mockup antes do código.** A discussão de layout aconteceu numa página, não em `flutter run` |
| Sugestão de MobX + `flutter_modular`, que é o meu padrão | `ChangeNotifier` e DI manual: um módulo só não justifica container, e codegen é passo a mais para o avaliador |
| Idioma da interface como seletor na tela | `tone` fica na tela; **`language` segue o aparelho** e é o mesmo idioma pedido à API |
| Ajustes de endereço do backend numa segunda rota | **Modal**, para a tela principal continuar sendo uma só, como o enunciado pede |
| Suíte de segurança ao vivo rodando junto com `npm test` | Fora do `npm test`, atrás de duas portas — nada que gaste dinheiro roda por acidente |

E uma regra de processo que vale mais que qualquer item da tabela: **toda mensagem de
commit foi apresentada para eu autorizar antes de executar**, e a API key nunca passou pelo
chat — foi escrita por mim direto no `.env`, e o assistente só confirmou que existia pelo
tamanho e pelo prefixo.

---

## E onde a máquina pegou coisa que eu não pegaria

Distinção que importa: o que segue **não** foi revisão humana. Foi teste falhando, e está
aqui porque essa é a parte que a revisão humana sozinha não alcança.

| O que falhou | O que estava errado |
|---|---|
| 39 casos de fallback no limite HTTP | Os cinco modos de falha estavam cobertos no *use case*, não na resposta que o cliente recebe |
| Teste de log do *error handler* | O teste estava afirmando sobre um **dublê**: `JSON.stringify` de um `Error` é `{}`. Reescrito contra o logger real |
| Cobertura do último ramo do *error handler* | Zero. Era justamente a promessa que o enunciado cobra — *"must not expose raw errors"* |
| Dois payloads do corpus de injeção | Eu classifiquei como "barrado na entrada"; um é **removido** e outro **chega ao modelo**. O corpus ganhou um terceiro resultado que o plano não previa |
| 4 de 22 regras de arquitetura do app | Estavam batendo em **comentários do próprio projeto**, não no código |
| Helper de teste do app | Resolvia a URL de uma string capturada em vez do `SettingsStore` — não espelhava a produção. O teste que trocava o endereço estava certo; o helper é que estava errado |
| Rótulo do relatório de red-team | Dizia "o modelo resistiu". A máquina mede **ausência de saída insegura**, não obediência. Renomeado para `no_unsafe_output`, e o relatório passou a mostrar a saída real — em que o modelo **obedeceu** à injeção de troca de papel |

O último é o mais instrutivo do projeto inteiro: com a camada 1 desligada, o modelo virou
pirata quando mandaram. Nada inseguro chegou ao cliente porque a camada 3 segurou — e é por
isso que a camada 2 nunca aparece como camada esperada em nenhum teste.

---

## Minha posição sobre isso

Usar IA neste teste não foi atalho, foi método — e acho que esconder isso seria pior que
inútil, seria falso, num teste que pede transparência explicitamente.

O valor não esteve em digitar mais rápido. Esteve em ter um interlocutor que releu o
enunciado com atenção literal e trouxe de volta contradições entre o que eu queria fazer e
o que o documento pedia — o caso do OpenRouter é o exemplo mais claro. Eu teria entregue
um gateway onde o enunciado pedia um provider.

O que não delego é o julgamento. Toda vez que houve bifurcação — provider, status HTTP,
Firebase, estado no Flutter — a decisão foi minha, e está registrada com nome, alternativa
descartada e motivo. Um assistente que decide sozinho produz código que ninguém sabe
defender em code review. Este eu sei.
