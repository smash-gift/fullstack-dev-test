import request from "supertest";
import express from "express";
import suggestionsRouter from "../routes/suggestions";
import * as geminiProvider from "../providers/gemini.provider";

const app = express();
app.use(express.json());
app.use("/api", suggestionsRouter);

describe("POST /api/suggestions", () => {
  it("retorna 400 quando campos estão ausentes", async () => {
    const res = await request(app).post("/api/suggestions").send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it("retorna sugestões da IA quando Gemini funciona", async () => {
    jest.spyOn(geminiProvider, "generateWithGemini").mockResolvedValue([
      "Parabéns pelo seu dia!",
      "Que este presente traga alegria!",
      "Com muito carinho para você.",
    ]);

    const res = await request(app)
      .post("/api/suggestions")
      .send({ occasion: "aniversário", relationship: "amigo" });

    expect(res.status).toBe(200);
    expect(res.body.source).toBe("ai");
    expect(res.body.suggestions).toHaveLength(3);
  });

  it("retorna fallback quando Gemini falha", async () => {
    jest
      .spyOn(geminiProvider, "generateWithGemini")
      .mockRejectedValue(new Error("Gemini timeout"));

    const res = await request(app)
      .post("/api/suggestions")
      .send({ occasion: "casamento", relationship: "colega" });

    expect(res.status).toBe(200);
    expect(res.body.source).toBe("fallback");
    expect(res.body.suggestions.length).toBeGreaterThan(0);
  });
});