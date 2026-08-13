---
name: design-consistency
description: Use antes de criar ou estilizar qualquer tela em web/ ou mobile/ no smash-gift, para garantir que cores, espaçamento, tipografia e outros tokens visuais fiquem consistentes entre as duas plataformas, já que elas não compartilham código.
---

# design-consistency

O smash-gift tem `web/` (Next.js) e `mobile/` (Flutter) como módulos totalmente separados, sem pacote de
estilo compartilhado. Sem um processo explícito, é fácil as duas plataformas divergirem em cores,
espaçamento ou tipografia ao longo do tempo. Esta skill existe para evitar isso.

`docs/design/design-tokens.md` é a fonte única de verdade dos tokens visuais do produto.

## Quando usar

- Antes de implementar ou alterar visualmente qualquer tela em `web/` ou `mobile/`.
- Ao criar um componente novo que introduza um valor visual (cor, espaçamento, tamanho de fonte, raio de
  borda) que ainda não existe em `docs/design/design-tokens.md`.
- Ao introduzir uma nova decisão visual reutilizável.
- Ao implementar em uma plataforma uma experiência que já existe na outra.
- Ao identificar divergência visual entre Web e Mobile.

Se um valor novo representar uma decisão visual reutilizável, proponha um token com nome semântico e
valor correspondente, registrando a proposta no handoff para que o orquestrador atualize
`docs/design/design-tokens.md`. Agentes de Web e Mobile não alteram o documento diretamente.

## Processo

1. **Leia `docs/design/design-tokens.md`** antes de escrever qualquer estilo. Use os tokens já
   documentados em vez de inventar valores novos (ex: não use um espaçamento "16.5px" se a escala já
   define 16px).
2. **Se o token que você precisa não existe ainda**: pare e proponha o novo token (nome + valor) no
   handoff para o orquestrador — é ele quem adiciona o token em `docs/design/design-tokens.md`. Não crie
   o valor só localmente no componente, e não edite o documento diretamente.
3. **Verifique paridade cross-platform**: se você está implementando uma tela que já existe na outra
   plataforma (web ↔ mobile), confira se os tokens usados lá foram os mesmos que você está usando aqui.
   Se a outra plataforma usou um valor fora do documento de tokens, sinalize a divergência em vez de
   simplesmente copiá-la.
4. **Combine com `frontend-design:frontend-design`**: esta skill cuida da consistência entre plataformas
   (os tokens em si); a skill `frontend-design:frontend-design` cuida das decisões estéticas mais amplas
   (composição, hierarquia visual, tipografia como sistema). Use as duas em conjunto.

## O que deve ser validado

- cores;
- tipografia;
- pesos e tamanhos de fonte;
- espaçamento;
- raios de borda;
- bordas;
- dimensões de componentes;
- estados interativos;
- elevação e sombras;
- movimento e transições;
- comportamento responsivo;
- diferenças específicas entre Web e Mobile.

Paridade não significa reprodução pixel a pixel. Web e Mobile podem adaptar layout e interação às
características da plataforma mantendo identidade, hierarquia e semântica visual consistentes.

## O que esta skill não faz

Não decide qual deve ser a identidade visual do produto (paleta de cores, fontes, tom visual) — isso é
definido uma vez, durante o design inicial da UI (provavelmente numa spec própria usando
`frontend-design:frontend-design`), e só então populado em `docs/design/design-tokens.md`. Esta skill
garante que, uma vez definidos, os tokens sejam respeitados, usados de forma consistente e mantidos em
sincronia entre plataformas.
