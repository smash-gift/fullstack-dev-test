# UC09 — Exportação Multi-Formato PNG & PDF (Multi-Format Visual Export)

- **Caso de Uso**: UC09
- **Atores**: Convidado (Guest User)
- **Status**: Aprovado

---

## 🎯 Objetivo
Exportar o cartão visual finalizado em imagens de alta resolução (PNG) prontas para compartilhamento em redes sociais/WhatsApp, ou em formato PDF dobrável formatado para impressão física.

---

## 📋 Pré-condições
- A arte do cartão foi visualmente customizada e revisada pelo usuário (`UC07`, `UC08`).

---

## 🔄 Fluxo Principal

1. O usuário clica no botão principal **"Baixar / Compartilhar Cartão"**.
2. O aplicativo apresenta as opções de exportação:
   - 📱 **Salvar / Compartilhar Imagem (PNG HD)**:
     - Renderização no cliente via Flutter `RepaintBoundary` / Canvas em 1080x1920 (proporção Story/Vertical) ou 1080x1080 (Quadrado).
     - Abre a planilha de compartilhamento nativa ou salva diretamente na galeria de fotos.
   - 🖨️ **Gerar PDF Dobrável para Impressão**:
     - Renderiza o cartão centralizado em uma folha A4 com marcações sutis de dobra para impressão física.
     - Gera o arquivo `.pdf` no cliente e dispara a impressão nativa ou download.

---

## ⚡ Detalhes Técnicos de Renderização
- **100% Client-Side**: O processo de captura de pixels e montagem do PDF é realizado nativamente no dispositivo do usuário, garantindo privacidade total, custo zero de infraestrutura e tempo de resposta instantâneo.

---

## 🏁 Pós-condições
- O cartão visual em PNG ou PDF é entregue com sucesso ao usuário.
