import 'dart:async';

import 'package:google_fonts/google_fonts.dart';

/// Executado automaticamente pelo `flutter_test` antes de qualquer teste neste diretório.
///
/// Desliga o carregamento de fontes via rede do `google_fonts` durante os testes — sem isso, os
/// widget tests poderiam tentar buscar Montserrat/Poppins pela internet, tornando a suíte lenta e
/// não-determinística. Ver https://pub.dev/packages/google_fonts#testing.
Future<void> testExecutable(FutureOr<void> Function() testMain) async {
  GoogleFonts.config.allowRuntimeFetching = false;
  await testMain();
}
