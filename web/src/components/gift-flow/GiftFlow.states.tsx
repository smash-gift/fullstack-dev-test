export function GiftFlowLoadingState() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex w-full flex-col items-center gap-4 py-12 text-center"
    >
      <span
        aria-hidden
        className="size-10 animate-spin rounded-full border-4 border-border-soft border-t-brand-primary"
      />
      <p className="font-body text-sm text-text-secondary">
        Escolhendo as palavras certas para você…
      </p>
    </div>
  );
}

interface GiftFlowErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function GiftFlowErrorState({
  message,
  onRetry,
}: GiftFlowErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex w-full flex-col items-center gap-4 rounded-2xl border border-feedback-error/30 bg-feedback-error/5 px-6 py-10 text-center"
    >
      <p className="font-heading text-base font-semibold text-feedback-error">
        Não deu certo dessa vez
      </p>
      <p className="max-w-sm font-body text-sm text-text-secondary">
        {message}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-sm border border-feedback-error/40 px-5 py-2 font-heading text-sm font-semibold text-feedback-error transition-colors hover:bg-feedback-error/10"
      >
        Tentar novamente
      </button>
    </div>
  );
}

interface GiftFlowEmptyStateProps {
  onRetry: () => void;
}

export function GiftFlowEmptyState({ onRetry }: GiftFlowEmptyStateProps) {
  return (
    <div className="flex w-full flex-col items-center gap-4 rounded-2xl border border-border-soft bg-background-secondary px-6 py-10 text-center">
      <p className="font-heading text-base font-semibold text-text-primary">
        Nenhuma mensagem foi gerada
      </p>
      <p className="max-w-sm font-body text-sm text-text-secondary">
        Não recebemos opções de mensagem dessa vez. Tente gerar novamente.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-sm border border-border px-5 py-2 font-heading text-sm font-semibold text-text-primary transition-colors hover:bg-background-brand-soft"
      >
        Gerar novamente
      </button>
    </div>
  );
}
