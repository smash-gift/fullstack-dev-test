# OpenAPI / Swagger

## Onde fica

| Recurso | URL (local) |
|---|---|
| Swagger UI | `http://localhost:3000/docs` |
| Documento OpenAPI (JSON) | `http://localhost:3000/docs/openapi.json` |

## Como é gerado

A especificação **não é escrita à mão**. Ela é derivada dos mesmos schemas Zod que
validam a requisição em runtime, via `@asteasolutions/zod-to-openapi`.

```
presentation/validators/suggestions.schema.ts   ← schemas Zod
              │
              ├──→ validação em runtime (o controller usa)
              └──→ documento OpenAPI (o Swagger UI usa)
```

### Por quê

Documentação de API escrita à mão **diverge do código** — não é uma possibilidade, é uma
questão de tempo. O primeiro campo adicionado sem atualizar o YAML já quebra a promessa, e
ninguém percebe até um consumidor reclamar.

Com fonte única, uma divergência entre o que a API aceita e o que ela documenta deixa de
ser possível: são o mesmo objeto, lido de dois jeitos.

**O custo:** uma dependência a mais, e alguns detalhes de apresentação (exemplos ricos,
descrições longas) ficam menos confortáveis de escrever do que seriam em YAML puro. É por
isso que este repositório mantém [`contract.md`](contract.md) em paralelo — prosa e
raciocínio para humanos, OpenAPI para máquinas e para testar na hora.

## O que o Swagger UI entrega

- Formato exato de requisição e resposta, com exemplos para os três caminhos: sucesso,
  fallback (`degraded: true`) e erro.
- Botão **Try it out** — o avaliador dispara `birthday + friend` sem sair do navegador e
  sem instalar nada.
- Todos os códigos de erro do [`ADR-0004`](../01-architecture/decisions/adr-0004-error-taxonomy.md).

## Notas

- `/docs` **não é rate limited**. Documentação não deve ser bloqueada por engano.
- Em produção, `/docs` seria protegido ou desligado por variável de ambiente. Aqui fica
  aberto porque o propósito do repositório é ser inspecionado.
- O artefato é gerado na subida do servidor; não há arquivo `openapi.yaml` versionado a
  ser mantido em sincronia manual.
