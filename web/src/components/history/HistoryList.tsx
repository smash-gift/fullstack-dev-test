"use client";

import { useEffect, useState } from "react";
import {
  subscribeToHistoryEntries,
  type HistoryEntry,
} from "@/lib/firebase/firestore";

type Status = "loading" | "success" | "empty" | "error";

interface HistoryListProps {
  uid: string;
}

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function HistoryList({ uid }: HistoryListProps) {
  const [status, setStatus] = useState<Status>("loading");
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToHistoryEntries(
      uid,
      (result) => {
        setEntries(result);
        setStatus(result.length === 0 ? "empty" : "success");
      },
      () => {
        setStatus("error");
      },
    );

    return unsubscribe;
  }, [uid]);

  if (status === "loading") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex w-full flex-col items-center gap-3 py-8 text-center"
      >
        <span
          aria-hidden
          className="size-8 animate-spin rounded-full border-4 border-border-soft border-t-brand-primary"
        />
        <p className="font-body text-sm text-text-secondary">
          Carregando seu histórico…
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div
        role="alert"
        className="flex w-full flex-col items-center gap-2 rounded-2xl border border-feedback-error/30 bg-feedback-error/5 px-6 py-8 text-center"
      >
        <p className="font-body text-sm text-feedback-error">
          Não foi possível carregar seu histórico agora.
        </p>
      </div>
    );
  }

  if (status === "empty") {
    return (
      <div className="flex w-full flex-col items-center gap-2 rounded-2xl border border-border-soft bg-background-secondary px-6 py-8 text-center">
        <p className="font-body text-sm text-text-secondary">
          Você ainda não gerou nenhuma mensagem enquanto estava conectado.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex w-full list-none flex-col gap-3 p-0">
      {entries.map((entry) => (
        <li
          key={entry.id}
          className="rounded-2xl border border-border-soft bg-white p-5"
        >
          <p className="font-heading text-xs font-semibold tracking-wide text-brand-accent uppercase">
            {entry.occasion} <span aria-hidden>&middot;</span>{" "}
            {entry.relationship}
          </p>
          <p className="mt-2 font-body text-base leading-relaxed text-text-primary">
            {entry.selectedMessage}
          </p>
          {entry.createdAt ? (
            <time
              dateTime={entry.createdAt.toISOString()}
              className="mt-3 block font-body text-xs text-text-muted"
            >
              {dateFormatter.format(entry.createdAt)}
            </time>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
