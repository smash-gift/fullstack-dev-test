import 'package:flutter/material.dart';
import '../config/app_config.dart';
import '../data/repositories/suggester_repository.dart';
import '../data/services/api_service.dart';
import '../features/suggester/view_models/suggester_view_model.dart';
import '../features/suggester/widgets/suggester_screen.dart';

/// Central application route declaration.
class AppRouter {
  static Widget buildHomeScreen(AppConfig config) {
    final apiService = ApiService(config: config);
    final repository = SuggesterRepositoryImpl(apiService: apiService);
    final viewModel = SuggesterViewModel(repository: repository);
    return SuggesterScreen(viewModel: viewModel);
  }
}
