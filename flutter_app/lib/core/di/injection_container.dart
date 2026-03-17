import 'package:flutter_app/features/suggestions/data/datasources/suggestions_remote_datasource.dart';
import 'package:flutter_app/features/suggestions/data/repositories/suggestions_repository_impl.dart';
import 'package:flutter_app/features/suggestions/domain/repositories/suggestions_repository.dart';
import 'package:flutter_app/features/suggestions/presentation/cubit/suggestions_cubit.dart';
import 'package:flutter_app/features/suggestions/domain/usecases/get_suggestions.dart';
import 'package:flutter_app/core/utils/toast_service.dart';
import 'package:flutter_app/core/network/dio_client.dart';
import 'package:flutter/material.dart';
import 'package:get_it/get_it.dart';
import 'package:dio/dio.dart';

final sl = GetIt.instance;

final navigatorKey = GlobalKey<NavigatorState>();

void setupDependencies() {
  sl.registerLazySingleton<Dio>(
    () => DioClient.createDio(
      onError: (message) {
        final context = navigatorKey.currentContext;
        if (context != null && context.mounted) {
          ToastService.showError(context, message);
        }
      },
    ),
  );

  sl.registerLazySingleton<SuggestionsRemoteDatasource>(
    () => SuggestionsRemoteDatasourceImpl(sl<Dio>()),
  );

  sl.registerLazySingleton<SuggestionsRepository>(
    () => SuggestionsRepositoryImpl(sl<SuggestionsRemoteDatasource>()),
  );

  sl.registerLazySingleton(() => GetSuggestions(sl<SuggestionsRepository>()));

  sl.registerFactory(() => SuggestionsCubit(sl<GetSuggestions>()));
}
