import type {
  GenerateMessagesRequest,
  GenerateMessagesResponse,
} from "./generateMessages.types";

export class GenerateMessagesError extends Error {
  status?: number;
  code?: string;

  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = "GenerateMessagesError";
    this.status = status;
    this.code = code;
  }
}

const GENERATE_MESSAGES_PATH = "/messages";

interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: string[];
  };
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  if (!value || typeof value !== "object" || !("error" in value)) {
    return false;
  }

  const error = (value as { error?: unknown }).error;

  return (
    !!error &&
    typeof error === "object" &&
    typeof (error as { code?: unknown }).code === "string" &&
    typeof (error as { message?: unknown }).message === "string"
  );
}

export async function generateMessages(
  input: GenerateMessagesRequest,
): Promise<GenerateMessagesResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!baseUrl) {
    throw new GenerateMessagesError(
      "A URL do backend (NEXT_PUBLIC_API_BASE_URL) não está configurada.",
    );
  }

  let response: Response;

  try {
    response = await fetch(`${baseUrl}${GENERATE_MESSAGES_PATH}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });
  } catch {
    throw new GenerateMessagesError(
      "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.",
    );
  }

  if (!response.ok) {
    let errorBody: unknown;

    try {
      errorBody = await response.json();
    } catch {
      errorBody = undefined;
    }

    if (isApiErrorBody(errorBody)) {
      throw new GenerateMessagesError(
        errorBody.error.message,
        response.status,
        errorBody.error.code,
      );
    }

    throw new GenerateMessagesError(
      "O servidor não conseguiu gerar as mensagens agora. Tente novamente em instantes.",
      response.status,
    );
  }

  let data: unknown;

  try {
    data = await response.json();
  } catch {
    throw new GenerateMessagesError("Resposta inesperada do servidor.");
  }

  if (
    !data ||
    typeof data !== "object" ||
    !Array.isArray((data as { messages?: unknown }).messages)
  ) {
    throw new GenerateMessagesError("Resposta inesperada do servidor.");
  }

  return { messages: (data as GenerateMessagesResponse).messages };
}
