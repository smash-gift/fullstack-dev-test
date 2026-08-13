"use client";

import { useState } from "react";
import {
  GenerateMessagesError,
  generateMessages,
} from "@/lib/api/generateMessages";
import { addHistoryEntry } from "@/lib/firebase/firestore";
import type { GiftMessageFormValues } from "@/lib/validation/giftMessageForm.schema";
import { useAuthStore } from "@/store/useAuthStore";
import { GiftCard } from "./GiftCard";
import {
  GiftFlowEmptyState,
  GiftFlowErrorState,
  GiftFlowLoadingState,
} from "./GiftFlow.states";
import { GiftMessageForm } from "./GiftMessageForm";
import { MessageOptionsList } from "./MessageOptionsList";

type FlowStep = "form" | "loading" | "error" | "empty" | "options" | "result";

interface FlowState {
  step: FlowStep;
  values: GiftMessageFormValues | null;
  messages: string[];
  selectedMessage: string | null;
  errorMessage: string | null;
  isRegenerating: boolean;
  regenerateErrorMessage: string | null;
}

const DEFAULT_ERROR_MESSAGE =
  "Não foi possível gerar as mensagens agora. Tente novamente em instantes.";

const INITIAL_STATE: FlowState = {
  step: "form",
  values: null,
  messages: [],
  selectedMessage: null,
  errorMessage: null,
  isRegenerating: false,
  regenerateErrorMessage: null,
};

export function GiftFlow() {
  const [state, setState] = useState<FlowState>(INITIAL_STATE);
  const authStatus = useAuthStore((current) => current.status);
  const authUser = useAuthStore((current) => current.user);

  async function handleGenerate(values: GiftMessageFormValues) {
    setState((current) => ({
      ...current,
      step: "loading",
      values,
      errorMessage: null,
    }));

    try {
      const response = await generateMessages(values);

      if (response.messages.length === 0) {
        setState((current) => ({ ...current, step: "empty", messages: [] }));
        return;
      }

      setState((current) => ({
        ...current,
        step: "options",
        messages: response.messages,
      }));
    } catch (error) {
      const errorMessage =
        error instanceof GenerateMessagesError
          ? error.message
          : DEFAULT_ERROR_MESSAGE;
      setState((current) => ({ ...current, step: "error", errorMessage }));
    }
  }

  async function handleRegenerate() {
    if (!state.values || state.isRegenerating) {
      return;
    }

    const values = state.values;

    setState((current) => ({
      ...current,
      isRegenerating: true,
      regenerateErrorMessage: null,
    }));

    try {
      const response = await generateMessages({ ...values, regenerate: true });

      if (response.messages.length === 0) {
        setState((current) => ({
          ...current,
          isRegenerating: false,
          regenerateErrorMessage: DEFAULT_ERROR_MESSAGE,
        }));
        return;
      }

      setState((current) => ({
        ...current,
        isRegenerating: false,
        messages: response.messages,
      }));
    } catch (error) {
      const regenerateErrorMessage =
        error instanceof GenerateMessagesError
          ? error.message
          : DEFAULT_ERROR_MESSAGE;
      setState((current) => ({
        ...current,
        isRegenerating: false,
        regenerateErrorMessage,
      }));
    }
  }

  function handleDismissNotice() {
    setState((current) => ({ ...current, step: "form", errorMessage: null }));
  }

  function handleSelectMessage(message: string) {
    setState((current) => ({
      ...current,
      step: "result",
      selectedMessage: message,
    }));

    if (authStatus === "authenticated" && authUser && state.values) {
      void addHistoryEntry(authUser.uid, {
        occasion: state.values.occasion,
        relationship: state.values.relationship,
        messageOptions: state.messages,
        selectedMessage: message,
      }).catch(() => {
        // Melhor esforço — a mensagem já foi exibida ao usuário, uma falha ao salvar o histórico não
        // deve interromper o fluxo nem exigir feedback de erro.
      });
    }
  }

  function handleRestart() {
    setState(INITIAL_STATE);
  }

  const showForm =
    state.step === "form" ||
    state.step === "loading" ||
    state.step === "error" ||
    state.step === "empty";

  return (
    <div className="flex w-full flex-col gap-6">
      {showForm ? (
        <>
          <GiftMessageForm
            onSubmit={handleGenerate}
            isSubmitting={state.step === "loading"}
          />
          {state.step === "loading" ? <GiftFlowLoadingState /> : null}
          {state.step === "error" && state.errorMessage ? (
            <GiftFlowErrorState
              message={state.errorMessage}
              onRetry={handleDismissNotice}
            />
          ) : null}
          {state.step === "empty" ? (
            <GiftFlowEmptyState onRetry={handleDismissNotice} />
          ) : null}
        </>
      ) : null}

      {state.step === "options" ? (
        <div className="flex w-full flex-col items-center gap-4">
          <MessageOptionsList
            options={state.messages}
            onSelect={handleSelectMessage}
            isRegenerating={state.isRegenerating}
          />
          <div className="flex flex-col items-center gap-2">
            {state.isRegenerating ? (
              <p
                role="status"
                aria-live="polite"
                className="font-heading text-sm font-semibold text-text-secondary"
              >
                Gerando novas opções…
              </p>
            ) : (
              <button
                type="button"
                onClick={handleRegenerate}
                className="font-heading text-sm font-semibold text-brand-accent underline-offset-4 hover:underline"
              >
                Gerar outras opções
              </button>
            )}
            {state.regenerateErrorMessage ? (
              <p role="alert" className="font-body text-xs text-feedback-error">
                {state.regenerateErrorMessage}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {state.step === "result" && state.selectedMessage && state.values ? (
        <div className="flex w-full flex-col items-center gap-6">
          <GiftCard
            message={state.selectedMessage}
            occasionLabel={state.values.occasion}
            relationshipLabel={state.values.relationship}
          />
          <button
            type="button"
            onClick={handleRestart}
            className="font-heading text-sm font-semibold text-brand-accent underline-offset-4 hover:underline"
          >
            Gerar novamente
          </button>
        </div>
      ) : null}
    </div>
  );
}
