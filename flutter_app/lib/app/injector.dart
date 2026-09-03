import 'package:http/http.dart' as http;

import 'core/config/settings_store.dart';
import 'core/drivers/http/http_client_adapter.dart';
import 'core/drivers/http/i_http_client.dart';
import '../modules/suggestions/domain/usecases/get_suggestions_usecase.dart';
import '../modules/suggestions/external/datasources/http_suggestions_datasource.dart';
import '../modules/suggestions/infra/repositories/suggestions_repository_impl.dart';
import '../modules/suggestions/presenter/stores/suggestions_store.dart';

/// The composition root: the one place allowed to build concrete classes.
///
/// Read it top to bottom and the whole dependency graph is on the screen. That
/// is the argument against a DI container here — with one module and one page,
/// a container would hide this list behind registrations and buy nothing back.
class Injector {
  Injector({IHttpClient? httpClient, SettingsStore? settings})
    : settings = settings ?? SettingsStore(),
      _httpClient = httpClient ?? HttpClientAdapter(http.Client());

  final SettingsStore settings;
  final IHttpClient _httpClient;

  late final SuggestionsStore suggestionsStore = SuggestionsStore(
    GetSuggestionsUseCase(
      SuggestionsRepositoryImpl(
        HttpSuggestionsDatasource(
          httpClient: _httpClient,
          // Resolved per request, so changing the address in the dialog takes
          // effect on the next tap rather than the next launch.
          baseUrlResolver: () => settings.baseUrl,
        ),
      ),
    ),
  );

  void dispose() {
    suggestionsStore.dispose();
    settings.dispose();
    _httpClient.close();
  }
}
