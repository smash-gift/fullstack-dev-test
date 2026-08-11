# STITCH Prototyping Prompts — AI Gift Card Message Suggester

Este documento reúne a biblioteca de **Prompts Estruturados para o STITCH** (Google Stitch UI Builder / AI Wireframing tool), desenhados especificamente para gerar protótipos de alta fidelidade das telas da aplicação.

---

## 🎨 Paleta de Cores e Guia Visual (Design System Tokens)

- **Primary Color**: `#6C5CE7` (Deep Soft Purple)
- **Secondary / Accent**: `#FF7675` (Warm Coral / Pink Accent)
- **Background Light**: `#FAFAFE` (Soft Lavender White)
- **Background Dark Card**: `#1E1E2E` (Sleek Dark Navy)
- **Surface / Card Background**: `#FFFFFF` com sombra suave `box-shadow: 0 8px 24px rgba(108, 92, 231, 0.08)`
- **Typography**: Google Fonts Inter / Outfit (Modern, Clean Sans-Serif)

---

## 📱 Prompt 1: Tela Principal (Formulário & Estado Inicial — UC01, UC02, UC03, UC06)

```markdown
Design a modern, mobile-first Web & Mobile UI for an "AI Gift Card Message Suggester" app.

Top Bar (AppBar):
- Left: App logo with a shiny gift icon and title "GiftCard AI".
- Right: A sleek pill-shaped language switcher dropdown button showing "🇧🇷 PT | 🇺🇸 EN" and a subtle "Guest" anonymous user badge avatar.

Hero Header:
- Catchy title: "Find the Perfect Words for Any Gift Card" with a soft purple gradient subtitle "Powered by Gemini AI".

Main Input Form Card:
- Input 1 (Occasion): Floating chip selector for popular occasions: "🎂 Birthday", "💍 Wedding", "🎓 Graduation", "❤️ Love", "🎄 Christmas", plus an "Other..." custom text field.
- Input 2 (Relationship): Floating chip selector: "Best Friend", "Mother", "Partner", "Co-worker", "Sibling".
- Action Button: Large, full-width gradient button with a glowing spark icon labeled "Generate Message Suggestions" (`#6C5CE7` to `#A29BFE`).

Footer:
- Clean minimalist footer showing "Anonymous session active • No login required".
```

---

## ⏳ Prompt 2: Estado de Carregamento & Geração de IA (Loading State — UC03)

```markdown
Design a loading & shimmering visual state for the AI Gift Card Suggester screen.

Main Elements:
- Keep the TopBar intact.
- Replace the main button with a pulsing animated loader containing glowing sparkles and text "Crafting heartfelt messages with AI...".
- Display 3 skeleton card placeholders with smooth shimmering light-gray to soft purple gradient animation (`#F0EDFF`).
- Add a subtle floating progress badge: "Connecting to Gemini Provider...".
```

---

## ✨ Prompt 3: Tela de Resultados com Cards de Mensagens (UC03, UC04)

```markdown
Design the Results View for the AI Gift Card Message Suggester app after AI suggestions are returned.

Content Layout:
- Top bar with a "← Back to Edit" button and active filters badge: "Occasion: Birthday • For: Best Friend".
- Main List: Display 2 distinct, beautiful gift card suggestion cards.
  - Card 1: Modern card with rounded corners (16px), subtle border, soft purple accent quotes. Message text displayed in elegant typography.
    - Bottom Action Bar:
      - "Copy Text" button with clipboard icon (shows Toast "Copied!").
      - "Share" button with native share icon.
      - Prominent "🎨 Design Visual Card" button with magic wand icon.
  - Card 2: Alternative card style with a heart icon and quick copy button.
- Bottom Floating Action: "🔄 Try Different Suggestions" button.
```

---

## 🛠️ Prompt 4: Editor Visual de Cartão de Presente (Canvas Editor — UC07, UC08, UC09)

```markdown
Design an interactive "Visual Gift Card Canvas Editor" screen.

Screen Structure:
- Top Header: Close button (X), Title "Customize Gift Card Canvas", and Top Right "Export / Share" button.
- Central Preview Area: A high-definition vertical Gift Card canvas preview (aspect ratio 9:16) rendering:
  - Header text: "Para: Maria" in handwritten calligraphy.
  - Body text: The selected AI message formatted in elegant centered typography.
  - Footer text: "De: Lucas • Com carinho" with a small ribbon icon.
  - Background theme preview (e.g. "Festive Birthday" theme with golden dust and pastel gradient).

Bottom Control Panel (Horizontal Scrollable Tabs):
- Tab 1 (Themes): Visual thumbnail chips for preset themes: "Festive Birthday", "Elegant Minimalist", "Romantic Floral", "Premium Gold".
- Tab 2 (Dedication): Input fields for "To (Recipient)" and "From (Sender)".
- Tab 3 (Typography): Font family selector (Serif, Sans, Cursiva) and text alignment tools.

Export Bottom Sheet:
- Triggered by "Export": Modal offering two large option cards: "📱 Save PNG Image (HD for WhatsApp/Instagram)" and "🖨️ Download Printable PDF Card (Foldable A4)".
```

---

## 🚨 Prompt 5: Estado de Erro e Indisponibilidade 503 (LLM Fallback UI — UC05)

```markdown
Design a friendly Error & Service Unavailable state screen for HTTP 503 LLM failure.

Central Card:
- Soft red/orange muted background (`#FFF0F0`) with rounded corners.
- Illustration/Icon: A friendly, floating cloud with a temporary pause icon.
- Heading: "AI Service Temporarily Busy".
- Body text: "Our AI generation providers are experiencing high demand right now. Please try again in a few moments."
- Primary Action Button: "Tentar Novamente (Retry Suggestion)" in warm purple with a refresh icon.
- Secondary Link: "Use a template message instead".
```
