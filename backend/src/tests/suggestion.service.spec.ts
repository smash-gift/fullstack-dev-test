import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../services/llm.service", () => ({
  execute: vi.fn(),
}));

vi.mock("../services/fallback.service", () => ({
  execute: vi.fn(),
}));

import * as fallbackService from "../services/fallback.service";
import * as llmService from "../services/llm.service";
import * as suggestionService from "../services/suggestion.service";

describe("SuggestionService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return fallback suggestions when llm fails", async () => {
    vi.mocked(llmService.execute).mockRejectedValue(new Error("timeout"));
    vi.mocked(fallbackService.execute).mockReturnValue({
      suggestions: [
        "Happy birthday! Wishing you a day full of joy and laughter.",
        "Hope your birthday is filled with special moments and happy memories.",
        "Wishing you all the best on your special day.",
      ],
      source: "fallback",
    });

    const result = await suggestionService.execute({
      occasion: "birthday",
      relationship: "friend",
    });

    expect(llmService.execute).toHaveBeenCalledWith("birthday", "friend");
    expect(fallbackService.execute).toHaveBeenCalledWith("birthday");
    expect(result.source).toBe("fallback");
    expect(result.suggestions.length).toBeGreaterThanOrEqual(2);
  });
});