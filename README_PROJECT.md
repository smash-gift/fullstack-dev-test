# Documentação do Projeto — Gift Card Message Suggester

## Como rodar o projeto

**Pré-requisitos:**
- Node.js v20+
- Flutter 3.38+
- Chave de API do Google Gemini (defina em `.env` no backend: `GEMINI_API_KEY=...`)

**Backend:**
```bash
cd backend
npm install
npm run dev
```
O backend roda por padrão em http://localhost:3000

**Frontend (Flutter):**
```bash
cd flutter
flutter pub get
flutter run
```
No arquivo `lib/services/suggestion_service.dart`, ajuste `baseUrl` se necessário para apontar para o backend.

---

## Arquitetura

```
Usuário
  │
  ▼
Flutter App (main_screen.dart)
  │
  ▼
SuggestionService (HTTP)
  │
  ▼
Backend Node.js (Express)
  │
  ├──> Google Gemini API (LLM)
  │         │
  │         └──> [Se falhar] Fallback local
  │
  ▼
Resposta (2-3 sugestões)
```

- UI, serviço de API e estado separados no Flutter.
- Backend modularizado: rota, lógica de LLM e fallback.

---

## Decisões e compensações

- **Tratamento de erros/fallback:**  
  Se o LLM falhar (timeout, erro 429/5xx, resposta inesperada), o backend retorna sugestões pré-definidas, nunca um erro bruto. Isso garante experiência consistente ao usuário.
- **Limitação de taxa:**  
  Não implementada neste teste para simplicidade, mas recomendada em produção para evitar abuso e custos excessivos.
- **Cache/custo:**  
  Não há cache implementado. Em produção, recomenda-se cache por combinação de ocasião/relacionamento para reduzir custos com LLM.
- **Prompt do LLM:**  
  Estruturado para garantir respostas curtas, amigáveis e variadas.

---

## Uso de IA

Utilizei assistente de IA (GitHub Copilot) para acelerar a escrita de código e testes, mas revisei manualmente prompts, fallback e arquitetura. Decisões de fallback, separação de camadas e tratamento de erros foram feitas por mim.
