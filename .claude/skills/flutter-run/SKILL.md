---
name: flutter-run
description: Roda o app Flutter do gift message suggester apontando para o backend via base URL configurável. Use para testar a UI localmente.
---

# Flutter — rodar o app

```bash
cd flutter_app
flutter pub get   # apenas na primeira vez
flutter run --dart-define=API_BASE_URL=http://localhost:8080
```

Notas importantes de base URL:
- **Chrome / desktop:** `http://localhost:8080`.
- **Emulador Android:** o host é `http://10.0.2.2:8080` (localhost aponta para o próprio emulador).
- **Dispositivo físico:** use o IP da máquina na LAN, ex. `http://192.168.0.10:8080`.

Suba o backend antes (skill `backend-dev`). O fluxo mínimo a validar: escolher **Birthday + Friend** → *Suggest messages* → ver as sugestões.
