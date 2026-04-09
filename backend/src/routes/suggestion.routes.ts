import { Router } from "express";
import * as suggestionController from "../controllers/suggestion.controller";

const suggestionRouter = Router();

suggestionRouter.post("/api/v1/suggestions", suggestionController.handleSuggestion);

export { suggestionRouter };

