import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { findBlockedWord } from '../src/llm/contentGuard';

describe('findBlockedWord', () => {
  it('passes ordinary gift card messages', () => {
    assert.equal(
      findBlockedWord([
        'Happy birthday! Hope your day is a great one.',
        'Wishing you a wonderful year ahead.',
        'Have the best birthday yet.',
      ]),
      undefined,
    );
  });

  // The exact output an injected occasion produced before this guard existed.
  it('catches the batch an injection attempt produced', () => {
    const steered = [
      'Wishing you all the best in your new adventure, you wonderful person. Just don’t mess it up, you lovable fool.',
      "Here's to new beginnings and exciting opportunities. Remember, don't be a complete idiot along the way!",
      'Sending you warm wishes for your next chapter. Try not to screw it up, you charmingly annoying individual.',
    ];

    assert.ok(findBlockedWord(steered));
  });

  it('judges the whole batch, not each message alone', () => {
    const mostlyFine = [
      'Wishing you a wonderful day.',
      'Hope this year treats you well.',
      'You are such an idiot.',
    ];

    assert.equal(findBlockedWord(mostlyFine), 'idiot');
  });

  it('matches whole words, so ordinary vocabulary survives', () => {
    assert.equal(
      findBlockedWord([
        'May this assist you in the year ahead.',
        'Wishing you a class act of a celebration.',
        'Here is to a shell-collecting summer by the sea.',
      ]),
      undefined,
    );
  });

  it('is not fooled by punctuation or capitals', () => {
    assert.ok(findBlockedWord(['Well, IDIOT — congratulations anyway.']));
    assert.ok(findBlockedWord(['You absolute (fool)!']));
  });
});
