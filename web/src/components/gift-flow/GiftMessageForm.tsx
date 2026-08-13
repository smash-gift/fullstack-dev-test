"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  type GiftMessageFormValues,
  giftMessageFormSchema,
} from "@/lib/validation/giftMessageForm.schema";

interface GiftMessageFormProps {
  onSubmit: (values: GiftMessageFormValues) => void;
  isSubmitting: boolean;
}

export function GiftMessageForm({
  onSubmit,
  isSubmitting,
}: GiftMessageFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GiftMessageFormValues>({
    resolver: zodResolver(giftMessageFormSchema),
    defaultValues: { occasion: "", relationship: "" },
  });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex w-full flex-col gap-8"
    >
      <div className="flex flex-col gap-3">
        <Label
          htmlFor="occasion"
          className="font-heading text-sm font-semibold text-text-primary"
        >
          Qual é a ocasião?
        </Label>
        <Textarea
          id="occasion"
          placeholder="Descreva a ocasião, ex.: aniversário de 15 anos da minha afilhada"
          disabled={isSubmitting}
          aria-invalid={!!errors.occasion}
          {...register("occasion")}
        />
        {errors.occasion ? (
          <p role="alert" className="text-sm text-feedback-error">
            {errors.occasion.message}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-3">
        <Label
          htmlFor="relationship"
          className="font-heading text-sm font-semibold text-text-primary"
        >
          Qual a relação com essa pessoa?
        </Label>
        <Textarea
          id="relationship"
          placeholder="Ex.: minha melhor amiga, meu pai, minha afilhada"
          disabled={isSubmitting}
          aria-invalid={!!errors.relationship}
          {...register("relationship")}
        />
        {errors.relationship ? (
          <p role="alert" className="text-sm text-feedback-error">
            {errors.relationship.message}
          </p>
        ) : null}
      </div>

      <Button type="submit" size="xl" disabled={isSubmitting}>
        {isSubmitting ? "Gerando mensagens…" : "Gerar mensagens"}
      </Button>
    </form>
  );
}
