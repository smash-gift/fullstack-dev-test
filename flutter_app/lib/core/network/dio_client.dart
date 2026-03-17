import 'package:flutter_app/core/constants/api_constants.dart';
import 'package:dio/dio.dart';

class DioClient {
  DioClient._();

  static Dio createDio({void Function(String message)? onError}) {
    final dio = Dio(
      BaseOptions(
        baseUrl: ApiConstants.baseUrl,
        connectTimeout: const Duration(seconds: 10),
        receiveTimeout: const Duration(seconds: 10),
        headers: {'Content-Type': 'application/json'},
      ),
    );

    dio.interceptors.add(
      InterceptorsWrapper(
        onError: (DioException error, ErrorInterceptorHandler handler) {
          final isNetworkError =
              error.type == DioExceptionType.connectionTimeout ||
              error.type == DioExceptionType.receiveTimeout ||
              error.type == DioExceptionType.connectionError;

          if (isNetworkError) {
            final message = _resolveErrorMessage(error);
            onError?.call(message);
          }

          handler.next(error);
        },
      ),
    );

    return dio;
  }

  static String _resolveErrorMessage(DioException error) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.receiveTimeout:
        return 'Tempo de conexão esgotado. Tente novamente.';
      case DioExceptionType.connectionError:
        return 'Sem conexão com o servidor.';
      case DioExceptionType.badResponse:
        final statusCode = error.response?.statusCode;
        if (statusCode == 429) return 'Muitas requisições. Aguarde um momento.';
        if (statusCode != null && statusCode >= 500) {
          return 'Erro interno no servidor.';
        }
        return 'Erro na requisição.';
      default:
        return 'Erro inesperado. Tente novamente.';
    }
  }
}
