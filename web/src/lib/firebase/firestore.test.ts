import { afterEach, describe, expect, it, vi } from "vitest";

const setDocMock = vi.fn().mockResolvedValue(undefined);
const getDocMock = vi.fn();
const addDocMock = vi.fn().mockResolvedValue({ id: "entry-1" });
const unsubscribeMock = vi.fn();
const onSnapshotMock = vi.fn(
  (
    ..._args: [unknown, (snapshot: unknown) => void, (error: unknown) => void]
  ) => unsubscribeMock,
);
const docMock = vi.fn((_db: unknown, ...pathSegments: string[]) => ({
  path: pathSegments.join("/"),
}));
const collectionMock = vi.fn((_db: unknown, ...pathSegments: string[]) => ({
  path: pathSegments.join("/"),
}));
const queryMock = vi.fn((collectionRef: unknown) => collectionRef);
const orderByMock = vi.fn(() => "order-by-created-at-desc");
const limitMock = vi.fn(() => "limit-3");
const serverTimestampMock = vi.fn(() => "server-timestamp");
const getFirestoreMock = vi.fn(() => ({ id: "db" }));

vi.mock("firebase/firestore", () => ({
  getFirestore: getFirestoreMock,
  doc: docMock,
  collection: collectionMock,
  getDoc: getDocMock,
  setDoc: setDocMock,
  addDoc: addDocMock,
  onSnapshot: onSnapshotMock,
  query: queryMock,
  orderBy: orderByMock,
  limit: limitMock,
  serverTimestamp: serverTimestampMock,
}));

vi.mock("./client", () => ({
  getFirebaseApp: vi.fn(() => ({ id: "app" })),
}));

const {
  addHistoryEntry,
  subscribeToHistoryEntries,
  upsertUserProfile,
} = await import("./firestore");

const testUser = {
  uid: "uid-1",
  displayName: "Fulana",
  email: "fulana@example.com",
  photoUrl: "https://example.com/photo.png",
};

describe("upsertUserProfile", () => {
  afterEach(() => vi.clearAllMocks());

  it("inclui createdAt quando o documento ainda não existe (primeiro login)", async () => {
    getDocMock.mockResolvedValue({ exists: () => false });

    await upsertUserProfile(testUser);

    expect(docMock).toHaveBeenCalledWith({ id: "db" }, "users", "uid-1");
    expect(setDocMock).toHaveBeenCalledWith(
      { path: "users/uid-1" },
      {
        displayName: "Fulana",
        email: "fulana@example.com",
        photoUrl: "https://example.com/photo.png",
        lastLoginAt: "server-timestamp",
        createdAt: "server-timestamp",
      },
      { merge: true }
    );
  });

  it("não inclui createdAt quando o documento já existe", async () => {
    getDocMock.mockResolvedValue({ exists: () => true });

    await upsertUserProfile(testUser);

    expect(setDocMock).toHaveBeenCalledWith(
      { path: "users/uid-1" },
      {
        displayName: "Fulana",
        email: "fulana@example.com",
        photoUrl: "https://example.com/photo.png",
        lastLoginAt: "server-timestamp",
      },
      { merge: true }
    );
  });
});

describe("addHistoryEntry", () => {
  afterEach(() => vi.clearAllMocks());

  it("grava a entrada em users/{uid}/history com createdAt do servidor", async () => {
    await addHistoryEntry("uid-1", {
      occasion: "aniversário",
      relationship: "mãe",
      messageOptions: ["a", "b", "c"],
      selectedMessage: "a",
    });

    expect(collectionMock).toHaveBeenCalledWith(
      { id: "db" },
      "users",
      "uid-1",
      "history"
    );
    expect(addDocMock).toHaveBeenCalledWith(
      { path: "users/uid-1/history" },
      {
        occasion: "aniversário",
        relationship: "mãe",
        messageOptions: ["a", "b", "c"],
        selectedMessage: "a",
        createdAt: "server-timestamp",
      }
    );
  });
});

describe("subscribeToHistoryEntries", () => {
  afterEach(() => vi.clearAllMocks());

  it("monta a query com orderBy createdAt desc e limite de 3, e assina via onSnapshot", () => {
    const onUpdate = vi.fn();
    const onError = vi.fn();

    subscribeToHistoryEntries("uid-1", onUpdate, onError);

    expect(collectionMock).toHaveBeenCalledWith(
      { id: "db" },
      "users",
      "uid-1",
      "history"
    );
    expect(orderByMock).toHaveBeenCalledWith("createdAt", "desc");
    expect(limitMock).toHaveBeenCalledWith(3);
    expect(queryMock).toHaveBeenCalledWith(
      { path: "users/uid-1/history" },
      "order-by-created-at-desc",
      "limit-3"
    );
    expect(onSnapshotMock).toHaveBeenCalledWith(
      { path: "users/uid-1/history" },
      expect.any(Function),
      expect.any(Function)
    );
  });

  it("retorna a função de unsubscribe do onSnapshot", () => {
    const unsubscribe = subscribeToHistoryEntries(
      "uid-1",
      vi.fn(),
      vi.fn()
    );

    expect(unsubscribe).toBe(unsubscribeMock);
  });

  it("mapeia os documentos recebidos e chama onUpdate quando o snapshot dispara", () => {
    const onUpdate = vi.fn();
    const fakeDate = new Date("2026-08-01T10:00:00Z");

    subscribeToHistoryEntries("uid-1", onUpdate, vi.fn());

    const snapshotCallback = onSnapshotMock.mock.calls[0]?.[1] as (
      snapshot: unknown
    ) => void;

    snapshotCallback({
      docs: [
        {
          id: "entry-1",
          data: () => ({
            occasion: "aniversário",
            relationship: "mãe",
            messageOptions: ["a", "b", "c"],
            selectedMessage: "a",
            createdAt: { toDate: () => fakeDate },
          }),
        },
      ],
    });

    expect(onUpdate).toHaveBeenCalledWith([
      {
        id: "entry-1",
        occasion: "aniversário",
        relationship: "mãe",
        messageOptions: ["a", "b", "c"],
        selectedMessage: "a",
        createdAt: fakeDate,
      },
    ]);
  });

  it("mapeia createdAt como null quando o documento ainda não tem o campo (edge case defensivo)", () => {
    const onUpdate = vi.fn();

    subscribeToHistoryEntries("uid-1", onUpdate, vi.fn());

    const snapshotCallback = onSnapshotMock.mock.calls[0]?.[1] as (
      snapshot: unknown
    ) => void;

    snapshotCallback({
      docs: [
        {
          id: "entry-2",
          data: () => ({
            occasion: "formatura",
            relationship: "amiga",
            messageOptions: ["x", "y", "z"],
            selectedMessage: "x",
          }),
        },
      ],
    });

    expect(onUpdate.mock.calls[0]?.[0][0].createdAt).toBeNull();
  });

  it("chama onError quando o onSnapshot reporta um erro", () => {
    const onError = vi.fn();

    subscribeToHistoryEntries("uid-1", vi.fn(), onError);

    const errorCallback = onSnapshotMock.mock.calls[0]?.[2] as (
      error: unknown
    ) => void;
    const fakeError = new Error("firestore indisponível");
    errorCallback(fakeError);

    expect(onError).toHaveBeenCalledWith(fakeError);
  });
});
