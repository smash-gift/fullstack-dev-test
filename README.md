# 🎁 Gift Message Suggester

Sugestor de mensagens para vale-presente com tecnologia de IA, desenvolvido como teste técnico Full Stack Sênior.

O sistema utiliza o Google Gemini para gerar mensagens personalizadas com base na ocasião e no relacionamento informados pelo usuário.

---

## 📁 Estrutura do Projeto
```
fullstack-dev-test/
├── backend/          # API Node.js + TypeScript
└── flutter_app/      # Aplicativo Flutter
```

---

## 🏗️ Arquitetura Geral
```
Flutter App
    │
    │  POST /api/suggestions
    │  { occasion, relationship }
    ▼
Node.js API
    │
    │  Prompt gerado dinamicamente
    ▼
Google Gemini 2.0 Flash Lite
    │
    │  Em caso de falha
    ▼
Fallback interno (sugestões padrão)
```

---

## 🚀 Como Rodar

### Pré-requisitos

- Node.js v20+
- Flutter 3.x / Dart 3.x
- Chave de API do Google Gemini ([aistudio.google.com](https://aistudio.google.com))

---

### Backend
```bash
# 1. Entre na pasta
cd backend

# 2. Instale as dependências
npm install

# 3. Configure o ambiente
cp .env.example .env
# Edite o .env com sua GEMINI_API_KEY

# 4. Rode o servidor
npm run dev
```

Disponível em:
- **API:** http://localhost:3000
- **Swagger:** http://localhost:3000/docs

> Use `USE_MOCK=true` no `.env` caso não tenha uma chave válida ou a cota esteja esgotada.

---

### Flutter
```bash
# 1. Entre na pasta
cd flutter_app

# 2. Instale as dependências
flutter pub get

# 3. Rode o app
# Simulador iOS / macOS:
flutter run

# Emulador Android:
flutter run --dart-define=BASE_URL=http://10.0.2.2:3000

# Dispositivo físico (substitua pelo IP da sua máquina):
flutter run --dart-define=BASE_URL=http://SEU_IP:3000
```

---

## 🧪 Testes

### Backend
```bash
cd backend
npm test
```

### Flutter
```bash
cd flutter_app
flutter test
```

---

## 📌 Decisões Técnicas

### Fallback silencioso
Quando o Gemini falha, o backend retorna sugestões genéricas com `source: "fallback"` em vez de um erro. O app Flutter exibe um toast informando o usuário sem bloquear a experiência.

### Modo Mock (USE_MOCK)
Variável de ambiente para desenvolvimento local sem dependência de cota de API. Basta trocar para `USE_MOCK=false` em produção.

### Clean Architecture no Flutter
Separação em camadas Data → Domain → Presentation com Cubit para gerenciamento de estado. Permite trocar a fonte de dados (API) sem afetar a UI.

### Arquitetura em camadas no Backend
Controller → Service → Provider. Permite trocar o provider de IA (ex: Gemini → OpenAI) sem afetar o restante da aplicação.

### Cache e Rate Limiting
Não implementados neste teste. Em produção:
- **Cache:** node-cache com TTL de 1h para combinações occasion+relationship
- **Rate Limiting:** express-rate-limit com 10 req/min por IP

---

## 🤖 Uso de IA

Este projeto foi desenvolvido com auxílio do Claude (Anthropic) como assistente de código. O assistente foi utilizado para implementação de testes e sugestões arquiteturais. 