import 'dart:ui';

import 'package:flutter/widgets.dart';

import 'app/app_widget.dart';
import 'app/injector.dart';
import 'config/internationalization/app_localizations.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Loaded before the first frame so no widget ever renders a raw key. The
  // device's language also becomes the language the API is asked to write in,
  // so the card reads like the interface around it.
  await AppLocalizations.instance.load(
    PlatformDispatcher.instance.locale,
  );

  runApp(AppWidget(injector: Injector()));
}
