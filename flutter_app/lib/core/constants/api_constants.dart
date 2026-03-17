class ApiConstants {
  ApiConstants._();

  static const String baseUrl = String.fromEnvironment(
    'BASE_URL',
    defaultValue: 'http://localhost:3000',
  );

  static const String suggestionsEndpoint = '/api/suggestions';
}
