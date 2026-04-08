import 'dart:convert';
import 'package:http/http.dart' as http;

class SuggestionService {
  SuggestionService({http.Client? client, String? baseUrl})
      : _client = client ?? http.Client(),
        baseUrl = baseUrl ?? defaultBaseUrl;

  static const String defaultBaseUrl = 'http://localhost:3000';

  final http.Client _client;
  final String baseUrl;

  Future<List<String>> getSuggestions({
    required String occasion,
    required String relationship,
  }) async {
    final url = Uri.parse('$baseUrl/suggestions');
    final response = await _client.post(
      url,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'occasion': occasion,
        'relationship': relationship,
      }),
    );
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return List<String>.from(data['suggestions'] ?? []);
    } else {
      throw Exception('Erro ao buscar sugestões');
    }
  }
}
