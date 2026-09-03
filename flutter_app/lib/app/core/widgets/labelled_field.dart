import 'package:flutter/material.dart';

import '../theme/app_theme.dart';
import 'section_label.dart';

/// A label above an input, with the label spacing decided once.
class LabelledField extends StatelessWidget {
  const LabelledField({
    required this.label,
    required this.child,
    super.key,
  });

  final String label;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SectionLabel(label),
        const SizedBox(height: AppTheme.gapXs),
        child,
      ],
    );
  }
}
