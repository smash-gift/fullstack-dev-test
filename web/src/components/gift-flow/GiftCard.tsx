interface GiftCardProps {
  message: string;
  occasionLabel: string;
  relationshipLabel: string;
}

export function GiftCard({
  message,
  occasionLabel,
  relationshipLabel,
}: GiftCardProps) {
  return (
    <div className="relative mx-auto w-full max-w-lg overflow-hidden rounded-2xl border border-border-soft bg-gradient-to-br from-background-brand-soft via-white to-white p-8 shadow-[0_20px_45px_-25px_rgba(157,129,137,0.45)] sm:p-10">
      <span
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-secondary/40 blur-2xl"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-16 -left-12 h-44 w-44 rounded-full bg-background-soft/60 blur-2xl"
      />

      <div className="relative flex flex-col items-center gap-6 text-center">
        <span aria-hidden className="text-3xl leading-none text-brand-primary">
          &#10084;
        </span>

        <p className="font-heading text-xs font-semibold tracking-[0.2em] text-text-muted uppercase">
          {occasionLabel} <span aria-hidden>&middot;</span> {relationshipLabel}
        </p>

        <p className="font-body text-xl leading-relaxed whitespace-pre-line text-text-primary sm:text-2xl">
          {message}
        </p>
      </div>
    </div>
  );
}
