# UC02 — Alternância de Idioma da Interface (Language Switching)

- **Caso de Uso**: UC02
- **Regra Vinculada**: [`RN01`](../specs/RN01-internationalization.md)
- **Atores**: Convidado (Guest User)
- **Status**: Aprovado

---

## 🎯 Objetivo
Permitir que o usuário altere o idioma da aplicação entre **Português (`pt-BR`)** e **Inglês (`en-US`)** a qualquer momento, atualizando instantaneamente os textos da interface e instruindo o backend a gerar mensagens no idioma selecionado.

---

## 📋 Pré-condições
- A aplicação está aberta na tela principal.

---

## 🔄 Fluxo Principal

1. O usuário clica no seletor de idioma localizado na barra de navegação superior (`TopBar`).
2. O menu/dropdown exibe as opções: `🇧🇷 Português (pt-BR)` e `🇺🇸 English (en-US)`.
3. O usuário seleciona o idioma desejado (ex: `en-US`).
4. O app atualiza imediatamente a UI (títulos, campos, botões, placeholders e mensagens de estado).
5. O idioma selecionado é salvo no `SharedPreferences`.
6. Todas as requisições subsequentes ao backend enviarão o parâmetro `"language": "en-US"` e o header `Accept-Language: en-US`.

---

## 🏁 Pós-condições
- A interface e as sugestões geradas pela IA passam a responder estritamente no idioma selecionado pelo usuário.
