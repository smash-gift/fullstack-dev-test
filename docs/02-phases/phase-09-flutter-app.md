# Fase 09 — App Flutter

**Status:** ⬜ pendente · **Checklist:** item 9

## Objetivo

Criar o projeto Flutter e a tela principal, com os campos, o botão e a área de resultados
funcionando contra o backend real.

Esta fase entrega a tela **funcionando**; a fase 10 organiza as camadas por trás dela e a
fase 11 refina os estados.

## Tasks

- [ ] `flutter create` com Flutter 3.38+
- [ ] Limpar o contador de exemplo
- [ ] Adicionar `http` ao `pubspec.yaml`
- [ ] Criar a tela principal
- [ ] Campo/seleção para `occasion`
- [ ] Campo/seleção para `relationship`
- [ ] Botão para gerar sugestões
- [ ] Exibir as 2–3 sugestões
- [ ] Configurar `analysis_options.yaml`
- [ ] 🔒 Renderizar sugestão **só** com `Text` — sem HTML/Markdown, sem `linkify`
- [ ] 🔒 Cleartext HTTP restrito ao build de **debug** (Android e iOS)

## Design dos campos

O enunciado diz *"a simple screen where the user can **choose or type**"* — ou seja,
**ambos**. Um `Autocomplete` (ou `DropdownMenu` editável) atende os dois casos:

- sugestões prontas para o caminho comum (`birthday`, `wedding`, `thank you` /
  `friend`, `colleague`, `parent`);
- texto livre para qualquer outra coisa.

O backend aceita string livre por decisão de contrato
([`../03-api/contract.md`](../03-api/contract.md)), então a interface não precisa
restringir — restringir aqui limitaria o produto sem ganho técnico.

## Exibição das sugestões

Cada sugestão vira um card com:

- o texto, legível e com espaço para respirar;
- **botão de copiar** — é a ação que o usuário realmente quer, já que o destino do texto é
  outro aplicativo ou um cartão físico.

Sem copiar, o usuário seleciona texto na mão em um app móvel. Um botão resolve.

## Duas regras de segurança que nascem aqui

Definidas nas fases 05 e 06, aplicadas nesta:

**1. Renderização.** O texto de sugestão vem de um LLM, cuja saída é influenciável por quem
digita no formulário. É renderizado **exclusivamente** com `Text` — nunca `flutter_html`,
`flutter_markdown` ou qualquer widget que interprete marcação, e sem `linkify`. O guard de
saída no backend já rejeita URL e HTML; renderizar como texto puro é a segunda camada, para
que um padrão que escape seja **exibido** e não **clicável**.

**2. Cleartext HTTP.** Falar com `http://10.0.2.2:3000` exige permitir tráfego não
criptografado no Android (API 28+) e no iOS. Essa permissão fica **restrita ao build de
debug**. Vazando para release, todo o tráfego do app viraria texto claro, interceptável em
qualquer rede hostil — erro que passa despercebido justamente porque "funciona".

## Critério de pronto

- [ ] `flutter run` sobe sem erro
- [ ] `flutter analyze` limpo
- [ ] Digitar `Birthday` + `Friend` e tocar em Generate traz sugestões do backend
- [ ] As 3 sugestões aparecem na tela
- [ ] Copiar funciona
- [ ] Layout não estoura em tela estreita
- [ ] 🔒 `grep -rn "flutter_html\|flutter_markdown\|linkify" flutter_app/` vazio
- [ ] 🔒 Cleartext permitido apenas no manifesto de debug

## Riscos

| Risco | Mitigação |
|---|---|
| Lógica de rede dentro do widget | Fase 10 reorganiza; aqui é a versão funcional mínima |
| App não conectar no emulador Android | `10.0.2.2`, documentado em `04-operations/` |
| Texto longo quebrar o card | Card com altura flexível e teste com texto extremo |
