import 'package:another_flushbar/flushbar.dart';
import 'package:flutter/material.dart';

class ToastService {
  static void showError(BuildContext context, String message) {
    Flushbar(
      message: message,
      icon: const Icon(Icons.error_outline, color: Colors.white),
      duration: const Duration(seconds: 3),
      backgroundColor: Colors.red.shade700,
      margin: const EdgeInsets.all(12),
      borderRadius: BorderRadius.circular(8),
      flushbarPosition: FlushbarPosition.TOP,
    ).show(context);
  }

  static void showSuccess(BuildContext context, String message) {
    Flushbar(
      message: message,
      icon: const Icon(Icons.check_circle_outline, color: Colors.white),
      duration: const Duration(seconds: 3),
      backgroundColor: Colors.green.shade700,
      margin: const EdgeInsets.all(12),
      borderRadius: BorderRadius.circular(8),
      flushbarPosition: FlushbarPosition.TOP,
    ).show(context);
  }
}
