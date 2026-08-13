"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  signInWithGoogle,
  signOutUser,
  subscribeToAuthChanges,
} from "@/lib/firebase/auth";
import { useAuthStore, type AuthenticatedUser } from "@/store/useAuthStore";

/**
 * Avatar circular do usuário autenticado. Usa `<img>` simples em vez de `next/image`: a foto vem de um
 * domínio externo do Google (`lh3.googleusercontent.com`), o que exigiria configurar
 * `images.remotePatterns` em `next.config.ts` só para um elemento de ~32px — desproporcional ao ganho
 * (otimização de imagem, lazy loading) que o `next/image` traria para um avatar desse tamanho.
 *
 * Quando `photoUrl` é `null` (pode acontecer mesmo com login Google), mostra um círculo com a primeira
 * letra do nome/e-mail em vez de renderizar uma imagem quebrada.
 *
 * Decorativo (`alt=""`/`aria-hidden`): o nome do usuário já é anunciado pelo `<span>` de texto ao lado,
 * então a imagem não precisa de nome acessível próprio — evita duplicar a mesma informação para leitores
 * de tela.
 */
function UserAvatar({ user }: { user: AuthenticatedUser }) {
  if (user.photoUrl) {
    return (
      <img
        src={user.photoUrl}
        alt=""
        aria-hidden="true"
        referrerPolicy="no-referrer"
        className="size-8 shrink-0 rounded-full object-cover"
      />
    );
  }

  const source = user.displayName ?? user.email ?? "?";
  const initial = source.trim().charAt(0).toUpperCase() || "?";

  return (
    <span
      aria-hidden="true"
      className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-secondary font-heading text-sm font-semibold text-brand-accent"
    >
      {initial}
    </span>
  );
}

export function AuthHeader() {
  const status = useAuthStore((current) => current.status);
  const user = useAuthStore((current) => current.user);
  const setAuthenticatedUser = useAuthStore(
    (current) => current.setAuthenticatedUser,
  );
  const signOutToGuest = useAuthStore((current) => current.signOutToGuest);

  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((authenticatedUser) => {
      if (authenticatedUser) {
        setAuthenticatedUser(authenticatedUser);
      } else {
        signOutToGuest();
      }
    });

    return unsubscribe;
  }, [setAuthenticatedUser, signOutToGuest]);

  async function handleSignIn() {
    setError(null);
    setIsSigningIn(true);

    try {
      await signInWithGoogle();
    } catch {
      setError("Não foi possível entrar com o Google agora. Tente novamente.");
    } finally {
      setIsSigningIn(false);
    }
  }

  async function handleSignOut() {
    try {
      await signOutUser();
    } catch {
      // A sessão local volta para guest de qualquer forma — ver finally.
    } finally {
      signOutToGuest();
    }
  }

  if (status === "authenticated" && user) {
    return (
      <div className="flex items-center gap-3">
        <UserAvatar user={user} />
        <span className="font-body text-sm text-text-secondary">
          {user.displayName ?? user.email ?? "Conta conectada"}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSignOut}
        >
          Sair
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={handleSignIn}
        disabled={isSigningIn}
      >
        {isSigningIn ? "Entrando…" : "Entrar com Google"}
      </Button>
      {error ? (
        <p role="alert" className="text-xs text-feedback-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
