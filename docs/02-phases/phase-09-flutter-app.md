# Fase 09 — App Flutter

**Status:** ✅ concluída · **Checklist:** item 9

## Objetivo

Criar o projeto Flutter e a tela principal, funcionando contra o backend real.

## Desvio do plano, decidido antes de escrever a primeira linha

O plano separava a fase 09 (tela funcionando, lógica onde der) da fase 10 (reorganizar em
camadas). A separação existe para reduzir risco quando ainda não se sabe a forma final.

Aqui a forma final já estava decidida — o padrão Clean Dart do projeto, com as regras R1,
R2 e R3 escritas antes de existir código. Escrever lógica de rede dentro do widget para
refatorar em seguida seria produzir código para jogar fora.

**A tela nasceu nas camadas.** A [fase 10](phase-10-flutter-architecture.md) deixou de ser
uma refatoração e virou o que garante que as camadas continuem separadas: 22 testes
estáticos que falham quando uma regra é violada.

## Tasks

- [x] `flutter create` com Flutter 3.44
- [x] Limpar o template
- [x] `http` no `pubspec.yaml` — **única** dependência de runtime
- [x] Tela principal
- [x] Campo para `occasion`
- [x] Campo para `relationship`
- [x] Seletor de `tone` *(além do plano — o backend aceita desde a fase 02)*
- [x] Botão para gerar
- [x] Exibir as sugestões, com botão de copiar
- [x] `analysis_options.yaml` endurecido
- [x] 🔒 Renderizar sugestão **só** com `Text`
- [x] 🔒 Cleartext HTTP restrito ao build de **debug** (Android e iOS)

## Decisões desta fase

### Sem Modular, sem MobX, sem codegen

Decidido com o usuário. `ChangeNotifier` puro e composição manual no `injector.dart`.

O que se ganha: o avaliador roda `flutter pub get && flutter run` e pronto — não existe
passo de `build_runner`, e o grafo inteiro de dependências cabe em quinze linhas legíveis
de cima para baixo. Um container de DI para **um módulo e uma tela** esconderia essa lista
atrás de registros e não devolveria nada.

### Tema derivado do CSS de produção da Smash

A paleta não foi tirada de screenshot. O stylesheet Webflow que o `smash.gifts` serve foi
baixado e lido; as variáveis estão em português porque foi assim que eles nomearam:

| Token deles | Valor | Onde aparece |
|---|---|---|
| `--roxo-claro-botão` | `#933DF9` | Ação primária |
| `--roxo-logo` | `#29034F` | Marca |
| `--rosa-cintilante-linda` | `#FF005C` | Gradiente da marca |
| `--amarelo` | `#FEC261` | Aviso de degradação |

**A cor de marca é gasta em um lugar só.** Fundo, texto e bordas rodam numa escala neutra —
papel e carvão com um sopro de violeta —, o que faz a mesma escala servir claro e escuro
sem inverter nada. Decidido com o usuário depois de uma primeira versão roxa demais.

### `tone` entrou na tela

O backend aceita `warm · funny · formal · heartfelt` desde a fase 02. Deixar de fora seria
entregar um contrato que ninguém consegue exercitar. `language` não virou seletor, e desde a
[`ADR-0012`](../01-architecture/decisions/adr-0012-response-language.md) o app **não envia**
o campo: quem decide o idioma do cartão é o texto que o usuário digitou, não o aparelho.

### Copiar é a ação de verdade

O destino do texto é outro aplicativo ou um cartão físico. Sem botão de copiar, o usuário
seleciona texto à mão num app móvel. Cada card também mostra a contagem de caracteres, que
é a informação usada para escolher entre as três quando o espaço é físico.

## As duas regras de segurança, aplicadas e **verificadas no artefato**

### Camada 4 — sugestão nunca vira link

O texto vem de um modelo cuja saída é influenciável por quem digita no formulário. É
renderizado com `Text` e nada mais.

O guard de saída do backend já rejeita URL e marcação, então esta é a segunda linha. O que
ela garante é que o que escapar do guard seja **exibido**, não **tocável** — a diferença
entre uma sugestão feia e um link de phishing que funciona.

Testado com payloads reais: URL, `<script>`, link markdown. Todos aparecem como texto, e a
asserção é que **nenhum ancestral do texto é um `InkWell` ou `GestureDetector`**.

> A primeira versão do teste afirmava "nenhum `InkWell` no card" e falhou — no botão de
> copiar. Uma asserção ampla demais teria sido removida ou afrouxada; escopá-la aos
> ancestrais do texto diz o que a regra sempre quis dizer.

### Cleartext HTTP só em debug — medido nos binários

Não basta ler o fonte. O que importa é o que sai do build.

| Artefato | Resultado |
|---|---|
| `app-release.apk` | sem `networkSecurityConfig`, sem `usesCleartextTraffic`, e o XML **não é empacotado** |
| `app-debug.apk` | `networkSecurityConfig` presente, XML empacotado |
| iOS `Runner.app` release | nenhuma chave de ATS |
| iOS `Runner.app` debug | `NSAllowsLocalNetworking = true` |

Verificado com `aapt2 dump xmltree` e `plutil -p` nos quatro binários.

#### Dois achados no caminho

**1. O manifesto de release do Flutter não tem permissão de INTERNET.** O template declara
`android.permission.INTERNET` apenas nos manifestos de debug e profile. Um build de release
deste app instalaria normalmente e falharia **toda** requisição. Corrigido no manifesto
principal — e note o que continua fora dele: `usesCleartextTraffic`.

**2. A substituição de variável no `Info.plist` não funciona.** A tentativa de escrever
`<${ATS_ALLOWS_LOCAL_NETWORKING}/>` e definir o valor por xcconfig quebrou o build:

```
unable to read property list from file: Info.plist
```

O Xcode interpreta o arquivo como property list **antes** de expandir build settings.
Falha alta e imediata, que é o modo certo de falhar — mas não serve.

A solução que o build system suporta é selecionar **arquivos diferentes** por configuração:
`Info-Debug.plist` para Debug, `Info.plist` para Release e Profile. Dois plists podem
divergir, então um teste afirma que a **única** diferença entre eles é o bloco de ATS — o
mesmo raciocínio que guarda o `.env.example` contra o schema do backend.

> E o `INFOPLIST_FILE` teve de ser mudado no `project.pbxproj`, não só no xcconfig:
> configuração de target sobrepõe xcconfig, e a primeira tentativa não teve efeito nenhum.
> Descoberto porque o build de debug foi inspecionado, não porque o fonte parecia certo.

## Critério de pronto

- [x] `flutter run` sobe sem erro
- [x] `flutter analyze` limpo
- [x] `Birthday` + `Best friend` traz sugestões do backend real
- [x] Copiar funciona
- [x] Layout não estoura em tela estreita — testado de 320 a 1440 px
- [x] 🔒 Nenhum widget de HTML/Markdown/linkify no projeto
- [x] 🔒 Cleartext permitido apenas em debug, **verificado nos quatro binários**
