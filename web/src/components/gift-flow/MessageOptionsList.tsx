"use client";

import { Skeleton } from "@/components/ui/skeleton";

interface MessageOptionsListProps {
  options: string[];
  onSelect: (message: string) => void;
  isRegenerating?: boolean;
}

function MessageOptionSkeleton() {
  return (
    <div className="w-full rounded-lg border border-border bg-white p-5 shadow-sm">
      <Skeleton className="mb-3 h-3 w-20" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}

export function MessageOptionsList({
  options,
  onSelect,
  isRegenerating = false,
}: MessageOptionsListProps) {
  if (isRegenerating) {
    return (
      <ul
        aria-label="Gerando novas opções de mensagem"
        aria-busy="true"
        className="flex w-full list-none flex-col gap-3 p-0"
      >
        {options.map((_, index) => (
          <li key={index}>
            <MessageOptionSkeleton />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul
      aria-label="Opções de mensagem geradas"
      className="flex w-full list-none flex-col gap-3 p-0"
    >
      {options.map((option, index) => (
        <li key={`${index}-${option.slice(0, 12)}`}>
          <button
            type="button"
            onClick={() => onSelect(option)}
            className="group w-full rounded-lg border border-border bg-white p-5 text-left font-body text-base leading-relaxed text-text-primary shadow-sm transition-all outline-none hover:border-border-focus hover:bg-background-brand-soft hover:shadow-md focus-visible:border-border-focus focus-visible:ring-3 focus-visible:ring-ring/40"
          >
            <span className="mb-2 block font-heading text-xs font-semibold tracking-wide text-brand-accent uppercase">
              Opção {index + 1}
            </span>
            {option}
          </button>
        </li>
      ))}
    </ul>
  );
}
