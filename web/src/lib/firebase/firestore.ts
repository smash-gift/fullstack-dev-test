import {
  addDoc,
  collection,
  doc,
  getDoc,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  type Firestore,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import type { AuthenticatedUser } from "@/store/useAuthStore";
import { getFirebaseApp } from "./client";

export interface HistoryEntryInput {
  occasion: string;
  relationship: string;
  messageOptions: string[];
  selectedMessage: string;
}

export interface HistoryEntry extends HistoryEntryInput {
  id: string;
  createdAt: Date | null;
}

let db: Firestore | undefined;

function getDb(): Firestore {
  if (!db) {
    db = getFirestore(getFirebaseApp());
  }

  return db;
}

/**
 * Upsert do perfil em `users/{uid}` logo após autenticação bem-sucedida.
 *
 * `createdAt` só é definido na primeira escrita (primeiro login) — por isso lemos o documento antes de
 * decidir se incluímos esse campo no `set`. `lastLoginAt` é sempre atualizado via `serverTimestamp()`.
 */
export async function upsertUserProfile(
  user: AuthenticatedUser,
): Promise<void> {
  const userRef = doc(getDb(), "users", user.uid);
  const snapshot = await getDoc(userRef);

  await setDoc(
    userRef,
    {
      displayName: user.displayName,
      email: user.email,
      photoUrl: user.photoUrl,
      lastLoginAt: serverTimestamp(),
      ...(snapshot.exists() ? {} : { createdAt: serverTimestamp() }),
    },
    { merge: true },
  );
}

/**
 * Cria uma entrada em `users/{uid}/history` no momento em que o usuário autenticado seleciona uma
 * mensagem gerada. Só criação (`addDoc`) — não há update/delete nesta rodada.
 */
export async function addHistoryEntry(
  uid: string,
  entry: HistoryEntryInput,
): Promise<void> {
  await addDoc(collection(getDb(), "users", uid, "history"), {
    ...entry,
    createdAt: serverTimestamp(),
  });
}

const HISTORY_ENTRIES_LIMIT = 3;

function mapHistoryDocument(
  docSnapshot: QueryDocumentSnapshot,
): HistoryEntry {
  const data = docSnapshot.data() as HistoryEntryInput & {
    createdAt?: { toDate: () => Date };
  };

  return {
    id: docSnapshot.id,
    occasion: data.occasion,
    relationship: data.relationship,
    messageOptions: data.messageOptions,
    selectedMessage: data.selectedMessage,
    createdAt: data.createdAt ? data.createdAt.toDate() : null,
  };
}

/**
 * Assina em tempo real as últimas `HISTORY_ENTRIES_LIMIT` entradas do histórico do usuário autenticado,
 * mais recente primeiro (`createdAt` desc). Retorna a função de unsubscribe do `onSnapshot` — quem chama
 * é responsável por invocá-la quando o histórico deixar de ser exibido (ex.: componente desmontado),
 * para não deixar o listener vivo além do necessário.
 */
export function subscribeToHistoryEntries(
  uid: string,
  onUpdate: (entries: HistoryEntry[]) => void,
  onError: (error: unknown) => void,
): Unsubscribe {
  const historyQuery = query(
    collection(getDb(), "users", uid, "history"),
    orderBy("createdAt", "desc"),
    limit(HISTORY_ENTRIES_LIMIT),
  );

  return onSnapshot(
    historyQuery,
    (snapshot) => {
      onUpdate(snapshot.docs.map(mapHistoryDocument));
    },
    onError,
  );
}
