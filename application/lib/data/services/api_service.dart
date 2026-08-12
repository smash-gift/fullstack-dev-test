import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../config/app_config.dart';
import '../model/suggestion_model.dart';

/// Data service handling HTTP communication with NestJS API.
class ApiService {
  final http.Client _client;
  final AppConfig _config;

  ApiService({
    http.Client? client,
    required AppConfig config,
  })  : _client = client ?? http.Client(),
        _config = config;

  Future<List<SuggestionModel>> fetchSuggestions({
    required String occasion,
    required String relationship,
    required String language,
    required String guestId,
  }) async {
    final url = Uri.parse('${_config.apiBaseUrl}/api/v1/suggestions');
    final response = await _client.post(
      url,
      headers: {
        'Content-Type': 'application/json',
        'X-Guest-ID': guestId,
        'Accept-Language': language,
      },
      body: jsonEncode({
        'occasion': occasion,
        'relationship': relationship,
        'language': language,
      }),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      final items = data['suggestions'] as List<dynamic>? ?? [];
      return items
          .map((item) => SuggestionModel.fromJson(item as Map<String, dynamic>))
          .toList();
    } else {
      throw Exception(
          'Failed to fetch suggestions (${response.statusCode}): ${response.body}');
    }
  }
}
