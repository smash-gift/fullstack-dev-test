# Message Sugester Backend 🚀

Este é o serviço de backend do **Message Sugester**, uma API robusta desenvolvida em Node.js para sugerir frases personalizadas utilizando Inteligência Artificial (Google Gemini). O projeto foi construído com foco em **resiliência**, **manutenibilidade** e **performance**.

---

## 🛠 Tecnologias Utilizadas

- **Runtime:** [Node.js v24+](https://nodejs.org/)
- **Linguagem:** [TypeScript 6.0](https://www.typescriptlang.org/)
- **Framework Web:** [Express 5](https://expressjs.com/)
- **IA SDK:** [@google/generative-ai](https://www.npmjs.com/package/@google/generative-ai)
- **Runtime de Desenvolvimento:** [tsx](https://tsx.is/) (Execução nativa de TS com suporte a ESM)
- **Testes:** [Jest](https://jestjs.io/) com [ts-jest](https://kulshekhar.github.io/ts-jest/)
- **Padronização:** [Node.js Backend Patterns Skill](.agents/skills/nodejs-backend-patterns/SKILL.md)

---

## 📁 Estrutura de Pastas

O projeto segue uma **Arquitetura em Camadas (Layered Architecture)** para separação de responsabilidades:

```text
backend/
├── .agents/                # Habilidades (skills) e instruções do agente Gemini CLI
├── src/
│   ├── domain/             # Lógica de negócio organizada por domínios e versões
│   │   └── v1/
│   │       └── messager-sugester/
│   │           ├── controllers/    # Entrada: Validação de req e resposta HTTP
│   │           ├── services/       # Core: Regras de negócio e coordenação
│   │           └── routes.ts       # Definição dos endpoints do domínio
│   ├── integrations/       # Adaptadores para serviços externos
│   │   └── ai/
│   │       ├── prompts/            # Templates de prompts para a IA
│   │       ├── ai.adapter.ts       # Classe base abstrata para IA
│   │       └── gemini.adapter.ts   # Implementação específica do Google Gemini
│   ├── middleware/         # Interceptadores (Error Handler, Logging, etc.)
│   ├── utils/              # Helpers e classes utilitárias (Erros customizados)
│   └── index.ts            # Ponto de entrada da aplicação
├── jest.config.js          # Configuração de testes para ESM
├── tsconfig.json           # Configuração TypeScript (ModuleResolution: Bundler)
└── .env                    # Variáveis de ambiente (API Keys, Modelos)
```

---

## 🛡 Estratégias de Resiliência (Retry & Fallback)

Uma das maiores preocupações deste projeto é garantir que o usuário nunca fique sem uma resposta, mesmo se a API de IA falhar. Implementamos três níveis de proteção:

### 1. Sistema de Retentativas (Retry)
No `GeminiAdapter`, se a API retornar erros temporários como `503 (Service Unavailable)` ou `429 (Too Many Requests)`, o sistema realiza até **3 retentativas** automáticas com **backoff exponencial** (tempo de espera aumenta a cada falha).

### 2. Cascata de Modelos (Model Priority Fallback)
Se um modelo falhar persistentemente ou retornar `404 (Not Found)`, o adaptador tenta automaticamente o próximo modelo em uma lista de prioridade:
1. `gemini-2.5-flash`
2. `gemini-2.5-flash-lite`
3. `gemini-2.0-flash`
4. `gemini-2.5-pro`

### 3. Último Recurso (The Final Card)
Se todas as tentativas de IA falharem, a camada de **Service** captura o erro e ativa o **"Ultimo recurso"**. 
- O sistema possui uma lista estática de **10 frases motivadoras e educadas**.
- São selecionadas **3 frases aleatoriamente** para retornar ao usuário.
- Um log de erro de nível `error` é gerado com a tag `[Ultimo recurso]` para alertar a equipe de infraestrutura.

---

## ⚙️ Como Rodar o Projeto

### Pré-requisitos
- Node.js instalado.
- Uma chave de API do [Google AI Studio](https://aistudio.google.com/).

### Passo a Passo

1. **Instalar dependências:**
   ```bash
   npm install
   ```

2. **Configurar variáveis de ambiente:**
   Crie um arquivo `.env` na raiz:
   ```env
   GEMINI_API_KEY=sua_chave_aqui
   GEMINI_MODEL_NAME=gemini-1.5-pro
   ```

3. **Rodar em modo desenvolvimento (com auto-reload):**
   ```bash
   npm run dev
   ```

4. **Rodar testes:**
   ```bash
   npm test
   ```

---

## 🛣 API Endpoints

### POST `/v1/messager-sugester`
Sugere frases baseadas em uma ocasião e relacionamento.

**Request Body:**
```json
{
  "occasion": "Aniversário",
  "relationship": "Melhor Amigo"
}
```

**Response (200 OK):**
```json
{
  "result": [
    "Frase sugerida 1",
    "Frase sugerida 2",
    "Frase sugerida 3"
  ]
}
```

---

## ⚖️ Sanitização e Tokens
Para otimizar o custo e o uso de tokens, o controlador realiza o `trim()` automático em todos os inputs, removendo espaços desnecessários antes de enviar o prompt para a IA.
