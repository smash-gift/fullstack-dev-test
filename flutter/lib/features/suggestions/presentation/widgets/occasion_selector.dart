import 'package:flutter/material.dart';

class OccasionSelector extends StatelessWidget {
  final String? selected;
  final String customValue;
  final ValueChanged<String> onSelect;
  final ValueChanged<String> onCustomChanged;

  const OccasionSelector({
    super.key,
    required this.selected,
    required this.customValue,
    required this.onSelect,
    required this.onCustomChanged,
  });

  static const occasions = [
    {'label': 'Aniversário', 'value': 'aniversario', 'icon': Icons.cake},
    {'label': 'Casamento', 'value': 'casamento', 'icon': Icons.favorite_border},
    {'label': 'Agradecimento', 'value': 'agradecimento', 'icon': Icons.star_border_rounded},
    {'label': 'Formatura', 'value': 'formatura', 'icon': Icons.school_outlined},
    {'label': 'Natal', 'value': 'natal', 'icon': Icons.park_outlined},
    {'label': 'Outro', 'value': 'outro', 'icon': Icons.card_giftcard_outlined},
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
            return _SelectorCard(
              label: o['label'] as String,
              icon: o['icon'] as IconData,
              selected: isSelected,
              onTap: () => onSelect(o['value'] as String),
            );
          }).toList(),
        ),
        if (selected == 'outro') ...[
          const SizedBox(height: 12),
          TextField(
            onChanged: onCustomChanged,
            controller: TextEditingController(text: customValue)
              ..selection = TextSelection.collapsed(offset: customValue.length),
            decoration: InputDecoration(
              hintText: 'Descreva a ocasião...',
              hintStyle: const TextStyle(color: Color(0xFFA08881)),
              filled: true,
              fillColor: Colors.white,
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: Color(0xFFEADDD8)),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: Color(0xFFEADDD8)),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: Colors.pink.shade300),
              ),
            ),
          ),
        ],
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