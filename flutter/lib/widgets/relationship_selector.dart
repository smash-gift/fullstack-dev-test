import 'package:flutter/material.dart';

class RelationshipSelector extends StatelessWidget {
  final String? selected;
  final ValueChanged<String> onSelect;

  const RelationshipSelector({super.key, required this.selected, required this.onSelect});

  static const relationships = [
    {'label': 'Amigo(a)', 'value': 'amigo', 'icon': Icons.people_outline},
    {'label': 'Colega', 'value': 'colega', 'icon': Icons.work_outline},
    {'label': 'Pai/Mãe', 'value': 'mae', 'icon': Icons.favorite_border},
    {'label': 'Filho(a)', 'value': 'filho', 'icon': Icons.face_3_outlined},
    {'label': 'Parceiro(a)', 'value': 'parceiro', 'icon': Icons.favorite_border},
    {'label': 'Outro', 'value': 'outro', 'icon': Icons.help_outline},
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
            return _SelectorCard(
              label: r['label'] as String,
              icon: r['icon'] as IconData,
              selected: isSelected,
              onTap: () => onSelect(r['value'] as String),
            );
          }).toList(),
        ),
      ],
    );
  }
}

class _SelectorCard extends StatelessWidget {
  const _SelectorCard({
    required this.label,
    required this.icon,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final borderColor = selected ? Colors.pink.shade300 : const Color(0xFFF0EBE9);
    final backgroundColor = selected ? const Color(0xFFFCE7EF) : const Color(0xFFF9F6F5);
    final iconColor = selected ? Colors.pink.shade400 : const Color(0xFF8A6F68);

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        width: 80,
        height: 74,
        decoration: BoxDecoration(
          color: backgroundColor,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: borderColor),
          boxShadow: const [
            BoxShadow(
              color: Color(0x0A000000),
              blurRadius: 10,
              offset: Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 17, color: iconColor),
            const SizedBox(height: 6),
            Text(
              label,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 10.5,
                fontWeight: FontWeight.w500,
                color: Color(0xFF7A615A),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
