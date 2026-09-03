# Fase 11 — Estados da interface

**Status:** ⬜ pendente · **Checklist:** item 11

> *"Handle **loading, success, and error** states so the user always has clear feedback."*

## Objetivo

Garantir que o usuário **nunca** fique sem saber o que está acontecendo.

## Tasks

- [ ] Modelar o estado com classe selada
- [ ] Estado inicial (Idle)
- [ ] Estado de carregamento
- [ ] Estado de sucesso
- [ ] Estado de erro
- [ ] Aviso de degradação
- [ ] Desabilitar ações quando apropriado
- [ ] Traduzir erro técnico para linguagem de usuário

## Estado selado

```dart
sealed class SuggestionsState {}

class SuggestionsIdle    extends SuggestionsState {}
class SuggestionsLoading extends SuggestionsState {}
class SuggestionsSuccess extends SuggestionsState {
  final List<SuggestionEntity> suggestions;
  final bool degraded;
}
class SuggestionsError   extends SuggestionsState {
  final String message;
  final bool canRetry;
}
```

**Por que selado e não booleanos soltos.** Com `isLoading` + `hasError` + `suggestions`
convivendo, combinações impossíveis se tornam representáveis — *loading* e *error*
verdadeiros ao mesmo tempo, por exemplo. Com estado selado, o `switch` no widget é
exaustivo e o compilador reclama quando um caso novo é esquecido. **Estado ilegal deixa de
ser representável.**

## Comportamento por estado

| Estado | Tela | Botão Generate | Campos |
|---|---|---|---|
| **Idle** | Formulário + orientação | Habilitado se válido | Editáveis |
| **Loading** | Indicador de progresso | **Desabilitado** | Bloqueados |
| **Success** | 2–3 cards copiáveis | Habilitado | Editáveis |
| **Success + degraded** | Idem + aviso discreto | Habilitado | Editáveis |
| **Error** | Mensagem + Tentar novamente | Habilitado | Editáveis |

**Bloquear durante o loading** evita requisições duplicadas por toque repetido — que
custam dinheiro real em token.

## Tradução de erro

O usuário não vê `SocketException` nem `429`. Vê:

| Situação | Mensagem | Tentar de novo? |
|---|---|---|
| Sem conexão | "Check your internet connection and try again." | ✅ |
| Timeout | "This is taking longer than usual. Try again." | ✅ |
| `429` do nosso backend | "Too many requests. Please wait a moment." | ✅ após espera |
| `400` | "Please check the occasion and relationship fields." | ❌ até corrigir |
| `500` | "Something went wrong on our side. Please try again." | ✅ |

O cliente decide a mensagem a partir de `error.code`, **nunca** do texto da mensagem —
código é contrato estável, texto não é
([`ADR-0004`](../01-architecture/decisions/adr-0004-error-taxonomy.md)).

## O aviso de degradação

Quando `degraded: true`, um banner discreto informa que as sugestões não vieram do modelo
de IA e oferece tentar novamente.

**Por que mostrar.** O backend responde `200` mesmo com o LLM fora. Esconder isso seria
mentir por omissão: o usuário acharia que aquele texto genérico foi personalizado para
ele. O aviso é discreto — não bloqueia, não assusta — mas está lá.

**Não é uma tela de erro.** As sugestões aparecem normalmente e são utilizáveis. O aviso
qualifica, não impede.

## Critério de pronto

- [ ] Os quatro estados são visualmente distintos
- [ ] Botão desabilitado durante o loading
- [ ] Toque repetido não dispara requisições duplicadas
- [ ] Nenhuma mensagem técnica chega ao usuário
- [ ] `degraded: true` mostra o aviso e as sugestões juntos
- [ ] Erro oferece caminho de recuperação
- [ ] Estado inicial explica o que fazer, sem parecer quebrado

## Riscos

| Risco | Mitigação |
|---|---|
| Aviso de degradação assustar o usuário | Tom informativo, discreto, não bloqueante |
| Mensagem de erro genérica demais | Uma mensagem por classe de erro, com ação sugerida |
| Loading sem fim se a resposta sumir | Timeout também no cliente, acima do timeout do servidor |
