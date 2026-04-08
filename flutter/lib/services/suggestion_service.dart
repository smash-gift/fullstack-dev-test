import 'dart:convert';
import 'package:http/http.dart' as http;

class SuggestionService {
  // Altere para a URL do seu backend
  static String baseUrl = 'http://localhost:3000';

  static Future<List<String>> getSuggestions({
    required String occasion,
    required String relationship,
  }) async {
    final url = Uri.parse('$baseUrl/suggestions');
    final response = await http.post(
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
