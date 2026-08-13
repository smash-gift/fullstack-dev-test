/// Payload de request para gerar mensagens de presente.
///
/// Espelha `docs/contracts/api-contracts.md`: `{occasion, relationship, regenerate}`. `regenerate`
/// quando `true` pula o cache persistente do backend e força uma geração nova.
class MessageGenerationRequest {
  const MessageGenerationRequest({
    required this.occasion,
    required this.relationship,
    this.regenerate = false,
  });

  final String occasion;
  final String relationship;
  final bool regenerate;

  Map<String, dynamic> toJson() => {
        'occasion': occasion,
        'relationship': relationship,
        'regenerate': regenerate,
      };
}
