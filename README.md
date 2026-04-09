# GiftMsg — Gift Card Message Suggester

## Visão Geral
O GiftMsg é um sistema de sugestão de mensagens para cartões-presente com inteligência artificial. O usuário escolhe a ocasião e o relacionamento com o destinatário, e o sistema retorna 2–3 mensagens personalizadas geradas por IA.

## Como rodar o projeto

**Pré-requisitos:**
- Node.js v20+
- Flutter 3.38+
- Chave de API do Google Gemini

**Backend (.env):**
Defina no backend pelo menos:

```env
GEMINI_API_KEY=sua_chave
```

Opcionalmente:

```env
GEMINI_MODEL=gemini-2.5-flash
GEMINI_API_VERSION=v1
```

**Backend:**
```bash
cd backend
npm install
npm run dev
```

O backend roda por padrão em http://localhost:3000

Para gerar a versão compilada:

```bash
cd backend
npm run build
npm start
```

**Frontend (Flutter):**
```bash
cd flutter
flutter pub get
flutter run
```

Configuração atual da URL do backend no Flutter:
- Web e iOS: `http://localhost:3000`
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

## Contrato da API

**Endpoint:**
```http
POST /suggestions
Content-Type: application/json
```

**Request body:**
```json
{
  "occasion": "aniversario",
  "relationship": "amigo"
}
```

**Response de sucesso:**
```json
{
  "suggestions": [
    "Feliz aniversário! Que seu dia seja incrível!",
    "Muita alegria e sucesso para você neste novo ano!"
  ]
}
```

**Response com fallback:**
```json
{
  "suggestions": [
    "Parabéns! Que este presente traga muita alegria.",
    "Desejo tudo de melhor para você nesta ocasião especial!"
  ],
  "fallback": true
}
```

## Arquitetura

```text
Usuário
  │
  ▼
Flutter App
  │
  ├── app/gift_msg_app.dart
  └── features/suggestions/
         ├── data/suggestion_service.dart
         └── presentation/
                ├── screens/main_screen.dart
                └── widgets/
  │
  ▼
Backend Node.js (Express)
  │
  ├── config/env.ts
  ├── controllers/suggestions.controller.ts
  ├── routes/suggestions.routes.ts
  └── services/
         ├── suggestions.service.ts
         └── providers/
                ├── suggestion-llm-provider.ts
                └── gemini-suggestion-provider.ts
  │
  ├──> Google Gemini API via SDK oficial
  │         │
  │         └──> [Se falhar] Fallback local
  │
  ▼
Resposta (2-3 sugestões)
```

- Flutter organizado por feature, separando camada de dados e apresentação.
- Backend organizado em camadas, com provider isolado para o LLM.
- A integração com o Gemini fica encapsulada em um provider, reduzindo o acoplamento com o restante da regra de negócio.

## Decisões e compensações

- **Tratamento de erros/fallback:**
  Se o LLM falhar por timeout, erro 429/5xx ou resposta inesperada, o backend retorna sugestões pré-definidas, nunca um erro bruto. Isso garante experiência consistente ao usuário.
- **Conectividade local no Android:**
  O app Flutter detecta quando está rodando no Android emulator e troca automaticamente a URL base para `10.0.2.2`, evitando falhas de conexão com o backend local.
- **Integração com IA isolada:**
  A camada de provider permite trocar ou adaptar o provedor de IA no futuro sem reescrever controller, rota ou parser principal.
- **Cache/custo:**
  Não há cache implementado. Em produção, recomenda-se cache por combinação de ocasião/relacionamento para reduzir custos com LLM.
- **Prompt do LLM:**
  Estruturado para pedir mensagens curtas, amigáveis e sem texto introdutório, reduzindo ruído no parser.
- **Retry automático:**
  Foi removido para evitar consumo extra da cota gratuita durante o desafio. Cada ação do usuário faz apenas uma tentativa ao LLM.
- **Limites da API Gemini:**
  Em caso de indisponibilidade temporária ou quota excedida, o app continua funcional via fallback local.

## Testes implementados

- **Backend:** teste cobrindo fallback quando o LLM falha, testes do parser de sugestões e testes do provider Gemini.
- **Flutter:** widget tests cobrindo fluxo de sucesso, loading e fluxo de erro da tela principal.

## Uso de IA

Utilizei assistente de IA (GitHub Copilot) para acelerar a escrita de código e testes, mas revisei manualmente prompts, fallback e arquitetura. Decisões de fallback, separação de camadas e tratamento de erros foram feitas por mim.

Também utilizei IA para acelerar refinamentos visuais na interface Flutter e cobertura de testes, mantendo revisão manual das alterações aplicadas.
