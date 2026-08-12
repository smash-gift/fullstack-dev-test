# UC04 — Interação com Mensagens Sugeridas (Message Interaction)

- **Caso de Uso**: UC04
- **Regras Vinculadas**: [`API`](../specs/API-contract-spec.md)
- **Atores**: Convidado (Guest User)
- **Status**: Aprovado

---

## 🎯 Objetivo
Oferecer ações rápidas para o usuário copiar o texto gerado para a área de transferência, compartilhar a mensagem diretamente em apps de mensageria ou solicitar novas variações.

---

## 📋 Pré-condições
- O usuário concluiu com sucesso a geração de sugestões de mensagem (`UC03`).

---

## 🔄 Fluxo Principal

1. O usuário visualiza os cartões de mensagem na tela de resultados.
2. Em qualquer cartão, o usuário tem 3 ações disponíveis:
   - **Copiar Texto**: Clica no ícone de cópia. O app copia o texto para o clipboard do sistema e exibe um feedback visual rápido ("Mensagem copiada!").
   - **Compartilhar Mensagem**: Clica no botão de compartilhamento. O app abre a planilha nativa de compartilhamento do dispositivo (WhatsApp, E-mail, SMS, Telegram, etc.).
   - **Criar Cartão Visual**: Clica em "Personalizar Arte do Cartão" para abrir o Editor Visual (`UC07`).
   - **Recarregar / Novas Sugestões**: Clica em "Gerar Outras Opções" para refazer a chamada ao backend e obter novas alternativas.

---

## 🏁 Pós-condições
- O texto da mensagem é compartilhado ou encaminhado para o editor visual de cartão.
