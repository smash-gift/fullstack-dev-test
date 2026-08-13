import { AuthHeader } from "@/components/auth/AuthHeader";
import { GiftFlow } from "@/components/gift-flow/GiftFlow";
import { HistorySection } from "@/components/history/HistorySection";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center bg-background-secondary px-4 py-12 sm:px-6 sm:py-16">
      <div className="flex w-full max-w-xl flex-col items-center gap-10">
        <div className="flex w-full justify-end">
          <AuthHeader />
        </div>

        <header className="flex flex-col items-center gap-3 text-center">
          <p className="font-heading text-xs font-semibold tracking-[0.3em] text-brand-accent uppercase">
            smash-gift
          </p>
          <h1 className="font-heading text-3xl leading-tight font-semibold text-text-primary sm:text-4xl">
            A mensagem certa para o presente certo
          </h1>
          <p className="max-w-md font-body text-base leading-relaxed text-text-secondary">
            Conte a ocasião e para quem é o carinho — em segundos você recebe
            três opções de mensagem para escolher e presentear.
          </p>
        </header>

        <GiftFlow />

        <HistorySection />
      </div>
    </div>
  );
}
