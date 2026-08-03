---
name: flutter-test
description: Roda o analyze e os testes de widget do app Flutter do gift message suggester. Use após alterar qualquer arquivo em flutter_app/.
---

# Flutter — analyze + testes

```bash
cd flutter_app
flutter analyze
flutter test
```

`test/widget_test.dart` cobre o app de ponta a ponta (UI → estado → API) usando `MockClient` de `package:http/testing`, sem backend real:
- happy path Birthday + Friend renderiza as sugestões;
- falha do backend mostra mensagem amigável;
- inputs vazios são validados antes de chamar a API.
