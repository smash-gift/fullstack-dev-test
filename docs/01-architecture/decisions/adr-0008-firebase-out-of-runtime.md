# ADR-0008 — Firebase deliberadamente fora do runtime

**Status:** Aceito · **Data:** 2026-09-03 · **Autoria:** Conjunto (D18)

> Este ADR existe para que a ausência do Firebase seja lida como **decisão**, e não como
> descuido.

## Contexto

O cabeçalho do enunciado diz:

> **Stack:** TypeScript/Node.js, Flutter/Dart, **Firebase (Firestore, Cloud Functions, Auth)**

E essa é a **única** ocorrência de "Firebase" no documento inteiro.

### Onde Firebase aparece — e onde não aparece

| Seção do enunciado | Menciona Firebase? |
|---|---|
| Cabeçalho `Stack:` | ✅ única ocorrência |
| About this test | ❌ |
| Objective | ❌ |
| **Prerequisites** | ❌ |
| Detailed requirements → Backend | ❌ |
| Detailed requirements → Frontend | ❌ |
| Detailed requirements → Documentation | ❌ |
| Tests | ❌ |
| How to run this test | ❌ |
| What we evaluate | ❌ |

### As duas evidências que decidiram a questão

**1. A seção *Prerequisites* lista o que é necessário — e Firebase não está lá.**

> *"Node.js v20+ · Flutter 3.38+ (Dart 3.x) · **LLM API access:** OpenAI API key or Google
> AI key · Git and a GitHub account"*

Quem escreveu o enunciado teve o cuidado de avisar que uma API key de LLM seria necessária.
Se um projeto Firebase também fosse, estaria na mesma lista. A ausência aí é informação.

**2. A feature especificada é *stateless*.**

O fluxo pedido é `occasion + relationship → LLM → 2–3 sugestões → tela`. Não há cadastro,
histórico, favoritos, autenticação ou sessão. **Não existe entidade a persistir.** Um banco
de dados aqui não teria o que guardar.

### Leitura adotada

Aquela linha descreve a **stack da empresa** — o ambiente em que a pessoa contratada
trabalharia — e não o escopo desta prova. Foi assim que interpretamos, e este documento
existe para tornar a interpretação explícita e contestável.

## Opções consideradas

### Opção A — Firestore como cache distribuído
Segundo adapter do port `SuggestionCache`, selecionável por `CACHE_DRIVER`.
- ✅ Encaixe limpo: o port já existe e a assinatura já é assíncrona.
- ❌ Testes passariam a exigir emulador do Firebase.
- ❌ Piora *"Clear run instructions"*, que é critério pontuado.

### Opção B — Cloud Functions como alvo de deploy
Exportar o mesmo Express como `functions.https.onRequest`.
- ✅ Viável sem esforço: o `main/` já separa `app.ts` de `server.ts`.
- ✅ Daria URL pública ao avaliador, no free tier, usando a stack da empresa.
- ❌ Exige projeto Firebase e credenciais que o avaliador não tem como reproduzir.
- ❌ Cold start de Cloud Function somado ao timeout do LLM piora a latência do pior caso.

### Opção C — Firebase Auth protegendo o endpoint
- ✅ Permitiria rate limit por usuário em vez de por IP — melhoria real sobre o `ADR-0005`.
- ❌ **Exigiria tela de login no Flutter, que o enunciado não pede.** O enunciado diz
  *"One main screen"*. Adicionar autenticação seria inventar requisito e aumentar escopo
  em uma prova cronometrada em 4–6 horas.

### Opção D — Fora do runtime, com os encaixes documentados *(escolhida)*
- ✅ Preserva o "clone e roda" em duas linhas de comando.
- ✅ Demonstra domínio da stack da empresa sem impor custo de setup ao avaliador.
- ✅ Torna a ausência auditável: está escrito onde cada peça entraria.
- ❌ Um avaliador que espera ver Firebase rodando não vai encontrar código Firebase.
  Mitigado por este ADR e por um parágrafo dedicado no README em inglês.

## Decisão

**Opção D.** Nenhuma dependência Firebase no runtime, com este documento registrando
exatamente onde cada peça se encaixaria.

Também foi considerado **abrir uma issue no repositório original** para perguntar — o
próprio enunciado convida a isso (*"If anything is unclear, open an Issue"*). Foi
descartado por não haver dúvida bloqueante: a evidência de *Prerequisites* somada à
natureza stateless da feature é suficiente para decidir, e a decisão está documentada e
aberta a contestação aqui.

## Onde cada peça se encaixaria

A arquitetura foi desenhada de modo que essa adição seja aditiva, não invasiva.

### Firestore → adapter de `SuggestionCache`

```
domain/repositories/suggestion-cache.ts        (port — já existe)
        ↑                        ↑
InMemorySuggestionCache    FirestoreSuggestionCache   ← arquivo novo
```

Seleção por `CACHE_DRIVER=memory|firestore` no `container.ts`. **Nenhuma linha do use case
muda** — e é exatamente por isso que a interface foi declarada assíncrona desde o início
([`ADR-0006`](adr-0006-caching-and-cost.md)), mesmo com a implementação em memória sendo
síncrona.

Seria também o lugar natural do **pool de sugestões pré-computadas** descrito como a maior
alavanca de custo no ADR-0006.

### Cloud Functions → entrypoint alternativo

```
main/app.ts       →  monta o Express          (compartilhado)
main/server.ts    →  app.listen()             (execução local / container)
main/function.ts  →  functions.https.onRequest(app)   ← arquivo novo
```

O `app.ts` já é separado do `server.ts` justamente por isso: o Express não sabe **como**
é servido. Um arquivo novo, nenhuma alteração no existente.

### Firebase Auth → middleware + chave de rate limit

```
presentation/middlewares/firebase-auth.middleware.ts   ← arquivo novo
  verifica o ID token → injeta req.user
  rate limit passa a usar req.user.uid em vez do IP
```

Resolveria diretamente as duas fraquezas admitidas no [`ADR-0005`](adr-0005-rate-limiting.md):
NAT compartilhado e IP rotativo. No Flutter, exigiria um módulo `auth/` novo, o que
extrapola o "One main screen" pedido.

### Firestore → telemetria de produto

Coleção registrando, por requisição: `occasion`, `relationship`, `degraded`, latência,
provider e tokens consumidos. Alimentaria três coisas úteis:

- taxa de degradação como métrica de saúde ([`ADR-0003`](adr-0003-fallback-strategy.md));
- quais combinações merecem pré-computação ([`ADR-0006`](adr-0006-caching-and-cost.md));
- custo real por requisição, substituindo estimativa por medição.

**Ressalva importante:** isso guarda dado de uso e exigiria política de retenção e
anonimização antes de ir a produção. Registrar aqui sem essa ressalva seria propor
coleta de dados sem plano de governança.

## Consequências

**Positivas**
- Executar o projeto é `npm install` e `flutter run`. Sem conta em nuvem, sem credencial,
  sem emulador.
- Testes rodam offline e determinísticos.
- Adotar Firebase depois é adicionar arquivos, não refatorar.

**Negativas — assumidas**
- Um avaliador que leu "Firebase" no cabeçalho e esperava vê-lo em uso não encontrará
  código Firebase. **É o risco central desta decisão**, e a mitigação é este documento
  somado a um parágrafo explícito no README em inglês — para que a ausência seja lida
  como escolha argumentada.
- Sem Firestore, o cache não sobrevive a reinício nem é compartilhado entre instâncias
  (limitação já registrada no ADR-0006).
- Sem Auth, o rate limit continua por IP, com as fraquezas admitidas no ADR-0005.
