# UC06 — Validação de Formulário e Edge Cases (Form Validation)

- **Caso de Uso**: UC06
- **Regras Vinculadas**: [`API`](../specs/API-contract-spec.md)
- **Atores**: Convidado (Guest User)
- **Status**: Aprovado

---

## 🎯 Objetivo
Impedir o envio de formulários incompletos ou dados inválidos para o backend, oferecendo validações instantâneas na interface do usuário (*inline feedback*).

---

## 📋 Pré-condições
- O usuário está preenchendo o formulário de solicitação de mensagem na tela principal.

---

## 🔄 Fluxo Principal

1. Se o usuário tentar clicar em **"Gerar Sugestões"** deixando os campos de **Ocasião** ou **Relacionamento** vazios:
   - O botão permanece desabilitado ou exibe uma mensagem abaixo do campo: *"Por favor, selecione ou informe a ocasião"* / *"Por favor, informe a relação"*.
2. Se o usuário digitar um texto muito curto (< 2 caracteres) ou muito longo (> 50 caracteres):
   - O campo indica o limite permitido.
3. O envio da requisição HTTP ao backend é bloqueado no lado do cliente até que os critérios de validação sejam satisfeitos.

---

## 🏁 Pós-condições
- Apenas requisições válidas que satisfazem o DTO do NestJS são enviadas à API.
