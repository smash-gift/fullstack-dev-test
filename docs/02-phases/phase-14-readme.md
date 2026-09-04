# Fase 14 — README

**Status:** ✅ concluída · **Checklist:** item 14

> **O README é o entregável mais lido do teste.** O enunciado dedica uma seção inteira a
> ele e o inclui nos critérios de avaliação: *"Documentation: Clear run instructions,
> architecture, and explained trade-offs."*

## Objetivo

Escrever o [`README.md`](../../README.md) da raiz, **em inglês**, cobrindo tudo que o
enunciado exige — e escrito **depois** do código, para descrever o que existe e não o que
se pretendia.

## Por que só agora

README escrito antes do código descreve intenção. Se algo mudar durante a implementação — e
sempre muda —, o documento vira mentira sutil: instruções que quase funcionam, comandos com
um parâmetro a menos.

Escrito na fase 14, cada comando pôde ser executado antes de ser publicado. **Nenhum
comando, payload ou número do README foi digitado de memória:** todos saíram de uma execução
feita nesta fase.

## Tasks

- [x] Como executar o backend
- [x] Como executar o app Flutter
- [x] Configuração do `.env`
- [x] Configuração da URL do backend — tabela por plataforma
- [x] Endpoint, request e response documentados
- [x] Diagrama da arquitetura — dois, em Mermaid
- [x] Explicação da arquitetura escolhida
- [x] Tratamento de erros
- [x] Estratégia de fallback
- [x] Decisão sobre rate limiting
- [x] Estratégia de custo em produção
- [x] Decisão sobre cache
- [x] Uso de IA no desenvolvimento
- [x] Quais decisões foram do autor
- [x] Parágrafo sobre o Firebase
- [x] 🔒 Seção de segurança: modelo de ameaça e defesas contra prompt injection
- [x] Capturas de tela dos estados

## O que foi verificado antes de publicar

Tudo que aparece no README foi produzido nesta fase, nesta máquina:

| Publicado | Como foi obtido |
|---|---|
| `curl /health` e sua resposta | Executado contra o servidor rodando |
| JSON de sucesso, com as três sugestões | Resposta real do `gpt-4o-mini` |
| JSON degradado, com `reason: llm_auth_error` | Segunda instância, subida com key inválida de propósito |
| JSON de `400 VALIDATION_ERROR` | Requisição real com corpo inválido |
| Cabeçalhos `RateLimit-*` e corpo do `429` | 31 requisições contra a instância descartável |
| `707 passed (27 files)` | `npm run verify` |
| `95 passed, 4 skipped` · `No issues found!` | `flutter test` · `flutter analyze` |
| Versões de Node, npm, Flutter e Dart | `node -v`, `npm -v`, `flutter --version` |
| Contagem de tokens e custo unitário | Quatro chamadas reais com o corpo exato que o adapter envia |
| Custo do prompt endurecido (349 tokens) | Mesma requisição com system prompt mínimo, para isolar a diferença |
| Caminho sem API key (`LLM_PROVIDER=stub`) | `.env` de uma linha, servidor subido e requisição respondida |

Os 29 links e caminhos de imagem do README foram conferidos por script: **zero quebrados**.

## As capturas de tela

Os cinco estados não foram montados à mão nem tirados de um mockup. O app foi **construído
para web, servido e dirigido de verdade** — clique nos campos, digitação de `Birthday` e
`Best friend`, toque no botão — com captura em cada estado.

| Estado | Como o estado foi produzido |
|---|---|
| Vazio | App recém-carregado |
| Carregando | Captura 450 ms após o toque, com a requisição em voo |
| Sucesso | Resposta real do modelo — as três frases da tela são as que ele escreveu |
| Degradado | **Mesmo backend, reiniciado com key inválida.** Falha real, não simulada |
| Erro | Backend derrubado antes do toque |

É o mesmo princípio das fases 08 e 09: o que se afirma tem de ser medido no artefato. Uma
tela desenhada à mão provaria só que sei desenhar tela.

## Decisões de redação

**Quick start acima de tudo.** Quem só quer rodar não deve precisar rolar a página: título,
diagrama, capturas, e imediatamente os comandos.

**Trade-off com duas colunas.** A tabela de decisões tem uma coluna chamada *what it costs*.
Decisão sem custo declarado é propaganda, e este projeto tem doze decisões que custaram
alguma coisa.

**A limitação declarada ficou no README, não escondida no `/docs`.** Os adapters de
OpenRouter e Gemini nunca falaram com os serviços reais. Está escrito na página que o
avaliador lê primeiro.

**A falha de segurança medida também.** A seção de segurança conta que, com a camada 1
desligada, o modelo **obedeceu** à injeção — porque é o que a suíte live registrou, e porque
é exatamente o argumento a favor de a garantia estar na saída.

**Custo medido, não estimado.** O enunciado pede como reduzir custo em produção. O README
entrega oito alavancas ordenadas por impacto/esforço **e o custo unitário medido**: 426–428
tokens de entrada e 44–68 de saída, ≈ US$ 0,0001 por requisição não cacheada. A variação de
dois tokens na entrada é o canário de injeção, que muda a cada processo.

E um número que só existe porque foi medido de propósito: trocar o system prompt endurecido
por um de uma linha derruba a entrada de 428 para **79** tokens. **O endurecimento do prompt
custa 349 tokens**, cerca de US$ 0,00005 por requisição — metade do custo unitário do
produto, e ainda assim o controle de segurança mais barato do repositório.

O que continua fora é preço inventado: as contagens de token são medição, os dólares são
tabela do dia. O que eu defenderia daqui a seis meses é a **ordem das alavancas**.

## O que o README fechou na matriz

| Linha | Estava | Agora |
|---|---|---|
| `B9` — reduzir custo em produção | 🟦 | ✅ |
| `B10` — houve cache neste teste, e por quê | 🟦 | ✅ |
| `F6` — como rodar e **qual URL usar** | 🟦 | ✅ |
| `D1`–`D4` — as quatro exigências de documentação | ⬜ | ✅ |
| `P3` — as duas pastas na raiz | 🚧 | ✅ |

## Ficou de fora, e por quê

**A URL de um ambiente publicado.** O deploy ainda não foi decidido — a decisão foi adiada
de propósito até existir artefato pronto. Se houver deploy, a linha entra na
[fase 17](phase-17-delivery.md), junto do PR. O README já cumpre `F6` sem ela: o requisito é
explicar **qual endereço o app deve usar**, e a resposta local é a tabela por plataforma.

## Critério de pronto

- [x] Todos os itens do checklist 14 cobertos
- [x] Todo comando foi executado e funciona
- [x] Diagramas em Mermaid, renderizáveis pelo GitHub
- [x] Nenhuma key ou valor real de segredo no documento
- [x] `D1`–`D4` da matriz marcados como feitos
- [x] Capturas dos cinco estados incluídas
- [x] Um leitor que nunca viu o projeto consegue rodá-lo só com o README
