import 'dart:convert';

import 'package:http/http.dart' as http;

import '../config/app_config.dart';
import 'api_exceptions.dart';

/// Cliente HTTP fino e isolado, responsável apenas por falar com o backend do smash-gift.
///
/// Isolar a chamada HTTP aqui (em vez de espalhar `http.post` pelos repositórios) permite ajustar
/// path, headers ou tratamento de erro num único lugar.
class ApiClient {
  ApiClient({required AppConfig config, http.Client? httpClient})
      : _baseUrl = config.apiBaseUrl,
        _httpClient = httpClient ?? http.Client();

  final String _baseUrl;
  final http.Client _httpClient;

  static const _timeout = Duration(seconds: 20);
  static const _jsonHeaders = {'Content-Type': 'application/json'};

  /// Faz um POST com corpo JSON e devolve o corpo decodificado como mapa.
  ///
  /// Lança [NetworkException] se a requisição não completar, [ServerException] se o status HTTP
  /// não for 2xx, e [UnexpectedResponseException] se o corpo não for um JSON de objeto válido.
  Future<Map<String, dynamic>> post(String path, Map<String, dynamic> body) async {
    final uri = Uri.parse('$_baseUrl$path');

    final http.Response response;
    try {
      response = await _httpClient
          .post(uri, headers: _jsonHeaders, body: jsonEncode(body))
          .timeout(_timeout);
    } on Exception {
      throw const NetworkException();
    }

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw _serverExceptionFor(response);
    }

    try {
      final decoded = jsonDecode(response.body);
      if (decoded is Map<String, dynamic>) {
        return decoded;
      }
      throw const UnexpectedResponseException();
    } on FormatException {
      throw const UnexpectedResponseException();
    }
  }

  /// Monta o [ServerException] para uma resposta com status fora de 2xx.
  ///
  /// Tenta interpretar o corpo no formato de erro estruturado documentado em
  /// `docs/contracts/api-contracts.md` (`{"error": {"code", "message", "details"}}`). Se o corpo
  /// não vier nesse formato (JSON inválido, sem chave `error`, ou `code`/`message` com tipo
  /// errado), cai no [ServerException] genérico de sempre.
  ServerException _serverExceptionFor(http.Response response) {
    try {
      final decoded = jsonDecode(response.body);
      if (decoded is Map<String, dynamic>) {
        final error = decoded['error'];
        if (error is Map<String, dynamic>) {
          final code = error['code'];
          final message = error['message'];
          if (code is String && message is String) {
            final rawDetails = error['details'];
            final details = rawDetails is List ? rawDetails.whereType<String>().toList() : null;
            return ServerException(response.statusCode, message, code, details);
          }
        }
      }
    } on FormatException {
      // Corpo não é JSON válido — cai no fallback genérico abaixo.
    }
    return ServerException(response.statusCode);
  }

  void close() => _httpClient.close();
}
