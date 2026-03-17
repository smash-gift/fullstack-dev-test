import { Router } from "express";
import { suggestionsController } from "../controllers/suggestions.controller";

/**
 * @swagger
 * /api/suggestions:
 *   post:
 *     summary: Gera sugestões de mensagens para vale-presente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - occasion
 *               - relationship
 *             properties:
 *               occasion:
 *                 type: string
 *                 example: aniversário
 *               relationship:
 *                 type: string
 *                 example: amigo
 *     responses:
 *       200:
 *         description: Sugestões geradas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 suggestions:
 *                   type: array
 *                   items:
 *                     type: string
 *                 source:
 *                   type: string
 *                   enum: [ai, fallback]
 *       400:
 *         description: Campos obrigatórios ausentes
 */
const router = Router();
router.post("/suggestions", suggestionsController);

export default router;