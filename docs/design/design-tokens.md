# Tokens de design — smash-gift

**Status:** rascunho de trabalho, populado para destravar as primeiras implementações. Ainda não passou
por uma spec de UI formal em `docs/specs/` — trate os valores abaixo como provisórios e sujeitos a
revisão quando essa spec for aberta.

Fonte única de verdade dos valores visuais usados em `web/` (Next.js/shadcn) e `mobile/` (Flutter).

Como as duas plataformas não compartilham código, este documento define os tokens visuais comuns e
garante consistência entre elas.

A identidade visual do smash-gift deve transmitir leveza, afeto, proximidade, cuidado e elegância.
A interface deve usar tons pastéis suaves, bastante espaço em branco e componentes com proporções
confortáveis.

Evite excesso de elementos, contrastes agressivos, sombras pesadas e aparência genérica de framework.

## Cores

### Paleta base

- `color.brand.primary`: `#F4ACB7`
- `color.brand.secondary`: `#FFCAD4`
- `color.brand.accent`: `#9D8189`
- `color.background.soft`: `#D8E2DC`
- `color.background.primary`: `#FFFFFF`

### Background

- `color.background.primary`: `#FFFFFF`
- `color.background.secondary`: `#F8FAF9`
- `color.background.soft`: `#D8E2DC`
- `color.background.brandSoft`: `#FFF1F4`

### Texto

- `color.text.primary`: `#332C2F`
- `color.text.secondary`: `#6F6267`
- `color.text.muted`: `#9D8189`
- `color.text.inverse`: `#FFFFFF`

Evite usar preto puro como cor principal de texto. Tons escuros levemente quentes devem ser preferidos.

### Ações

- `color.action.primary`: `#9D8189`
- `color.action.primaryText`: `#FFFFFF`
- `color.action.secondary`: `#F4ACB7`
- `color.action.secondaryText`: `#4A3C41`
- `color.action.soft`: `#FFCAD4`

Os tons rosados representam a identidade visual. `#9D8189` deve ser usado quando maior contraste for
necessário.

### Bordas

- `color.border.default`: `#E7DDDF`
- `color.border.soft`: `#F1E8EA`
- `color.border.focus`: `#F4ACB7`

### Estados

As cores de feedback devem manter acessibilidade e não depender apenas da paleta da marca.

- `color.feedback.success`: `#4F9D69`
- `color.feedback.warning`: `#C98A2B`
- `color.feedback.error`: `#C0435A`
- `color.feedback.errorSoft`: `#FBEAEA`
- `color.feedback.info`: `#5B7DB1`

Valores propostos por `web-agent`/`mobile-agent` durante a primeira implementação do fluxo guest,
consolidados aqui pelo orquestrador. Ainda são provisórios (não passaram por spec de UI formal) — tratar
como ponto de partida sujeito a revisão, não como decisão final de identidade visual.

## Tipografia

### Fonte primária

Montserrat é a fonte principal da interface.

Uso recomendado:

- títulos;
- botões;
- labels;
- navegação;
- elementos de destaque.

Token:

`font.family.primary: Montserrat`

### Fonte secundária

Poppins é usada principalmente para conteúdo de leitura.

Uso recomendado:

- textos corridos;
- descrições;
- mensagens;
- conteúdo secundário;
- textos informativos.

Token:

`font.family.secondary: Poppins`

### Pesos

- `font.weight.regular`: `400`
- `font.weight.medium`: `500`
- `font.weight.semiBold`: `600`
- `font.weight.bold`: `700`

### Escala

- `font.size.caption`: `12`
- `font.size.small`: `14`
- `font.size.body`: `16`
- `font.size.bodyLarge`: `18`
- `font.size.titleSmall`: `20`
- `font.size.title`: `24`
- `font.size.heading`: `32`
- `font.size.display`: `40`

### Line-height

- textos pequenos: `1.4`
- body: `1.5`
- títulos: `1.2`
- display: `1.1`

## Espaçamento

O sistema usa uma escala baseada em múltiplos de `4`.

- `space.1`: `4`
- `space.2`: `8`
- `space.3`: `12`
- `space.4`: `16`
- `space.5`: `20`
- `space.6`: `24`
- `space.8`: `32`
- `space.10`: `40`
- `space.12`: `48`
- `space.16`: `64`

`16px` é o espaçamento padrão da aplicação.

Use preferencialmente:

- `8px` para elementos muito próximos;
- `12px` para elementos internos;
- `16px` como padding padrão;
- `24px` entre grupos;
- `32px` ou mais entre seções.

Valores fora dessa escala devem ser exceção.

## Layout

### Padding

O padding horizontal padrão em telas mobile é `16px`.

Telas maiores podem utilizar `24px`, `32px` ou containers centralizados conforme a estratégia
responsiva definida na spec de UI.

### Inputs

Inputs devem:

- ocupar `100%` da largura disponível;
- ter altura mínima de `56px`;
- usar padding horizontal de `16px`;
- usar `radius.small`;
- possuir label visível;
- possuir estados de focus, erro e disabled.

Inputs de formulários principais não devem usar larguras arbitrárias.

### Botões

Botões de ação principal devem:

- ter altura de `56px`;
- ocupar `100%` da largura em fluxos principais mobile;
- usar padding horizontal mínimo de `24px`;
- usar Montserrat com peso `600`;
- possuir área de toque confortável;
- apresentar estado de loading quando necessário.

Botões secundários podem adaptar a largura ao conteúdo.

## Raios de borda

A interface deve ter cantos suavemente arredondados sem aparência excessivamente arredondada.

- `radius.small`: `8px`
- `radius.medium`: `12px`
- `radius.large`: `16px`
- `radius.full`: `9999px`

Uso recomendado:

- inputs: `8px`;
- botões: `8px`;
- cards: `16px`;
- modais: `16px`;
- badges e chips: `9999px`.

`8px` é o raio padrão para elementos funcionais.

## Elevação e sombras

Sombras devem ser leves e usadas apenas quando ajudarem na hierarquia visual.

Evite sombras escuras, blur exagerado ou muitos níveis de elevação.

Categorias previstas:

- `elevation.none`
- `elevation.small`
- `elevation.medium`
- `elevation.overlay`

Os valores técnicos serão definidos durante o trabalho da primeira composição visual.

## Estados interativos

Componentes interativos devem considerar:

- default;
- hover quando aplicável;
- focus;
- pressed;
- selected;
- disabled;
- loading;
- error quando aplicável.

Web e Mobile podem representar esses estados de maneiras diferentes, mantendo a mesma intenção visual.

## Movimento

Animações devem ser suaves, rápidas e funcionais.

Categorias previstas:

- `motion.fast`
- `motion.normal`
- `motion.slow`

A aplicação deve respeitar preferências de redução de movimento da plataforma.

## Uso dos tokens

1. Antes de usar um valor visual, verifique se existe token equivalente.
2. Reutilize tokens existentes sempre que possível.
3. Quando um novo valor representar uma decisão reutilizável, adicione-o a este documento antes de
   espalhá-lo pelo código.
4. Valores específicos de uma única composição podem permanecer locais quando não representarem uma
   decisão visual reutilizável.
5. Evite valores visuais hardcoded quando existir token correspondente.

## Escopo entre plataformas

Tokens compartilhados representam a identidade visual comum do produto. Todo token deste documento é
`[shared]` por padrão (aplica-se a Web e Mobile igualmente), salvo marcação explícita em contrário:

- `[web]`: específico da plataforma web.
- `[mobile]`: específico da plataforma mobile.

Paridade visual não significa reprodução pixel a pixel.

Web e Mobile devem preservar identidade, hierarquia, proporções, intenção visual e semântica dos tokens,
adaptando layout e interação às características de cada plataforma.

## Direção visual

A base neutra da interface usa `#FFFFFF` e `#D8E2DC`.

`#FFCAD4` e `#F4ACB7` representam a identidade afetiva do produto.

`#9D8189` funciona como cor de contraste, estrutura e ações principais.

Montserrat deve trazer personalidade aos elementos de interface.

Poppins deve manter textos longos limpos e confortáveis.

O resultado esperado é uma interface leve, moderna, delicada e elegante, sem parecer infantil,
genérica ou excessivamente feminina.
