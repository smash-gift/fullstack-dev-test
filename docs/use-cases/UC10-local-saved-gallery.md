# UC10 — Galeria de Cartões Favoritos Local (Local Saved Card Gallery)

- **Caso de Uso**: UC10
- **Regra Vinculada**: [`RN03`](../specs/RN03-user-caching.md)
- **Atores**: Convidado (Guest User)
- **Status**: Aprovado

---

## 🎯 Objetivo
Permitir que o usuário convidado salve seus cartões criados e frases preferidas localmente no dispositivo para consultar, re-editar ou reutilizar mais tarde.

---

## 📋 Pré-condições
- A aplicação possui ao menos uma sugestão gerada ou cartão criado.

---

## 🔄 Fluxo Principal

1. Em qualquer cartão de mensagem ou no Editor Visual, o usuário clica no ícone de **Estrela / Coração (Favoritar)**.
2. O aplicativo salva a estrutura do cartão (texto, ocasião, tema visual selecionado e nomes De/Para) no armazenamento local (`SharedPreferences` / `localStorage`).
3. O usuário pode acessar a aba **"Meus Cartões Salvos"** na navegação principal.
4. A galeria exibe a lista dos cartões salvos com opção de visualização rápida, re-edição no Canvas (`UC07`) ou exclusão.

---

## 🏁 Pós-condições
- Os cartões favoritos permanecem acessíveis no dispositivo do usuário durante a validade da sessão anônima.
