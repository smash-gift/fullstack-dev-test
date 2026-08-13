import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_radius.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../data/models/history_entry.dart';
import '../../../data/repositories/history_repository.dart';
import '../../../shared/widgets/empty_state_view.dart';
import '../controller/history_controller.dart';

/// Lista o histórico de mensagens do usuário autenticado (`users/{uid}/history`), mais recente
/// primeiro — ver `docs/contracts/firestore-schema.md`. Só é alcançável a partir de
/// `MessageFormScreen` quando há um usuário autenticado.
class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key, required this.uid, required this.historyRepository});

  final String uid;
  final HistoryRepository historyRepository;

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  late final HistoryController _controller;

  @override
  void initState() {
    super.initState();
    _controller = HistoryController(repository: widget.historyRepository, uid: widget.uid);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Histórico')),
      body: SafeArea(
        child: ListenableBuilder(
          listenable: _controller,
          builder: (context, _) {
            switch (_controller.status) {
              case HistoryLoadStatus.loading:
                return const Center(child: CircularProgressIndicator());
              case HistoryLoadStatus.error:
                return EmptyStateView(
                  title: 'Não foi possível carregar',
                  description: _controller.errorMessage ??
                      'Algo deu errado ao buscar seu histórico. Tente novamente mais tarde.',
                );
              case HistoryLoadStatus.success:
                if (_controller.entries.isEmpty) {
                  return const EmptyStateView(
                    title: 'Nenhum cartão por aqui ainda',
                    description: 'Quando você gerar e escolher uma mensagem, ela aparece aqui.',
                  );
                }
                return ListView.separated(
                  padding: const EdgeInsets.all(AppSpacing.screenHorizontalPadding),
                  itemCount: _controller.entries.length,
                  separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.s4),
                  itemBuilder: (context, index) =>
                      _HistoryEntryCard(entry: _controller.entries[index]),
                );
            }
          },
        ),
      ),
    );
  }
}

class _HistoryEntryCard extends StatelessWidget {
  const _HistoryEntryCard({required this.entry});

  final HistoryEntry entry;

  String _formatDate(DateTime? date) {
    if (date == null) return 'Agora há pouco';
    final local = date.toLocal();
    final day = local.day.toString().padLeft(2, '0');
    final month = local.month.toString().padLeft(2, '0');
    final hour = local.hour.toString().padLeft(2, '0');
    final minute = local.minute.toString().padLeft(2, '0');
    return '$day/$month/${local.year} às $hour:$minute';
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppSpacing.s5),
      decoration: BoxDecoration(
        color: AppColors.backgroundSecondary,
        borderRadius: BorderRadius.circular(AppRadius.large),
        border: Border.all(color: AppColors.borderSoft),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('${entry.occasion} · ${entry.relationship}', style: AppTextStyles.label),
          const SizedBox(height: AppSpacing.s2),
          Text(entry.selectedMessage, style: AppTextStyles.body),
          const SizedBox(height: AppSpacing.s3),
          Text(_formatDate(entry.createdAt), style: AppTextStyles.caption),
        ],
      ),
    );
  }
}
