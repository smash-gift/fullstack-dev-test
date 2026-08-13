import { afterEach, describe, expect, it, vi } from "vitest";
import { generateMessages, GenerateMessagesError } from "./generateMessages";

const originalBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

describe("generateMessages", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    process.env.NEXT_PUBLIC_API_BASE_URL = originalBaseUrl;
  });

  it("retorna as mensagens quando o backend responde com sucesso", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.com";
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          messages: ["mensagem 1", "mensagem 2", "mensagem 3"],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await generateMessages({
      occasion: "birthday",
      relationship: "mother",
    });

    expect(result.messages).toHaveLength(3);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/messages",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
        body: JSON.stringify({ occasion: "birthday", relationship: "mother" }),
      })
    );
  });

  it("envia regenerate:true no body quando o input inclui regenerate", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.com";
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          messages: ["mensagem 1", "mensagem 2", "mensagem 3"],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    await generateMessages({
      occasion: "birthday",
      relationship: "mother",
      regenerate: true,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/messages",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          occasion: "birthday",
          relationship: "mother",
          regenerate: true,
        }),
      })
    );
  });

  it("lança GenerateMessagesError quando o backend responde com erro HTTP", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.com";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("{}", { status: 500 }))
    );

    await expect(
      generateMessages({ occasion: "birthday", relationship: "mother" })
    ).rejects.toBeInstanceOf(GenerateMessagesError);
  });

  it("lança GenerateMessagesError com code e message do corpo de erro estruturado", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.com";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: {
              code: "VALIDATION_ERROR",
              message: "occasion is required",
              details: ["occasion is required"],
            },
          }),
          { status: 400 }
        )
      )
    );

    await expect(
      generateMessages({ occasion: "birthday", relationship: "mother" })
    ).rejects.toMatchObject({
      name: "GenerateMessagesError",
      status: 400,
      code: "VALIDATION_ERROR",
      message: "occasion is required",
    });
  });

  it("lança GenerateMessagesError com mensagem genérica quando o corpo de erro não segue o formato esperado", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.com";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("{}", { status: 500 }))
    );

    await expect(
      generateMessages({ occasion: "birthday", relationship: "mother" })
    ).rejects.toMatchObject({
      name: "GenerateMessagesError",
      status: 500,
      code: undefined,
    });
  });

  it("lança GenerateMessagesError quando a rede falha", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.com";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down"))
    );

    await expect(
      generateMessages({ occasion: "birthday", relationship: "mother" })
    ).rejects.toBeInstanceOf(GenerateMessagesError);
  });

  it("lança GenerateMessagesError quando a resposta não tem o formato esperado", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.com";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ oops: true }), { status: 200 })
      )
    );

    await expect(
      generateMessages({ occasion: "birthday", relationship: "mother" })
    ).rejects.toBeInstanceOf(GenerateMessagesError);
  });

  it("lança GenerateMessagesError quando NEXT_PUBLIC_API_BASE_URL não está configurada", async () => {
    delete process.env.NEXT_PUBLIC_API_BASE_URL;

    await expect(
      generateMessages({ occasion: "birthday", relationship: "mother" })
    ).rejects.toBeInstanceOf(GenerateMessagesError);
  });
});
