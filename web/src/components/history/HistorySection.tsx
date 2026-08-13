"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { HistoryList } from "./HistoryList";

export function HistorySection() {
  const status = useAuthStore((current) => current.status);
  const user = useAuthStore((current) => current.user);

  if (status !== "authenticated" || !user) {
    return null;
  }

  return (
    <section className="flex w-full flex-col gap-4">
      <h2 className="font-heading text-lg font-semibold text-text-primary">
        Seu histórico
      </h2>
      <HistoryList key={user.uid} uid={user.uid} />
    </section>
  );
}
