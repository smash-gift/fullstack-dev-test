import 'package:dio/dio.dart';
import 'package:gift_card_suggester/data/models/suggestion_response.dart';
import 'package:gift_card_suggester/domain/failure.dart';

/// Thin API client responsible only for HTTP: it knows nothing about UI or
/// state. It translates transport-level errors into typed [Failure]s so the
/// rest of the app never has to reason about [DioException].
class SuggestionApiClient {
  SuggestionApiClient({required String baseUrl, Dio? dio})
      : _dio = dio ??
            Dio(
              BaseOptions(
                baseUrl: baseUrl,
                connectTimeout: const Duration(seconds: 10),
                receiveTimeout: const Duration(seconds: 12),
                contentType: 'application/json',
              ),
            );

  final Dio _dio;

  /// Requests suggestions for the given [occasion] and [relationship].
  ///
  /// Throws a [Failure] on any error condition.
  Future<SuggestionResponse> fetchSuggestions({
    required String occasion,
    required String relationship,
  }) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/api/suggestions',
        data: <String, dynamic>{
          'occasion': occasion,
          'relationship': relationship,
        },
      );

      final data = response.data;
      if (data == null) {
        throw const Failure(
          FailureKind.server,
          'The server returned an empty response.',
        );
      }
      return SuggestionResponse.fromJson(data);
    } on DioException catch (e) {
      throw _mapDioException(e);
    }
  }

  Failure _mapDioException(DioException e) {
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return const Failure(
          FailureKind.timeout,
          'The request timed out. Please try again.',
        );
      case DioExceptionType.connectionError:
      case DioExceptionType.unknown:
        return const Failure(
          FailureKind.network,
          'Could not reach the server. Check your connection and the API URL.',
        );
      case DioExceptionType.badResponse:
        final status = e.response?.statusCode ?? 0;
        if (status == 429) {
          return const Failure(
            FailureKind.rateLimited,
            'Too many requests. Please wait a moment and try again.',
          );
        }
        if (status >= 400 && status < 500) {
          return const Failure(
            FailureKind.badRequest,
            'The request was invalid. Please check your input.',
          );
        }
        return const Failure(
          FailureKind.server,
          'The server had a problem. Please try again shortly.',
        );
      case DioExceptionType.cancel:
      case DioExceptionType.badCertificate:
      // Any future DioExceptionType (e.g. transformTimeout) also lands here.
      // ignore: no_default_cases
      default:
        return const Failure(
          FailureKind.unknown,
          'Something went wrong. Please try again.',
        );
    }
  }
}
