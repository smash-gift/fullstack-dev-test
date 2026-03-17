# 🎁 Gift Message Suggester — Flutter App

Aplicativo Flutter que consome a API de sugestão de mensagens para vale-presentes com tecnologia de IA.

---

## 📋 Sumário

- [Sobre o Projeto](#sobre-o-projeto)
- [Arquitetura](#arquitetura)
- [Tecnologias](#tecnologias)
- [Como Rodar](#como-rodar)
- [Como Rodar os Testes](#como-rodar-os-testes)
- [Decisões e Compensações](#decisões-e-compensações)

---

## Sobre o Projeto

O aplicativo permite que o usuário selecione uma **ocasião** (ex: Aniversário, Casamento) e um **relacionamento** (ex: Amigo, Pai), e receba 2–3 sugestões de mensagens personalizadas geradas por IA para incluir em um cartão de vale-presente.

### Fluxo da aplicação
```
Usuário seleciona ocasião + relacionamento
        ↓
   Clica em "Gerar Sugestões"
        ↓
   Cubit emite estado Loading
        ↓
   UseCase chama Repository
        ↓
   Repository chama Datasource (Dio → API Node.js)
        ↓
   API chama Gemini (ou retorna fallback)
        ↓
   Cubit emite estado Success ou Error
        ↓
   UI exibe os cards com as sugestões
```

---

## Arquitetura

O projeto segue os princípios de **Clean Architecture** com separação em 3 camadas principais:
```
lib/
├── core/
│   ├── constants/        # Constantes globais (URLs, etc.)
│   ├── di/               # Injeção de dependências (GetIt)
│   ├── errors/           # Failures e Exceptions
│   ├── network/          # Cliente Dio com interceptors
│   └── utils/            # Utilitários (ToastService)
│
└── features/
    └── suggestions/
        ├── data/
        │   ├── datasources/     # Comunicação com a API (Dio)
        │   ├── models/          # Modelos de resposta da API
        │   └── repositories/    # Implementação dos repositórios
        │
        ├── domain/
        │   ├── entities/        # Entidades de negócio
        │   ├── repositories/    # Contratos (interfaces)
        │   └── usecases/        # Casos de uso
        │
        └── presentation/
            ├── cubit/           # Gerenciamento de estado
            └── pages/           # UI
```

### Camadas

**Data** — responsável por se comunicar com o mundo externo (API). Conhece modelos JSON e o Dio.

**Domain** — núcleo da aplicação, sem dependências externas. Define entidades, contratos de repositório e casos de uso.

**Presentation** — interface com o usuário. O Cubit consome os casos de uso e emite estados para a UI.

### Por que Cubit?

O Cubit foi escolhido por ser mais simples que o Bloc completo (sem Events), reduzindo boilerplate sem abrir mão da separação de responsabilidades e testabilidade. Para um fluxo linear como este (input → loading → success/error), o Cubit é suficiente e mais legível.

### Por que GetIt?

O GetIt foi escolhido como service locator por ser leve, sem necessidade de geração de código, e amplamente adotado no ecossistema Flutter com Clean Architecture.

---

## Tecnologias

| Pacote | Versão | Uso |
|---|---|---|
| flutter_bloc | ^9.1.1 | Gerenciamento de estado (Cubit) |
| dio | ^5.9.2 | Cliente HTTP |
| get_it | ^9.2.1 | Injeção de dependências |
| equatable | ^2.0.8 | Comparação de objetos/estados |
| another_flushbar | ^1.12.30 | Notificações toast |
| bloc_test | ^10.0.0 | Testes de Cubit |
| mocktail | ^1.0.4 | Mocks para testes |

---

## Como Rodar

### Pré-requisitos

- Flutter 3.x com Dart 3.x
- Backend rodando localmente (veja o README do backend)

### 1. Instale as dependências
```bash
flutter pub get
```

### 2. Configure a URL do backend

Por padrão o app aponta para `http://localhost:3000`.

Para rodar em um dispositivo físico ou emulador Android, substitua `localhost` pelo IP da sua máquina:
```bash
# Emulador Android
flutter run --dart-define=BASE_URL=http://10.0.2.2:3000

# Dispositivo físico (substitua pelo IP da sua máquina)
flutter run --dart-define=BASE_URL=http://192.168.x.x:3000

# Simulador iOS ou macOS (localhost funciona diretamente)
flutter run
```

### 3. Rode o app
```bash
flutter run
```

---

## Como Rodar os Testes
```bash
# Todos os testes
flutter test

# Com cobertura
flutter test --coverage

# Teste específico
flutter test test/features/suggestions/cubit/suggestions_cubit_test.dart
```

### O que é testado

| Teste | Cobertura |
|---|---|
| `suggestions_cubit_test.dart` | Loading → Success (IA), Loading → Success (fallback), Loading → Error (network), Loading → Error (server), Reset |
| `suggestions_repository_impl_test.dart` | Mapeamento AI→entity, Fallback→entity, NetworkException→NetworkFailure, ServerException→ServerFailure |

---

## Decisões e Compensações

### Separação Entity vs Model

Embora a API retorne uma estrutura simples (`suggestions: string[]`), a separação entre `SuggestionResponseModel` (camada data) e `SuggestionResult` (camada domain) foi mantida intencionalmente.

**Motivo:** o model conhece detalhes da API (`source: "ai" | "fallback"`), enquanto a entity traduz isso para linguagem de negócio (`isFromFallback: bool`). Se a API mudar o campo `source` para `origin`, apenas o model precisa ser atualizado — o domínio e a UI permanecem intactos.

### Toast via Interceptor

Erros de conectividade (timeout, sem conexão) disparam um toast automaticamente via interceptor do Dio, sem precisar de lógica na UI. Erros de negócio (400, 500) são tratados pelo Cubit e exibidos como estado de erro na tela — evitando duplicidade de feedback.

### URL Configurável via --dart-define

A URL base do backend é configurável em tempo de build via `--dart-define=BASE_URL=...`, sem necessidade de arquivos `.env` no Flutter. Isso segue a prática recomendada para apps Flutter e facilita a configuração em diferentes ambientes.

---

## Uso de IA

Este projeto foi desenvolvido com auxílio do Claude (Anthropic) como assistente de código. O assistente foi utilizado para:

- Implementação dos testes unitários com bloc_test e mocktail
- Sugestões de tratamento de erros

