import 'package:flutter/material.dart';

/// Represents the occasion types supported by the suggester domain.
enum Occasion {
  birthday,
  wedding,
  anniversary,
  graduation,
  thankYou,
  christmas,
  other;

  /// Parses a string key into an [Occasion] using Dart 3 pattern matching.
  static Occasion fromKey(String key) => switch (key) {
        'Birthday' || 'Aniversário' => Occasion.birthday,
        'Wedding' || 'Casamento' => Occasion.wedding,
        'Anniversary' || 'Bodas / Namoro' => Occasion.anniversary,
        'Graduation' || 'Formatura' => Occasion.graduation,
        'Thank You' || 'Agradecimento' => Occasion.thankYou,
        'Christmas' || 'Natal' => Occasion.christmas,
        _ => Occasion.other,
      };

  /// Returns the corresponding [IconData] using Dart 3 switch pattern matching on enum values.
  IconData get icon => switch (this) {
        Occasion.birthday => Icons.cake,
        Occasion.wedding => Icons.favorite,
        Occasion.anniversary => Icons.wine_bar,
        Occasion.graduation => Icons.school,
        Occasion.thankYou => Icons.volunteer_activism,
        Occasion.christmas => Icons.card_giftcard,
        Occasion.other => Icons.star,
      };
}
