import 'dart:ui';

import 'package:flutter/widgets.dart';

import 'app/app_widget.dart';
import 'app/injector.dart';
import 'config/internationalization/app_localizations.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Loaded before the first frame so no widget ever renders a raw key.
  //
  // This sets the language of the INTERFACE only. The card messages follow
  // what the user types instead, because the two are genuinely different
  // questions: someone on an English phone can write a Portuguese card for
  // their wife, and the phone is the wrong authority on that.
  await AppLocalizations.instance.load(
    PlatformDispatcher.instance.locale,
  );

  runApp(AppWidget(injector: Injector()));
}
