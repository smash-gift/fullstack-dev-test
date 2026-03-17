# 🎁 Gift Message Suggester — Backend

API Node.js/TypeScript que utiliza IA (Google Gemini) para gerar sugestões de mensagens personalizadas para cartões de vale-presente.

---

## 📋 Sumário

- [Sobre o Projeto](#sobre-o-projeto)
- [Arquitetura](#arquitetura)
- [Tecnologias](#tecnologias)
- [Como Rodar](#como-rodar)
- [Endpoints](#endpoints)
- [Como Rodar os Testes](#como-rodar-os-testes)
- [Decisões e Compensações](#decisões-e-compensações)

---

## Sobre o Projeto

API REST que recebe uma **ocasião** e um **relacionamento** e retorna 2–3 sugestões de mensagens curtas geradas pelo modelo Gemini 2.0 Flash Lite. Em caso de falha da IA, o backend retorna sugestões de fallback sem expor erros ao cliente.

### Fluxo
```
POST /api/suggestions
        ↓
   Controller valida os campos
        ↓
   Service orquestra a lógica
        ↓
   Provider chama o Gemini
        ↓
   Retorna sugestões (source: "ai")
        ↓ (em caso de falha)
   Service usa fallback interno
        ↓
   Retorna sugestões (source: "fallback")
```

---

## Arquitetura

O projeto segue uma arquitetura em camadas inspirada nos princípios de separação de responsabilidades:
```
src/
├── controllers/         # Recebe requisições HTTP, valida entrada, devolve resposta
│   └── suggestions.controller.ts
├── services/            # Orquestra a lógica de negócio e o fallback
│   └── suggestions.service.ts
├── providers/           # Integração com serviços externos (Gemini)
│   └── gemini.provider.ts
├── routes/              # Definição das rotas e documentação Swagger
│   └── suggestions.routes.ts
├── errors/              # Classes de erro customizadas
│   └── app.error.ts
├── __tests__/           # Testes de integração
│   └── suggestions.test.ts
├── swagger.ts           # Configuração do Swagger
└── server.ts            # Entry point
```

### Responsabilidades de cada camada

**Controller** — responsável apenas por receber a requisição HTTP, validar os campos obrigatórios e retornar a resposta. Não contém lógica de negócio.

**Service** — orquestra a lógica de negócio. Chama o provider e decide se usa o fallback em caso de falha. É a única camada que conhece a regra do fallback.

**Provider** — responsável exclusivamente pela comunicação com o Gemini. Contém o prompt e o parsing da resposta. Pode ser trocado por outro LLM sem afetar as outras camadas.

---

## Tecnologias

| Tecnologia | Versão | Uso |
|---|---|---|
| Node.js | v20+ | Runtime |
| TypeScript | ^5.x | Tipagem estática |
| Express | ^4.x | Framework HTTP |
| @google/generative-ai | ^0.x | SDK do Gemini |
| swagger-ui-express | ^5.x | Documentação interativa |
| Jest + Supertest | ^29.x | Testes |
| ts-jest | ^29.x | Jest com TypeScript |

---

## Como Rodar

### Pré-requisitos

- Node.js v20+
- Chave de API do Google AI Studio ([aistudio.google.com](https://aistudio.google.com))

### 1. Instale as dependências
```bash
cd backend
npm install
```

### 2. Configure as variáveis de ambiente

Copie o arquivo de exemplo e preencha com sua chave:
```bash
cp .env.example .env
```

Edite o `.env`:
```env
GEMINI_API_KEY=sua_chave_aqui
PORT=3000
USE_MOCK=false
```

> **Modo mock:** se você não tiver uma chave válida ou a cota estiver esgotada, use `USE_MOCK=true` para retornar sugestões simuladas sem chamar o Gemini.

### 3. Rode o servidor
```bash
npm run dev
```

O servidor estará disponível em:
- **API:** http://localhost:3000
- **Swagger:** http://localhost:3000/docs

---

## Endpoints

### `POST /api/suggestions`

Gera sugestões de mensagens para vale-presente.

**Request:**
```json
{
  "occasion": "aniversário",
  "relationship": "amigo"
}
```

**Response (200 — IA):**
```json
{
  "suggestions": [
    "Feliz aniversário! Que este presente traga muita alegria.",
    "Parabéns, amigo! Você merece tudo de melhor.",
    "Com carinho, celebrando mais um ano da sua vida incrível!"
  ],
  "source": "ai"
}
```

**Response (200 — Fallback):**
```json
{
  "suggestions": [
    "Que este presente traga alegria e muitos sorrisos!",
    "Com carinho, pensando em você neste momento especial.",
    "Espero que goste deste presente feito com muito amor."
  ],
  "source": "fallback"
}
```

**Response (400 — Campos ausentes):**
```json
{
  "error": "Os campos 'occasion' e 'relationship' são obrigatórios."
}
```

---

## Como Rodar os Testes
```bash
cd backend
npm test
```

### O que é testado

| Teste | Descrição |
|---|---|
| Campos ausentes | Retorna 400 quando `occasion` ou `relationship` não são enviados |
| Sucesso com IA | Retorna sugestões com `source: "ai"` quando o Gemini responde |
| Fallback | Retorna sugestões com `source: "fallback"` quando o Gemini falha |

---

## Decisões e Compensações

### Fallback silencioso

Quando o Gemini falha (timeout, 429, 5xx), o backend **não retorna erro ao cliente** — retorna sugestões genéricas com `source: "fallback"`. Isso garante que o app Flutter continue funcionando mesmo com a IA indisponível.

O campo `source` permite que o frontend informe o usuário de forma transparente (via toast) sem bloquear a experiência.

### Separação Provider/Service

A lógica do Gemini foi isolada no `gemini.provider.ts` para que a troca de modelo (ex: Gemini → OpenAI) afete apenas o provider, sem tocar no service ou controller.

### Modo Mock (USE_MOCK)

Implementado via variável de ambiente para permitir desenvolvimento local sem dependência de cota de API. Em produção, basta configurar `USE_MOCK=false`.

### Cache

Cache não foi implementado neste teste. Em produção, a estratégia recomendada seria:
- Cache em memória (ex: node-cache) com TTL de 1 hora para combinações occasion+relationship já consultadas
- Isso reduziria drasticamente os custos de API, já que as combinações são finitas e previsíveis

### Rate Limiting

Rate limiting não foi implementado neste teste. Em produção, seria adicionado via `express-rate-limit` com limite de 10 requisições por minuto por IP, retornando 429 com mensagem clara ao cliente.

---

## Uso de IA

Este projeto foi desenvolvido com auxílio do Claude (Anthropic) como assistente de código. O assistente foi utilizado para:

- Ajuda na implementação da integração com o Gemini
- Geração dos testes com Jest e Supertest
- Configuração do Swagger
