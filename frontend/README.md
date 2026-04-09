# Gift Card Message Suggester - Frontend

Um aplicativo Flutter moderno e intuitivo que ajuda usuários a gerarem mensagens personalizadas para cartões de presente usando Inteligência Artificial (via API Node.js).

## 🚀 Tecnologias Utilizadas

*   **[Flutter](https://flutter.dev/):** Framework UI para desenvolvimento multiplataforma.
*   **[Dart](https://dart.dev/):** Linguagem de programação otimizada para interfaces.
*   **[HTTP](https://pub.dev/packages/http):** Pacote para consumo de APIs REST.
*   **Material Design 3:** Padrão visual moderno do Google.

## 📂 Estrutura de Pastas

```text
frontend/
├── .agents/                    # Configurações e Skills para agentes de IA (Gemini CLI)
├── android/                    # Código nativo para a plataforma Android
├── ios/                        # Código nativo para a plataforma iOS
├── lib/                        # Código fonte Dart (Core do projeto)
│   └── main.dart               # Ponto de entrada e interface principal do app
├── test/                       # Testes automatizados (Widgets e Unitários)
├── web/                        # Configurações para deploy na Web
├── assets/                     # Imagens, fontes e recursos estáticos (se houver)
├── pubspec.yaml                # Gerenciador de dependências e metadados do projeto
└── README.md                   # Documentação do projeto
```

### Detalhes das Pastas:
*   **`lib/`**: Contém toda a lógica de interface, gerenciamento de estado e integração com a API.
*   **`android/ios/linux/macos/windows/web`**: Pastas específicas de cada plataforma para configurações nativas (ícones, permissões, etc).
*   **`pubspec.yaml`**: Arquivo crucial onde definimos o nome do app, versão e bibliotecas externas como o `http`.

## 🛠️ Funcionalidades

1.  **Entrada de Dados:** Campos para definir a **Ocasião** (ex: Aniversário) e o **Relacionamento** (ex: Amigo).
2.  **Integração em Tempo Real:** Chamada para API Node.js que processa a sugestão.
3.  **Feedback de Carregamento:** Indicador visual no botão enquanto a IA gera as mensagens.
4.  **Lista de Sugestões:** Exibição elegante das mensagens numeradas em cards estilizados.
5.  **Limpeza Automática:** Os campos de entrada são limpos após o recebimento das sugestões.

## ⚙️ Como Executar o Projeto

### Pré-requisitos
*   Flutter SDK instalado ([Guia de Instalação](https://docs.flutter.dev/get-started/install)).
*   Um emulador configurado ou dispositivo físico conectado.
*   **API Rodando:** O servidor backend deve estar ativo na porta `5000`.

### Passo a Passo

1.  **Clone o repositório:**
    ```bash
    git clone <url-do-repositorio>
    cd fullstack-dev-test/frontend
    ```

2.  **Instale as dependências:**
    ```bash
    flutter pub get
    ```

3.  **Configuração de Rede (Importante):**
    O arquivo `lib/main.dart` está configurado atualmente para o IP `192.168.15.5`. 
    *   Se estiver usando **Emulador Android**, mude para `10.0.2.2`.
    *   Se estiver usando **Web/Desktop**, mude para `localhost`.
    *   Se estiver usando **Dispositivo Físico**, use o IP local da sua máquina.

4.  **Execute o aplicativo:**
    ```bash
    flutter run
    ```

## 📝 Notas de Desenvolvimento

O layout foi desenvolvido seguindo rigorosamente o mockup de design, utilizando uma arquitetura de flexbox (`Column`, `Row`, `Expanded`) para garantir que a interface seja responsiva e não apresente erros de transbordamento (overflow) em telas menores.
