# Modelo de dados Firestore — smash-gift

Este documento é a fonte única de verdade do modelo de dados Firestore do projeto — tanto das coleções
usadas **diretamente pelos clientes** (`web/` via Firebase Client SDK, `mobile/` via FlutterFire) depois
do login Google, quanto das coleções de **uso exclusivo do backend** via Firebase Admin SDK. Para as
primeiras, o backend não medeia o acesso — é integração cliente → Firestore, protegida por Firestore
Security Rules em vez de lógica de servidor. Para as segundas, o Admin SDK ignora as Security Rules por
design; a proteção contra acesso indevido é a própria regra negando qualquer leitura/escrita de cliente.

## Responsabilidade

A sessão principal do Claude Code, no papel de orquestrador, mantém este documento atualizado.

`web-agent` e `mobile-agent` consultam este documento antes de implementar qualquer leitura/escrita no
Firestore, e sinalizam no handoff qualquer necessidade de mudança — não editam este arquivo diretamente.

## Modelo de acesso em duas camadas

- **Guest (sem login):** não acessa o Firestore. Único ponto de contato com o backend é
  `POST /messages` (ver `api-contracts.md`). Nada é persistido.
- **Autenticada (login Google via Firebase Auth):** depois de autenticado, o cliente lê/escreve
  diretamente no Firestore, sempre restrito ao próprio `uid` do usuário autenticado
  (`request.auth.uid`). O backend não participa dessa persistência.

Sessão e persistência local (o app continuar logado entre reaberturas) é responsabilidade nativa dos
SDKs de Firebase Auth (web: IndexedDB; mobile/FlutterFire: armazenamento seguro da plataforma) — não é
necessário código próprio de persistência de sessão.

## Coleções

### `users/{uid}`

Documento de perfil/sessão do usuário autenticado. `{uid}` é o UID do Firebase Auth.

Campos:

- `displayName`: `string | null` — nome exibido, vindo do provedor Google.
- `email`: `string | null` — e-mail da conta Google.
- `photoUrl`: `string | null` — URL da foto de perfil do Google.
- `createdAt`: `timestamp` — definido apenas na primeira escrita (primeiro login).
- `lastLoginAt`: `timestamp` — atualizado (`serverTimestamp()`) a cada login.

Escrita: upsert (`set` com `merge: true`) logo após um login bem-sucedido.

### `users/{uid}/history/{entryId}`

Uma entrada por fluxo de geração de mensagem concluído (mensagens geradas + uma selecionada) enquanto o
usuário está autenticado. `{entryId}` é um ID gerado pelo Firestore (`doc()` sem argumento).

Campos:

- `occasion`: `string` — texto livre informado pelo usuário.
- `relationship`: `string` — texto livre informado pelo usuário.
- `messageOptions`: `string[]` — as 3 mensagens retornadas por `POST /messages`.
- `selectedMessage`: `string` — a mensagem escolhida pelo usuário (deve ser um dos valores de
  `messageOptions`).
- `createdAt`: `timestamp` — `serverTimestamp()` no momento da escrita.

Escrita: `add` (criação apenas) no momento em que o usuário autenticado seleciona uma mensagem. Não há
necessidade de update/delete nesta rodada — se o produto quiser "limpar histórico" ou editar entradas,
isso é decisão de spec futura.

Leitura: listagem ordenada por `createdAt` desc, para uma tela/visão simples de "Histórico".

## Coleções de uso exclusivo do backend

### `messageCache/{cacheKeyHash}`

Cache persistente de gerações de `POST /messages`, para reaproveitar o resultado quando `occasion` +
`relationship` normalizados são idênticos aos de uma geração anterior (de qualquer usuário, guest ou
autenticado). Ver `docs/specs/2026-08-12-backend-generation-improvements-design.md` para o desenho
completo. Acessado exclusivamente pelo backend via Admin SDK — nenhum cliente lê ou escreve aqui.

Campos:

- `occasion`: `string` — valor original (não normalizado), mantido para depuração.
- `relationship`: `string` — valor original (não normalizado), mantido para depuração.
- `messages`: `string[]` — as 3 mensagens geradas, reaproveitadas em cache hits.
- `createdAt`: `timestamp` — momento da primeira geração para essa chave.
- `hitCount`: `number` — quantas vezes o cache foi reaproveitado desde a criação; começa em `0`.

`{cacheKeyHash}` é o SHA-256 (hex) da chave normalizada (`trim()` + `toLowerCase()` de cada campo), nunca
o texto original do usuário — evita expor conteúdo livre digitado pelo usuário no ID do documento.

Escrita: `set` (criação) após uma geração bem-sucedida (não-fallback); `hitCount` incrementado em cache
hits. Entradas expiram `MESSAGE_CACHE_TTL_MS` (default 6 horas) depois de `createdAt` — a expiração é
checada em runtime pelo backend ao ler o documento, não há campo de expiração explícito nem exclusão
automática do documento.

## Regras de segurança

Não há projeto Firebase real provisionado neste ambiente, então estas regras não podem ser implantadas
nem testadas contra um backend real ainda — o texto abaixo é o conteúdo real de `firestore.rules` (na
raiz do repositório), pronto para `firebase deploy --only firestore:rules` assim que um projeto Firebase
existir. Antes de ir para produção, valide com o Firebase Emulator Suite (`firebase emulators:start
--only firestore`) — essas regras nunca rodaram contra um Firestore de verdade.

Não são só checagem de dono (`request.auth.uid == uid`): como não há backend validando essas escritas,
as regras também validam o formato dos dados — chaves permitidas (`hasOnly`), tipos e tamanhos — para que
um cliente comprometido/adulterado não consiga gravar dados arbitrários mesmo estando autenticado como o
dono do documento. `history` é create-only (nenhuma regra permite `update`/`delete`), refletindo que é um
log imutável.

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    function isOwner(uid) {
      return request.auth != null && request.auth.uid == uid;
    }

    match /users/{uid} {
      allow read: if isOwner(uid);

      allow write: if isOwner(uid)
        && request.resource.data.keys().hasOnly(
             ['displayName', 'email', 'photoUrl', 'createdAt', 'lastLoginAt'])
        && (request.resource.data.displayName is string || request.resource.data.displayName == null)
        && (request.resource.data.email is string || request.resource.data.email == null)
        && (request.resource.data.photoUrl is string || request.resource.data.photoUrl == null);

      match /history/{entryId} {
        allow read: if isOwner(uid);

        allow create: if isOwner(uid)
          && request.resource.data.keys().hasOnly(
               ['occasion', 'relationship', 'messageOptions', 'selectedMessage', 'createdAt'])
          && request.resource.data.occasion is string
          && request.resource.data.occasion.size() > 0
          && request.resource.data.occasion.size() <= 300
          && request.resource.data.relationship is string
          && request.resource.data.relationship.size() > 0
          && request.resource.data.relationship.size() <= 300
          && request.resource.data.messageOptions is list
          && request.resource.data.messageOptions.size() == 3
          && request.resource.data.selectedMessage is string
          && request.resource.data.selectedMessage.size() > 0
          && request.resource.data.selectedMessage in request.resource.data.messageOptions;

        allow update, delete: if false;
      }
    }

    // messageCache é de uso exclusivo do backend (Admin SDK, que ignora estas regras) — nenhum
    // cliente deve ler ou escrever aqui.
    match /messageCache/{cacheKeyHash} {
      allow read, write: if false;
    }

    // Nega qualquer coisa fora das coleções acima — Firestore já nega por padrão o que não bate com
    // nenhuma regra, isso só torna a intenção explícita.
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

Limites de tamanho (`<= 300`) espelham o limite de `occasion`/`relationship` já documentado em
`api-contracts.md` — se o backend mudar esse número, atualize aqui também. Não validamos igualdade
exata de `createdAt`/`lastLoginAt` contra `request.time` (o que forçaria uso de `serverTimestamp()`)
porque isso é mais frágil de acertar sem poder testar contra um Firestore real — fica como possível
reforço futuro, testável via Emulator Suite antes de valer para produção.

## Fora de escopo (explícito)

- Merge guest → autenticado: se o usuário gerar uma mensagem como guest e depois fizer login, essa
  mensagem não é salva automaticamente no histórico. Sem estratégia definida nesta rodada — depende de
  spec de produto futura caso seja desejado.
- Favoritos e preferências separados do histórico — hoje só existe `history`; se o produto quiser um
  conceito distinto de "favorito", isso é uma extensão futura deste documento, não implementada agora.
- Qualquer escrita mediada pelo backend (Firebase Admin) neste fluxo — a integração é 100% direta do
  cliente para o Firestore, por decisão explícita do usuário.

## Uso deste documento

1. Antes de implementar uma leitura/escrita no Firestore, confira se o campo/coleção já está descrito
   aqui.
2. Não introduza campos ou coleções não documentados sem sinalizar a necessidade ao orquestrador.
3. As Security Rules acima são a única forma de autorização desta camada — não implemente nenhuma
   validação de autorização própria no cliente que substitua ou contradiga essas regras.
