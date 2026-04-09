import { Router } from "express";
import { suggestionRouter } from "./suggestion.routes";

const router = Router();

router.use(suggestionRouter);

export default router;