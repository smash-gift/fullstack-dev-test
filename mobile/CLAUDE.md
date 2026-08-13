# mobile/ — smash-gift

Módulo Flutter do smash-gift. Leia primeiro o `CLAUDE.md` da raiz do repositório — as regras cross-module
(idioma, guardrails, papel de orquestrador) valem aqui também.

## Status

O módulo tem uma spec técnica aprovada: `docs/specs/2026-08-12-mobile-technical-design.md`. Ela cobre a
primeira implementação funcional (fluxo guest completo — formulário de texto livre → geração de
mensagens → escolha → cartão — e login Google/Firestore reais, com histórico) e resolve as convenções
detalhadas que antes estavam em aberto: gerenciamento de estado, estrutura de pastas, navegação,
injeção de dependência e estrutura de testes (resumo dessas decisões logo abaixo; detalhes e
justificativas na spec). Escopo novo que essa spec não cobre (novas telas, novos fluxos, mudança de
alguma dessas decisões) continua exigindo `superpowers:brainstorming` e aprovação explícita antes da
implementação.

## O que já está decidido

- O Firebase Auth no client identifica o usuário, mas não autoriza operações protegidas.
  Toda autorização deve ser validada pelo backend a partir do token Firebase.
- Flutter/Dart, fora do npm workspace (ecossistema pub próprio).
- Guest é um estado de produto, não implica automaticamente Firebase Anonymous Auth.
  Não introduzir autenticação anônima, persistência de sessão guest ou estratégia de merge guest→user
  antes de definição explícita em spec.
- Firebase client SDK (pacotes FlutterFire) usado diretamente para Auth (login Google), Analytics e
  Crashlytics; o token do usuário é enviado ao backend, que valida via Firebase Admin.
- Fluxo de acesso: usuário gera mensagens como convidado (guest, sem login) — caminho principal. Login
  Google desbloqueia recursos extras (favoritos, preferências, histórico), com paridade de funcionalidade
  em relação ao web.
- Antes de estilizar qualquer tela, consulte `docs/design/design-tokens.md` (skill `design-consistency`)
  para manter paridade visual com o web.
- Nomes de arquivo, classes, funções e variáveis sempre em inglês, seguindo a convenção de nomenclatura
  do Dart (classes em PascalCase, funções/variáveis em camelCase).
- Estrutura de testes definida e aprovada antes de qualquer código de implementação (guardrail
  test-first).
- Gerenciamento de estado: `ChangeNotifier` nativo do SDK Flutter + `ListenableBuilder`, sem pacote
  externo (Provider/Riverpod/Bloc/Cubit/GetX/MobX).
- Navegação: `Navigator` imperativo (`Navigator.push` com `MaterialPageRoute`), sem roteador
  declarativo (go_router/auto_route).
- Injeção de dependência: manual via construtor, composta em `main.dart`/`app.dart`, sem framework de DI
  (get_it/injectable).
- Essas três decisões, a estrutura de pastas e a estratégia de testes estão detalhadas e justificadas em
  `docs/specs/2026-08-12-mobile-technical-design.md` — não trocar por outra abordagem nem introduzir as
  alternativas listadas acima sem nova aprovação em spec.
- O aplicativo não deve acessar diretamente APIs externas que exijam segredo ou regras de negócio protegidas.
  Essas integrações devem passar pelo backend.
- A implementação mobile deve respeitar os mesmos princípios visuais e tokens do Web,
  sem tentar reproduzir pixel a pixel comportamentos que não façam sentido na plataforma.

## Fronteiras do módulo

O Mobile é responsável por:

- experiência e renderização da aplicação Flutter;
- estado e interação da interface;
- autenticação client-side via FlutterFire;
- comunicação com o backend;
- integrações específicas da plataforma mobile.

O Mobile não é responsável por:

- validar autorização de operações protegidas;
- armazenar segredos;
- acessar Firebase Admin;
- implementar regras de negócio que devam ser compartilhadas com Web;
- redefinir contratos HTTP do backend unilateralmente.

Veja também `.claude/agents/mobile-agent.md`.
