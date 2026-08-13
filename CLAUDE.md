# smash-gift — regras gerais do monorepo

Este arquivo vale para qualquer trabalho na raiz do repositório e é a referência que todo agente
(incluindo a sessão principal do Claude Code, que atua como orquestradora) deve seguir. Cada módulo tem
seu próprio `CLAUDE.md` com convenções específicas de stack — leia o deste arquivo primeiro, depois o do
módulo em que você for trabalhar.

Contexto do produto e do desenho desta camada meta: veja
`docs/specs/2026-08-11-meta-structure-design.md`.

## Hierarquia de instruções

1. Este CLAUDE.md da raiz define regras globais e não pode ser sobrescrito pelos módulos.
2. CLAUDE.md de módulo complementa estas regras apenas dentro daquele módulo.
3. Em caso de conflito, prevalece o CLAUDE.md da raiz.
4. Specs aprovadas definem o comportamento da feature, mas não podem violar os guardrails deste arquivo.

## Estrutura do monorepo

```
smash-gift/
├── backend/    # Node + Express — package.json, node_modules e lockfile próprios
├── web/        # Next.js — package.json, node_modules e lockfile próprios
├── mobile/     # Flutter — ecossistema pub próprio
├── docs/       # specs, contrato de API, tokens de design
└── .claude/    # agentes e skills customizados deste projeto
```

Módulos são **totalmente independentes** — sem pacote compartilhado de código ou tipos, e sem nenhuma
ferramenta de workspace/monorepo (npm workspaces, Turborepo, Nx etc.) ligando `backend/` e `web/`. Cada
módulo tem seu próprio `package.json`, `node_modules/` e lockfile dentro da própria pasta — não deve
existir `package.json`, `node_modules/` nem lockfile na raiz do repositório. Instalação de dependências
(`npm install`) e scripts (`npm run ...`) sempre rodam de dentro da pasta do módulo, nunca da raiz.
Consistência entre módulos (endpoints, tokens visuais) é resolvida por documento, não por import nem por
ferramenta de workspace.

## Papel de orquestrador

- Delega implementação de código para o agente do módulo correspondente
  (`.claude/agents/backend-agent.md`, `web-agent.md`, `mobile-agent.md`).
- **Não implementa código de módulo diretamente** — sem exceção.
- Edições triviais de documentação podem ser feitas diretamente pelo orquestrador.

Considera-se trivial apenas uma mudança sem efeito semântico, como:

- correção de typo;
- gramática;
- formatação;
- ajuste de texto que não altere comportamento, contrato, regra ou decisão técnica.

Alterações em contratos de API, tokens de design, specs ou decisões arquiteturais nunca são consideradas
triviais quando modificarem seu significado — seguem o processo descrito em "Artefatos compartilhados".

## Idioma

- Documentos `.md` (specs, READMEs, comentários de documentação): sempre em português, com linguagem
  humanizada e clara — evite "traduções" literais de termos técnicos quando uma explicação natural for
  mais clara.
- Nomes de arquivo, pastas, código (funções, variáveis, classes, tipos, endpoints): sempre em inglês.
  Código em camelCase (`generateGiftMessage`, não `generate_gift_message` nem `GenerateGiftMessage` para
  funções/variáveis).

## Comentários no código

- Evite ao máximo comentários no código. Nomes claros de arquivos, funções, variáveis e tipos já devem
  comunicar o que o código faz — não repita em comentário o que o código já diz.
- Só adicione um comentário quando o "porquê" não for óbvio pela leitura: uma restrição escondida, um
  workaround para um bug específico, um comportamento que surpreenderia quem lê. Mesmo nesses casos,
  prefira uma linha curta a um bloco.
- Não escreva comentários explicando decisões de arquitetura, justificativas de escolha de biblioteca,
  referências à tarefa atual ou a quem chama aquele trecho ("decisão tomada para a spec X", "usado pelo
  fluxo Y") — isso pertence à spec técnica do módulo e ao handoff entre agentes, não ao código-fonte, que
  fica desatualizado à medida que o projeto evolui.
- Nunca escreva docstrings ou blocos de comentário de múltiplas linhas explicando uma função inteira.

## Consistência visual

Toda interface deve ser tratada como produto final, não como protótipo técnico.

Evite:

- telas genéricas;
- layouts sem hierarquia visual;
- componentes com aparência padrão de framework;
- decisões visuais arbitrárias fora dos tokens;
- interfaces compostas apenas por cards e botões sem intenção de design.

Considere obrigatoriamente:

- hierarquia;
- espaçamento;
- tipografia;
- contraste;
- estados interativos;
- feedback visual;
- loading;
- empty state;
- error state;
- responsividade;
- acessibilidade;
- consistência entre Web e Mobile.

## Artefatos compartilhados

A sessão principal do Claude Code, no papel de orquestrador, é responsável por alterações em artefatos
compartilhados do projeto.

Isso inclui:

- `docs/contracts/api-contracts.md`;
- `docs/contracts/firestore-schema.md` (modelo de dados Firestore usado diretamente pelos clientes
  autenticados — web/mobile consultam, não editam diretamente, mesmo padrão do contrato HTTP);
- `docs/design/design-tokens.md`.

Agentes de módulo consultam esses documentos e, quando identificarem necessidade de alteração, registram
a mudança necessária no handoff para o orquestrador.

Agentes de módulo não alteram diretamente artefatos compartilhados.

Alterações semânticas nesses documentos não são consideradas edições triviais de documentação.

## Controle de escopo

- Não implemente requisitos que não estejam na spec aprovada.
- Melhorias identificadas durante a implementação devem ser reportadas como sugestões,
  não implementadas automaticamente.
- Caso uma descoberta exija mudança significativa na spec, interrompa a implementação
  e solicite nova aprovação.

## Dependências

- Não adicionar dependências sem necessidade técnica clara.
- Antes de adicionar uma biblioteca, verificar se a stack existente já resolve o problema.
- Dependências arquiteturalmente relevantes devem aparecer na spec ou plano.
- Não substituir bibliotecas existentes sem aprovação humana.

## Arquitetura

- Prefira a solução mais simples que satisfaça a spec.
- Não criar abstrações para usos hipotéticos futuros.
- Não introduzir padrões arquiteturais apenas por preferência do agente.
- Toda nova camada arquitetural deve resolver um problema identificado na spec.
- Chamadas a recursos externos caros (LLM, APIs pagas, qualquer serviço com custo ou limite por
  requisição) devem proteger contra duplicação de chamadas concorrentes com o mesmo input — se duas
  requisições idênticas chegarem enquanto a primeira ainda está em andamento, a segunda deve reaproveitar
  o resultado em voo, não disparar outra chamada. Isso é diferente de cache por tempo: não deve impedir
  que uma nova chamada (sequencial, feita depois que a anterior já terminou) gere um resultado novo — o
  objetivo é evitar desperdício de chamadas simultâneas idênticas, não limitar variedade/frescor do
  resultado ao longo do tempo.

## Guardrails de processo

1. **Approval-gate**: nenhuma implementação começa sem uma spec (`docs/specs/`) e um plano aprovados
   antes. Use a skill `superpowers:brainstorming` para chegar à spec e `superpowers:writing-plans` (ou o
   fluxo de plan mode) para o plano.
2. **Test-first obrigatório**: para qualquer módulo, a estrutura de testes deve estar definida e aprovada
   _antes_ de qualquer código de implementação. Isso é um portão, não uma sugestão — use a skill
   `superpowers:test-driven-development`.
3. **Contrato de API**: qualquer mudança observável no contrato HTTP do backend — endpoint, método,
   parâmetros, payload, resposta, status code, autenticação ou formato de erro — precisa estar refletida
   em `docs/contracts/api-contracts.md` na mesma tarefa (quem atualiza o documento: ver "Artefatos
   compartilhados").
4. **Consistência visual**: qualquer mudança de UI em `web/` ou `mobile/` deve consultar
   `docs/design/design-tokens.md` (via skill `design-consistency`) e a skill
   `frontend-design:frontend-design` para decisões estéticas (quem atualiza o documento: ver "Artefatos
   compartilhados").
5. **Segurança de credenciais**: nunca commitar credenciais reais (Firebase service account key, chave da
   OpenAI, etc.). Use `.env` (ignorado pelo git) + `.env.example` (versionado, sem valores reais) em cada
   módulo que precisar.

## Aprovação humana

Aprovação exige confirmação explícita do humano, como:

- "aprovado";
- "pode seguir";
- "implemente";
- "pode executar este plano";
- ou equivalente inequívoco.

Silêncio, ausência de objeção, mensagens anteriores ou inferência do agente não contam como aprovação.

## Handoff entre agentes

Ao concluir uma implementação, o agente deve informar ao orquestrador:

- arquivos alterados;
- decisões tomadas;
- testes criados/executados;
- contratos afetados;
- pendências;
- riscos ou assumptions restantes.

## Definition of Done

Uma tarefa só pode ser considerada concluída quando:

- a implementação corresponde à spec aprovada;
- o plano aprovado foi executado ou os desvios foram documentados;
- testes relacionados passam;
- lint passa quando aplicável;
- typecheck passa quando aplicável;
- nenhuma credencial ou segredo foi introduzido;
- documentação afetada foi atualizada;
- contratos de API foram atualizados quando necessário;
- mudanças visuais respeitam os design tokens;
- não existem TODOs novos sem justificativa;
- o agente realizou o handoff com arquivos alterados, decisões, testes, riscos e pendências.

## Specs técnicas dos módulos

Cada módulo tem sua spec técnica em `docs/specs/2026-08-12-{backend,web,mobile}-technical-design.md`,
com as decisões de arquitetura, estrutura de pastas, framework de testes e demais convenções internas.
Consulte a spec do módulo antes de propor uma decisão técnica nova — se a decisão já existe lá, siga-a;
se não existe, trate como decisão nova sujeita ao guardrail de aprovação humana normalmente.
