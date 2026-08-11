# UC03 — Solicitando Sugestões de Mensagem (Generate Message Suggestions)

- **Caso de Uso**: UC03
- **Regras Vinculadas**: [`API`](../specs/API-contract-spec.md), [`RN01`](../specs/RN01-internationalization.md), [`RN02`](../specs/RN02-guest-user.md)
- **Atores**: Convidado (Guest User)
- **Status**: Aprovado

---

## 🎯 Objetivo
Permitir que o usuário informe a ocasião do presente e o tipo de relacionamento para obter sugestões de mensagens personalizadas geradas por Inteligência Artificial.

---

## 📋 Pré-condições
- Sessão de Convidado inicializada (`UC01`).

---

## 🔄 Fluxo Principal

1. O usuário seleciona ou digita a **Ocasião** (ex: *Aniversário, Casamento, Formatura, Agradecimento, Natal*).
2. O usuário seleciona ou digita o **Relacionamento** (ex: *Amigo(a), Mãe, Pai, Namorado(a), Colega de Trabalho*).
3. O usuário clica no botão principal **"Gerar Sugestões de Mensagem"**.
4. O app exibe o estado de `Loading` (animação de carregamento / skeleton screen).
5. O cliente envia uma requisição `POST /api/v1/suggestions` para o backend com o header `X-Guest-ID` e o corpo DTO validado.
6. O backend processa a solicitação (verificando cache ou chamando a cadeia de LLM) e retorna HTTP 200 com a lista de sugestões.
7. O aplicativo transita para o estado de `Sucesso`, exibindo os cartões contendo as opções de mensagem geradas.

---

## ⚡ Fluxos Alternativos e Exceções

### Fluxo Alternativo A1: Retorno vindo do Cache (Cache Hit)
1. Caso a combinação (ocasião + relacionamento + idioma) já tenha sido solicitada recentemente, o backend retorna instantaneamente as sugestões em cache com `"cached": true`.
2. A UI exibe as mensagens sem atraso visível.

---

## 🏁 Pós-condições
- O usuário visualiza as mensagens sugeridas e pode prosseguir para cópia, compartilhamento ou personalização visual.
