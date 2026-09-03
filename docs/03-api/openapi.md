# OpenAPI / Swagger

## Onde fica

| Recurso | URL (local) |
|---|---|
| Swagger UI | `http://localhost:3000/docs` |
| Documento OpenAPI (JSON) | `http://localhost:3000/docs/openapi.json` |

Desligável com `DOCS_ENABLED=false`, caso um deployment não queira publicar a superfície
inteira da API. Com a flag em `false`, ambas as URLs respondem `404`.

## Como é gerado

A especificação **não é escrita à mão**. Ela é derivada dos mesmos schemas Zod que validam
a requisição e tipam a resposta em runtime.

```
presentation/validators/suggestions.schema.ts            ← request
presentation/validators/suggestions-response.schema.ts   ← response
              │
              ├──→ validação em runtime (o controller usa)
              ├──→ tipo de retorno do controller (z.infer)
              └──→ documento OpenAPI (o Swagger UI usa)
```

### Sem biblioteca de geração

O plano previa `@asteasolutions/zod-to-openapi`. Medindo antes de instalar, o **Zod 4.5 já
emite JSON Schema nativamente**:

```ts
z.toJSONSchema(suggestMessagesBodySchema, { io: 'input', target: 'openapi-3.0' })
```

Três dependências a menos, sem perder nada: o que interessava era a fonte única, não a
biblioteca. `io: 'input'` para requisição (antes dos defaults), `io: 'output'` para
resposta (depois).

### Por que fonte única

Documentação de API escrita à mão **diverge do código** — não é uma possibilidade, é uma
questão de tempo. O primeiro campo adicionado sem atualizar o YAML já quebra a promessa, e
ninguém percebe até um consumidor reclamar.

Com fonte única, uma divergência entre o que a API aceita e o que ela documenta deixa de
ser possível: são o mesmo objeto, lido de dois jeitos.

E, para que isso continue verdadeiro, há teste comparando o documento **publicado** contra
as constantes do domínio — os quatro `tone`, os três `language`, os limites `2..3` de
`count`, os 60 caracteres de `occasion`. Mudar a regra num lugar e não no outro falha em
`tests/unit/openapi-document.test.ts`.

O documento também é validado contra o **schema oficial de OpenAPI 3.0**
(`@apidevtools/swagger-parser`, dependência apenas de desenvolvimento). Um documento
malformado ainda renderizaria alguma coisa no Swagger UI, enganando em silêncio quem
gerasse um cliente a partir dele.

**O custo:** exemplos ricos e descrições longas ficam menos confortáveis de escrever do que
seriam em YAML puro. É por isso que este repositório mantém [`contract.md`](contract.md) em
paralelo — prosa e raciocínio para humanos, OpenAPI para máquinas e para testar na hora.

## Como o Swagger UI é servido

Os arquivos vêm de `swagger-ui-dist`, servidos por este projeto. A página e o inicializador
(`swagger-initializer.js`) são **nossos**, não do pacote.

Três consequências, todas deliberadas:

| Escolha | Efeito |
|---|---|
| Assets locais, não CDN | `/docs` funciona sem internet, e nenhuma origem de terceiro precisa ser liberada na nossa página |
| Nenhum script inline | A CSP pode ficar em `script-src 'self'` — o `swagger-ui-express` injeta `<script>` inline e obrigaria `'unsafe-inline'` |
| Allowlist de três arquivos | `.map`, `package.json` e `oauth2-redirect.html` respondem `404`. Uma atualização do pacote não decide o que esta API expõe |

Os três arquivos são lidos em memória **na subida do processo**: nenhum I/O de disco no
caminho da requisição, e um arquivo renomeado por atualização de dependência falha no boot
em vez de virar `404` na primeira visita.

### Content Security Policy

`/docs` é a única rota desta API que devolve HTML, e é a única com CSP:

```
default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline';
img-src 'self' data:; font-src 'self'; connect-src 'self';
base-uri 'none'; form-action 'none'; frame-ancestors 'none'
```

`style-src 'unsafe-inline'` é um afrouxamento real — o Swagger UI injeta estilo em
runtime — confinado a uma página cujo conteúdo inteiro é nosso. `connect-src 'self'` é o
que deixa o **Try it out** chamar esta própria API, e nada além dela.

Verificado renderizando a página em Chrome headless: as duas operações e as duas tags
aparecem, com **zero violações de CSP**.

## O que o Swagger UI entrega

- Formato exato de requisição e resposta, com exemplos para os três caminhos: sucesso,
  fallback (`degraded: true`) e erro.
- Botão **Try it out** — o avaliador dispara `birthday + friend` sem sair do navegador e
  sem instalar nada. O `servers` do documento é relativo (`/`), então a chamada vai para o
  host que está servindo a página, e não para um hostname fixado em build.
- Todos os códigos de erro do
  [`ADR-0004`](../01-architecture/decisions/adr-0004-error-taxonomy.md), incluindo os
  cabeçalhos `Retry-After` e `RateLimit-*` do `429`.

## Notas

- `/docs` **não é rate limited**. Documentação não deve ser bloqueada por engano — e a
  isenção tem teste.
- Em produção, `/docs` seria protegido ou desligado por `DOCS_ENABLED`. Aqui fica aberto
  porque o propósito do repositório é ser inspecionado.
- O artefato é gerado na subida do servidor; não há `openapi.yaml` versionado a ser mantido
  em sincronia manual.
