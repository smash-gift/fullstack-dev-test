import 'package:flutter_app/features/suggestions/data/models/suggestion_response_model.dart';
import 'package:flutter_app/core/constants/api_constants.dart';
import 'package:flutter_app/core/errors/exceptions.dart';
import 'package:dio/dio.dart';

abstract interface class SuggestionsRemoteDatasource {
  Future<SuggestionResponseModel> getSuggestions({
    required String occasion,
    required String relationship,
  });
}

class SuggestionsRemoteDatasourceImpl implements SuggestionsRemoteDatasource {
  final Dio _dio;

  const SuggestionsRemoteDatasourceImpl(this._dio);

  @override
  Future<SuggestionResponseModel> getSuggestions({
    required String occasion,
    required String relationship,
  }) async {
    try {
      final response = await _dio.post(
        ApiConstants.suggestionsEndpoint,
        data: {'occasion': occasion, 'relationship': relationship},
      );

      return SuggestionResponseModel.fromJson(
        response.data as Map<String, dynamic>,
      );
    } on DioException catch (e) {
      if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.receiveTimeout ||
          e.type == DioExceptionType.connectionError) {
        throw NetworkException('Sem conexão com o servidor.');
      }

      throw ServerException(
        message: e.response?.data?['error'] as String? ?? 'Erro no servidor.',
        statusCode: e.response?.statusCode,
      );
    }
  }
}
