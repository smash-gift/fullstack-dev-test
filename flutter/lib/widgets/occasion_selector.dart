import 'package:flutter/material.dart';

class OccasionSelector extends StatelessWidget {
  final String? selected;
  final ValueChanged<String> onSelect;

  const OccasionSelector({super.key, required this.selected, required this.onSelect});

  static const occasions = [
    {'label': 'Aniversário', 'value': 'aniversario', 'icon': Icons.cake},
    {'label': 'Casamento', 'value': 'casamento', 'icon': Icons.favorite},
    {'label': 'Agradecimento', 'value': 'agradecimento', 'icon': Icons.thumb_up},
    {'label': 'Formatura', 'value': 'formatura', 'icon': Icons.school},
    {'label': 'Natal', 'value': 'natal', 'icon': Icons.card_giftcard},
    {'label': 'Outro', 'value': 'outro', 'icon': Icons.more_horiz},
  ];

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('OCASIÃO', style: TextStyle(fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        Wrap(
          spacing: 12,
          runSpacing: 12,
          children: occasions.map((o) {
            final isSelected = selected == o['value'];
            return ChoiceChip(
              label: Text(o['label'] as String),
              avatar: Icon(o['icon'] as IconData, size: 20),
              selected: isSelected,
              onSelected: (_) => onSelect(o['value'] as String),
              selectedColor: Colors.pink.shade100,
            );
          }).toList(),
        ),
      ],
    );
  }
}
