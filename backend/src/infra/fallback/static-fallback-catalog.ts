import type { SuggestMessagesInput } from '../../domain/dtos/suggest-messages-input.dto.js';
import type { Suggestion } from '../../domain/entities/suggestion.js';
import type { FallbackCatalog } from '../../domain/services/fallback-catalog.js';
import { createId } from '../../pkg/utils/id.js';
import { resolveOccasion, resolveRelationship } from './catalog-aliases.js';
import { DEFAULT_KEY, FALLBACK_MESSAGES } from './fallback-messages.js';

/**
 * Curated messages served when the model cannot deliver.
 *
 * Degrades in three steps, so an uncatalogued pair still gets something
 * sensible rather than nothing:
 *
 *   1. occasion x relationship   birthday x friend
 *   2. occasion                  birthday x <anything>
 *   3. generic                   works for any pair
 *
 * Two properties this must never break, because it is the last thing between
 * a provider outage and an empty screen: it never throws, and it never
 * returns an empty list.
 *
 * `occasion` and `relationship` are resolved through an alias table first, so
 * "aniversario" and "cumpleanos" reach the birthday entry rather than dropping
 * to the generic one.
 *
 * Known limitation: `tone` is ignored. Honouring it would multiply the
 * catalogue by four for a path that is, by definition, already degraded.
 *
 * `language` is honoured when the caller pinned one. When they did not, the
 * language of the answer is the model's job — and on this path there is no
 * model, so English is served. That is a real gap, and the honest place for
 * it is here rather than behind a guess: a detector good enough for "esposa"
 * or "amor" is not something this catalogue can fake, and guessing wrong
 * would put a confidently Spanish card in front of a Portuguese user. The
 * amber banner already tells them quality dropped.
 * See docs/01-architecture/decisions/adr-0012-response-language.md.
 *
 * See docs/01-architecture/decisions/adr-0003-fallback-strategy.md
 */
export class StaticFallbackCatalog implements FallbackCatalog {
  get(input: SuggestMessagesInput): readonly Suggestion[] {
    const messages = this.lookup(input);

    return messages.slice(0, input.count).map((text) => ({ id: createId('fb'), text }));
  }

  private lookup(input: SuggestMessagesInput): readonly string[] {
    // `SuggestionLanguage` is exactly the set of keys in the catalogue, so a
    // pinned language cannot miss. The fallback to English is for the request
    // that pinned nothing — a branch the compiler once ruled out, and that
    // `language` becoming optional made reachable and testable again.
    const byLanguage = FALLBACK_MESSAGES[input.language ?? 'en'];
    // Users type in their own language; the catalogue is keyed in English.
    const occasion = resolveOccasion(input.occasion);
    const relationship = resolveRelationship(input.relationship);

    const byOccasion = byLanguage[occasion];
    if (byOccasion) {
      const exact = byOccasion[relationship];
      if (exact && exact.length > 0) return exact;

      // Level 2 is guaranteed by `OccasionMessages`, so there is nothing to
      // check here. It used to be guarded, and the guard was a branch no test
      // could ever take.
      return byOccasion[DEFAULT_KEY];
    }

    // Level 3, guaranteed the same way.
    return byLanguage[DEFAULT_KEY][DEFAULT_KEY];
  }
}
