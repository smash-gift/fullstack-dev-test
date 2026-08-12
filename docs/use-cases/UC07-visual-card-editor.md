# UC07 — Editor Visual de Cartão de Presente (Visual Card Canvas Editor)

- **Caso de Uso**: UC07
- **Atores**: Convidado (Guest User)
- **Status**: Aprovado

---

## 🎯 Objetivo
Permitir que o usuário transforme qualquer mensagem de texto sugerida pela IA em uma arte visual de cartão de presente personalizável, escolhendo entre temas estéticos pré-definidos, estilos de tipografia e alinhamento de layout.

---

## 📋 Pré-condições
- Uma mensagem de sugestão foi gerada (`UC03`) ou selecionada pelo usuário.

---

## 🔄 Fluxo Principal

1. O usuário clica no botão **"Criar Cartão Visual"** em um dos cartões de mensagem.
2. O aplicativo abre a tela **Editor Visual de Cartão**.
3. O centro da tela exibe o **Canvas do Cartão** (Preview ao vivo em alta resolução).
4. Na barra inferior de personalização, o usuário pode navegar entre os seletores:
   - **Temas Pré-definidos**:
     - *Aniversário Festivo* (Cores vibrantes, confetes sutis, visual alegre).
     - *Elegante Minimalista* (Fundo bege/champanhe, tipografia serifada fina, bordas douradas).
     - *Romântico Floral* (Gradientes suaves em tons pastel/rosa e ilustração floral).
     - *Dourado Premium* (Modo escuro luxuoso com detalhes dourados e fonte clássica).
   - **Tipografia & Fonte**: Escolha entre estilos (Moderna Sans-Serif, Clássica Serif, Cursiva Handcrafted).
   - **Alinhamento do Texto**: Esquerda, Centralizado ou Justificado.
5. Cada alteração atualiza instantaneamente a visualização no Canvas em tempo real.

---

## 🏁 Pós-condições
- A arte do cartão está configurada no Canvas e pronta para personalização de nomes (`UC08`) e exportação (`UC09`).
