/// Global application configuration and environment settings.
class AppConfig {
  final String apiBaseUrl;
  final String environmentName;

  const AppConfig({
    required this.apiBaseUrl,
    required this.environmentName,
  });

  /// Factory constructor for development environment.
  factory AppConfig.development() {
    return const AppConfig(
      apiBaseUrl: String.fromEnvironment('API_BASE_URL', defaultValue: 'http://localhost:3000'),
      environmentName: 'development',
    );
  }

  /// Factory constructor for staging environment.
  factory AppConfig.staging() {
    return const AppConfig(
      apiBaseUrl: String.fromEnvironment('API_BASE_URL', defaultValue: 'https://staging-api.dqrtech.com'),
      environmentName: 'staging',
    );
  }

  /// Factory constructor for production environment.
  factory AppConfig.production() {
    return const AppConfig(
      apiBaseUrl: String.fromEnvironment('API_BASE_URL', defaultValue: 'https://api.dqrtech.com'),
      environmentName: 'production',
    );
  }
}
