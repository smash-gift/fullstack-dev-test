# Fase 14 — README

**Status:** ⬜ pendente · **Checklist:** item 14

> **O README é o entregável mais lido do teste.** O enunciado dedica uma seção inteira a
> ele e o inclui nos critérios de avaliação: *"Documentation: Clear run instructions,
> architecture, and explained trade-offs."*

## Objetivo

Escrever o `README.md` da raiz, **em inglês**, cobrindo tudo que o enunciado exige — e
escrito **depois** do código, para descrever o que existe e não o que se pretendia.

## Por que só agora

README escrito antes do código descreve intenção. Se algo mudar durante a implementação —
e sempre muda —, o documento vira mentira sutil: instruções que quase funcionam, comandos
com um parâmetro a menos. É a forma mais comum de documentação errada.

Escrito na fase 14, cada comando pode ser executado e conferido antes de ser publicado. A
fase 15 executa exatamente isso, em clone limpo.

## Tasks

- [ ] Como executar o backend
- [ ] Como executar o app Flutter
- [ ] Configuração do `.env`
- [ ] Configuração da URL do backend
- [ ] Endpoint, request e response documentados
- [ ] Diagrama da arquitetura
- [ ] Explicação da arquitetura escolhida
- [ ] Tratamento de erros
- [ ] Estratégia de fallback
- [ ] Decisão sobre rate limiting
- [ ] Estratégia de custo em produção
- [ ] Decisão sobre cache
- [ ] Uso de IA no desenvolvimento
- [ ] Quais decisões foram do autor
- [ ] Parágrafo sobre o Firebase
- [ ] 🔒 Seção de segurança: modelo de ameaça e defesas contra prompt injection
- [ ] Capturas de tela dos estados

## Estrutura prevista

```markdown
# AI Gift Card Message Suggester

Quick start (backend + app, em 6 comandos)
Prerequisites
Project structure
Architecture (com diagrama)
API contract (endpoint, request, response, erros)
Error handling & fallback strategy   ← seção mais importante
  - What counts as a failure
  - How the client is told
  - Why HTTP 200
Rate limiting
Cost & caching
  - What was implemented here
  - How I would reduce cost in production
Security
  - Threat model in one table
  - Prompt injection: the 4 layers
  - Why output validation is the layer that guarantees
Design decisions & trade-offs
  - Why not Firebase                 ← exigido pelo contexto
  - Why three LLM adapters
  - Why ChangeNotifier over MobX
Running the tests
How I used AI                        ← item avaliado
Screenshots
```

## Regras de redação

1. **Inglês.** É o idioma do enunciado e de quem vai ler.
2. **Comandos copiáveis**, verificados em clone limpo na fase 15.
3. **Quick start acima de tudo.** Quem só quer rodar não deve precisar rolar a página.
4. **Diagramas em Mermaid**, que o GitHub renderiza nativamente — sem imagem para
   manter sincronizada.
5. **Trade-off tem dois lados.** Toda decisão declara o que se perdeu.
6. **Link para `/docs`**, sem repetir o conteúdo inteiro. O README é a porta de entrada,
   não o depósito.

## Vínculo com a matriz de requisitos

Cada item de `D1` a `D4` de
[`../00-overview/test-requirements.md`](../00-overview/test-requirements.md) precisa
apontar para uma seção existente do README ao fim desta fase. A matriz é a lista de
verificação final.

## Critério de pronto

- [ ] Todos os 14 itens do checklist 12 estão cobertos
- [ ] Todo comando foi executado e funciona
- [ ] Diagrama renderiza no GitHub
- [ ] Nenhuma key ou valor real de segredo aparece
- [ ] `D1`–`D4` da matriz marcados como feitos
- [ ] Capturas de tela dos quatro estados incluídas
- [ ] Um leitor que nunca viu o projeto consegue rodá-lo só com o README

## Riscos

| Risco | Mitigação |
|---|---|
| README descrever o que não existe | Escrito depois do código; validado em clone limpo na fase 15 |
| Comando com erro de digitação | Copiado do terminal, não digitado de memória |
| Enterrar o Quick start | Ele é a primeira seção após o título |
| Trade-offs virarem propaganda | Toda seção de decisão declara a desvantagem |
