import 'package:flutter/material.dart';

class RelationshipSelector extends StatelessWidget {
  final String? selected;
  final ValueChanged<String> onSelect;

  const RelationshipSelector({super.key, required this.selected, required this.onSelect});

  static const relationships = [
    {'label': 'Amigo(a)', 'value': 'amigo', 'icon': Icons.emoji_people},
    {'label': 'Colega', 'value': 'colega', 'icon': Icons.work},
    {'label': 'Pai/Mãe', 'value': 'mae', 'icon': Icons.family_restroom},
    {'label': 'Filho(a)', 'value': 'filho', 'icon': Icons.child_care},
    {'label': 'Parceiro(a)', 'value': 'parceiro', 'icon': Icons.favorite_border},
    {'label': 'Outro', 'value': 'outro', 'icon': Icons.more_horiz},
  ];

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('RELACIONAMENTO', style: TextStyle(fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        Wrap(
          spacing: 12,
          runSpacing: 12,
          children: relationships.map((r) {
            final isSelected = selected == r['value'];
            return ChoiceChip(
              label: Text(r['label'] as String),
              avatar: Icon(r['icon'] as IconData, size: 20),
              selected: isSelected,
              onSelected: (_) => onSelect(r['value'] as String),
              selectedColor: Colors.pink.shade100,
            );
          }).toList(),
        ),
      ],
    );
  }
}
