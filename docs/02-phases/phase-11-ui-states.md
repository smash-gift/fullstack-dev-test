# Fase 11 — Estados da interface

**Status:** ✅ concluída · **Checklist:** item 11

## Objetivo

O enunciado pede três estados. Este backend tem um quarto que nenhum dos três descreve.

## Cinco estados, não três

| # | Estado | O que o usuário vê |
|---|---|---|
| 01 | **Repouso** | Formulário, e nada fingindo ser resultado |
| 02 | **Carregando** | Botão travado dizendo *Writing…*, três esqueletos do tamanho dos cards |
| 03 | **Sucesso** | As sugestões, cada uma com copiar e contagem de caracteres |
| 04 | **Degradado** | Aviso âmbar **e as mensagens** — a requisição deu certo |
| 05 | **Erro** | O que aconteceu, onde, e um botão para tentar de novo |

Cada um tem widget test. Os cinco foram desenhados no
[mockup aprovado](https://claude.ai/code/artifact/c743b834-f7f0-46c9-b385-815461f82c2a)
antes de existir código.

## Degradado é âmbar, não vermelho

`200` com `degraded: true` é o estado que o backend inteiro existe para servir. A requisição
deu certo e as mensagens são utilizáveis; pintar de vermelho ensinaria o usuário a
desconfiar de um resultado perfeitamente bom.

> **Our writer is offline right now.**
> These are hand-picked classics — still yours to use.

O aviso explica sem transformar em falha. Há teste afirmando que o `FailureBanner`
**não** aparece neste estado.

## Erro tem dois lugares, porque são dois problemas

| Problema | Onde aparece | Por quê |
|---|---|---|
| Campo inválido (`400`) | Sob o campo | O usuário conserta ali mesmo |
| Servidor inalcançável | Banner no topo | Não é sobre nenhum campo |

Mostrar os dois no mesmo lugar faria um problema parecer dois. O erro de campo some assim
que o usuário começa a corrigir — deixá-lo enquanto ele digita diz que o app não está
prestando atenção.

## Todo erro nomeia uma causa e uma ação

Nenhuma tela deste app diz "algo deu errado" e para por aí.

| Falha | Texto |
|---|---|
| Conexão | *Can't reach the server. Check that the backend is running at `{url}`.* |
| Timeout | *The server took too long. It may be waking up. Try again in a moment.* |
| Rate limit | *Too many requests. Try again in `{seconds}` seconds.* |
| Servidor | *Something went wrong on our side. Nothing you did.* |

O endereço aparece no texto porque "não consigo conectar" sem dizer **a quê** não dá o que
fazer em seguida. Há teste verificando que a URL configurada aparece na mensagem.

## Modelagem do estado — desvio do plano

O plano pedia uma `sealed class SuggestionsState` com uma subclasse por estado. O que foi
escrito é um `enum SuggestionsStatus` mais os dados ao lado, no mesmo store.

O motivo: a tela precisa de coisas que **atravessam** os estados. Uma falha de retry não
apaga as sugestões anteriores — tirar um resultado utilizável de alguém porque a segunda
tentativa falhou seria punir quem tentou de novo. Com estado selado, `SuggestionsError`
teria de carregar as sugestões antigas, e a separação que a classe selada prometia já
estaria desfeita na primeira exigência real do produto.

O que a classe selada dava de garantia — não esquecer um caso — está preservado onde
importa: o `switch` sobre `SuggestionsFailure`, que **é** selado, é exaustivo. Um tipo novo
de falha não compila até alguém decidir o que o usuário lê.

## Ações desabilitadas quando devem

- Campos e chips travam durante a requisição.
- O botão vira indicador de progresso e recusa toque.
- Um segundo submit durante a requisição é ignorado — sem isso, duas respostas correriam
  para ver qual aparece.

## Critério de pronto

- [x] Os cinco estados existem e têm teste
- [x] Degradação avisa sem parecer erro
- [x] Erro de campo fica no campo; erro de conexão fica no topo
- [x] Todo erro nomeia causa e ação
- [x] Ações desabilitadas durante a requisição
- [x] Tema claro e escuro, ambos testados
