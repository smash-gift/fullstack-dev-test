import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ENV_KEYS = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
] as const;

describe("isFirebaseConfigured", () => {
  const original: Partial<Record<(typeof ENV_KEYS)[number], string>> = {};

  beforeEach(() => {
    for (const key of ENV_KEYS) original[key] = process.env[key];
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      const value = original[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    vi.resetModules();
  });

  it("retorna false quando as variáveis do Firebase não estão definidas", async () => {
    for (const key of ENV_KEYS) delete process.env[key];
    vi.resetModules();

    const { isFirebaseConfigured } = await import("./client");
    expect(isFirebaseConfigured()).toBe(false);
  });

  it("retorna true quando as variáveis obrigatórias estão definidas", async () => {
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY = "test-key";
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = "test-project";
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID = "test-app";
    vi.resetModules();

    const { isFirebaseConfigured } = await import("./client");
    expect(isFirebaseConfigured()).toBe(true);
  });
});

describe("getFirebaseApp", () => {
  afterEach(() => {
    for (const key of ENV_KEYS) delete process.env[key];
    vi.resetModules();
  });

  it("lança erro quando o Firebase não está configurado", async () => {
    for (const key of ENV_KEYS) delete process.env[key];
    vi.resetModules();

    const { getFirebaseApp } = await import("./client");
    expect(() => getFirebaseApp()).toThrow(/não está configurado/i);
  });
});
