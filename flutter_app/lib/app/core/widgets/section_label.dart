import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

/// The small uppercase label above a field or a list.
class SectionLabel extends StatelessWidget {
  const SectionLabel(this.text, {super.key});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text.toUpperCase(),
      style: Theme.of(context).textTheme.labelSmall?.copyWith(
        color: context.palette.muted,
      ),
    );
  }
}
