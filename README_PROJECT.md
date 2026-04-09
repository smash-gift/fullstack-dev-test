# Documentação do Projeto — Gift Card Message Suggester

## Visão Geral
O GiftMsg é um sistema de sugestão de mensagens para cartões-presente com inteligência artificial. O usuário escolhe a ocasião e o relacionamento com o destinatário, e o sistema retorna 2–3 mensagens personalizadas geradas por IA.

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

Configuração atual da URL do backend no Flutter:
- Web e desktop: `http://localhost:3000`
- Android emulator: `http://10.0.2.2:3000`
- Override manual: `flutter run --dart-define=API_BASE_URL=http://SEU_IP:3000`

Observação importante para Android Studio:
- No Android emulator, `localhost` aponta para o próprio emulador. Por isso o app usa `10.0.2.2` para acessar o backend rodando na máquina local.

**Rodando os testes:**

Backend:
```bash
cd backend
npm test
```

Flutter:
```bash
cd flutter
flutter test
```

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
- **Conectividade local no Android:**  
  O app Flutter detecta quando está rodando no Android emulator e troca automaticamente a URL base para `10.0.2.2`, evitando falhas de conexão com o backend local.
- **Limitação de taxa:**  
  Não implementada neste teste para simplicidade, mas recomendada em produção para evitar abuso e custos excessivos.
- **Cache/custo:**  
  Não há cache implementado. Em produção, recomenda-se cache por combinação de ocasião/relacionamento para reduzir custos com LLM.
- **Prompt do LLM:**  
  Estruturado para garantir respostas curtas, amigáveis e variadas.

---

## Uso de IA

Utilizei assistente de IA (GitHub Copilot) para acelerar a escrita de código e testes, mas revisei manualmente prompts, fallback e arquitetura. Decisões de fallback, separação de camadas e tratamento de erros foram feitas por mim.

Também utilizei IA para acelerar refinamentos visuais na interface Flutter e cobertura de testes, mantendo revisão manual das alterações aplicadas.
