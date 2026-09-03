# flutter_app

The Flutter client for the gift card message suggester.

```bash
flutter pub get
flutter run -d chrome --dart-define=API_BASE_URL=http://localhost:3000
```

The backend has to be running first — see [`../backend/`](../backend/). The address is also
editable at runtime from the icon in the top right, so a running app can be pointed
somewhere else without a rebuild.

| | |
|---|---|
| Architecture | [`../docs/01-architecture/frontend.md`](../docs/01-architecture/frontend.md) |
| Running everything locally | [`../docs/04-operations/running-locally.md`](../docs/04-operations/running-locally.md) |
| Tests | `flutter test` — 95 offline, no network and no backend needed |

**There is no API key in this project, and no place to put one.** A credential shipped in
a client is extractable from the bundle however it is stored, so the key lives on the
server and this app only ever knows an address.
