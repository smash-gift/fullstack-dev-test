/// Configuração de runtime do app, resolvida em tempo de compilação via `--dart-define`.
///
/// Ver `mobile/.env.example` e a spec técnica do mobile
/// (`docs/specs/2026-08-12-mobile-technical-design.md`) para o motivo de não usar um pacote de
/// `.env` (ex.: flutter_dotenv): o Dart já oferece `String.fromEnvironment` nativamente.
class AppConfig {
  const AppConfig({required this.apiBaseUrl});

  /// URL base do backend (ver `docs/contracts/api-contracts.md`).
  final String apiBaseUrl;

  factory AppConfig.fromEnvironment() {
    return const AppConfig(
      apiBaseUrl: String.fromEnvironment(
        'API_BASE_URL',
        defaultValue: 'http://10.0.2.2:3001',
      ),
    );
  }
}
