# UC01 — Inicialização de Sessão de Convidado (Guest Onboarding & Session)

- **Caso de Uso**: UC01
- **Regras Vinculadas**: [`RN02`](../specs/RN02-guest-user.md), [`RN03`](../specs/RN03-user-caching.md)
- **Atores**: Convidado (Guest User)
- **Status**: Aprovado

---

## 🎯 Objetivo
Permitir que o usuário abra o aplicativo e utilize 100% das funcionalidades de sugestão de cartão sem necessidade de login, cadastro, e-mail ou autenticação OAuth.

---

## 📋 Pré-condições
- O aplicativo Flutter (Mobile ou Web) foi iniciado pelo usuário.

---

## 🔄 Fluxo Principal

1. O usuário abre a aplicação.
2. O aplicativo lê o armazenamento local (`SharedPreferences` / `localStorage`).
3. O app verifica se existe um `guest_id` válido salvo e se a data de criação é inferior a 7 dias (conforme [`RN03`](../specs/RN03-user-caching.md)).
4. **Se a sessão for válida**: O aplicativo reutiliza o `guest_id` existente.
5. **Se a sessão for nova ou expirada (> 7 dias)**:
   - O app gera um novo UUID v4 localmente.
   - Salva o novo `guest_id` e a data/hora atual no armazenamento local.
6. A interface principal é carregada em estado "Pronto" (Idle), exibindo um indicador visual sutil de usuário convidado na barra superior.

---

## ⚡ Fluxos Alternativos e Exceções

### Fluxo de Exceção E1: Falha no Acesso ao Armazenamento Local
1. Caso o `SharedPreferences` falhe em persistir dados (ex: modo anônimo estrito sem suporte a storage):
2. O app gera um `guest_id` temporário em memória para a sessão atual, permitindo a navegação normal.

---

## 🏁 Pós-condições
- O cabeçalho HTTP `X-Guest-ID` é automaticamente injetado em todas as chamadas à API backend (`POST /api/v1/suggestions`).
