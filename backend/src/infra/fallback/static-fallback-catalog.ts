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
 * `language` IS honoured — answering a Portuguese request in English would be
 * a visible failure stacked on top of an invisible one.
 *
 * See docs/01-architecture/decisions/adr-0003-fallback-strategy.md
 */
export class StaticFallbackCatalog implements FallbackCatalog {
  get(input: SuggestMessagesInput): readonly Suggestion[] {
    const messages = this.lookup(input);

    return messages.slice(0, input.count).map((text) => ({ id: createId('fb'), text }));
  }

  private lookup(input: SuggestMessagesInput): readonly string[] {
    // `SuggestionLanguage` is exactly the set of keys in the catalogue, so this
    // lookup cannot miss. The `?? en` that used to sit here read as prudence
    // and was a branch the compiler already ruled out.
    const byLanguage = FALLBACK_MESSAGES[input.language];
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
