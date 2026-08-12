# UC05 — Tratamento de Erro e Indisponibilidade de IA (LLM Fallback UI)

- **Caso de Uso**: UC05
- **Regras Vinculadas**: [`RN04`](../specs/RN04-llm-failure-handling.md), [`RN05`](../specs/RN05-multi-llm-fallback-chain.md)
- **Atores**: Convidado (Guest User)
- **Status**: Aprovado

---

## 🎯 Objetivo
Garantir uma experiência graciosa e amigável quando todos os provedores de Inteligência Artificial falharem (timeout > 4s, erro 5xx ou cota excedida), exibindo uma interface clara com opção de re-tentativa (Retry).

---

## 📋 Pré-condições
- O usuário solicitou sugestões de mensagem (`UC03`).
- Todos os provedores da cadeia de fallback no backend (Gemini -> Claude -> OpenAI) falharam ou estouraram o tempo limite.

---

## 🔄 Fluxo Principal

1. O backend responde com `HTTP 503 Service Unavailable` (`LLM_SERVICE_UNAVAILABLE`).
2. O aplicativo Flutter intercepta o erro no estado da Cubit/Bloc e substitui o carregamento por um **Card de Estado de Erro Amigável**.
3. O card exibe:
   - Uma ilustração / ícone de aviso sutil.
   - Mensagem em linguagem natural: *"O serviço de IA está temporariamente ocupado. Tente novamente em alguns instantes."*
   - Botão destacado **"Tentar Novamente" (Retry)**.
4. Ao clicar em **"Tentar Novamente"**, o aplicativo re-executa a chamada ao backend (`UC03`).

---

## 🏁 Pós-condições
- O usuário não se depara com telas em branco, exceções brutas de rede ou travamentos no app.
