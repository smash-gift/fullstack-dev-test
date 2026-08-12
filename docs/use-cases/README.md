# Suite de Casos de Uso (Use Cases) — AI Gift Card Message Suggester

Esta pasta contém a especificação formal de todos os **Casos de Uso (UC01 a UC10)** da aplicação **AI Gift Card Message Suggester**, alinhados com a arquitetura do backend NestJS e as regras de negócio ([`RN01`](../specs/RN01-internationalization.md) a [`RN05`](../specs/RN05-multi-llm-fallback-chain.md)).

---

## 📌 Índice de Casos de Uso

| Código | Título do Caso de Uso | Descrição Resumida | Regra Vinculada | Arquivo de Especificação |
| :--- | :--- | :--- | :--- | :--- |
| **UC01** | Inicialização de Sessão de Convidado | Geração e retenção de 7 dias do `guest_id` anônimo | [`RN02`](../specs/RN02-guest-user.md), [`RN03`](../specs/RN03-user-caching.md) | [`UC01-guest-session.md`](UC01-guest-session.md) |
| **UC02** | Alternância de Idioma da Interface | Seleção dinâmica entre Português (`pt-BR`) e Inglês (`en-US`) | [`RN01`](../specs/RN01-internationalization.md) | [`UC02-language-switching.md`](UC02-language-switching.md) |
| **UC03** | Solicitando Sugestões de Mensagem | Requisição de sugestões por ocasião e relacionamento | [`API`](../specs/API-contract-spec.md) | [`UC03-generate-suggestions.md`](UC03-generate-suggestions.md) |
| **UC04** | Interação com Mensagens Sugeridas | Copiar texto em 1 clique, compartilhar e solicitar novas opções | [`API`](../specs/API-contract-spec.md) | [`UC04-message-interaction.md`](UC04-message-interaction.md) |
| **UC05** | Tratamento de Erro e Fallback de IA | Interface de erro amigável para HTTP 503 e botão de tentativa | [`RN04`](../specs/RN04-llm-failure-handling.md), [`RN05`](../specs/RN05-multi-llm-fallback-chain.md) | [`UC05-llm-fallback-ui.md`](UC05-llm-fallback-ui.md) |
| **UC06** | Validação de Formulário e Edge Cases | Validação inline de campos obrigatórios e caracteres | [`API`](../specs/API-contract-spec.md) | [`UC06-form-validation.md`](UC06-form-validation.md) |
| **UC07** | Editor Visual de Cartão de Presente | Seleção de temas visuais, fontes, alinhamentos e bordas | Frontend Canvas | [`UC07-visual-card-editor.md`](UC07-visual-card-editor.md) |
| **UC08** | Personalização De / Para e Dedicação | Inserção de nomes do remetente, destinatário e memória | Frontend Canvas | [`UC08-sender-recipient-dedication.md`](UC08-sender-recipient-dedication.md) |
| **UC09** | Exportação Multi-Formato (PNG e PDF) | Renderização no cliente em imagem HD para redes e PDF dobrável | Frontend Render | [`UC09-multi-format-export.md`](UC09-multi-format-export.md) |
| **UC10** | Galeria de Cartões Favoritos Local | Armazenamento persistente de cartões criados em `SharedPreferences` | [`RN03`](../specs/RN03-user-caching.md) | [`UC10-local-saved-gallery.md`](UC10-local-saved-gallery.md) |

---

## 🎨 Prototipagem no STITCH

Para prototipar a interface visual no **STITCH** com a paleta oficial extraída do portal DQR Tech, utilize os prompts estruturados e tokens visuais documentados em:
👉 **[`stitch-master-prompt-dqr.md`](stitch-master-prompt-dqr.md)** *(Prompt Mestre DQR Tech)*  
👉 **[`stitch-prototyping-prompts.md`](stitch-prototyping-prompts.md)** *(Prompts por Tela)*
