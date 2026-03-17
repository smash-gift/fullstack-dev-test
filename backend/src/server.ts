import express, { Request, Response, NextFunction } from "express";
import suggestionsRouter from "./routes/suggestions";
import { AppError } from "./errors/app.error";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

app.use("/api", suggestionsRouter);
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Erro não tratado:", err);

  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  res.status(500).json({ error: "Erro interno no servidor." });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log(`Swagger em http://localhost:${PORT}/docs`);
});

export default app;