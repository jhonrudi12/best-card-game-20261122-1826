// Ember Duel — the deck, hand and discard pile.
// A deck is a shuffled list of card ids. Drawing empties the deck, then
// the discard pile is shuffled back in as the new deck, so a duel never
// runs out of cards.
import { DECK_LIST } from './config.js';
import { rollInt } from './random.js';

/** A fresh shuffled deck from the seeded stream. */
export function buildDeck(rng) {
  const deck = [...DECK_LIST];
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = rollInt(rng, i + 1);
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

/** Draw `count` cards into `hand`, reshuffling the discard when the deck runs dry. */
export function drawCards(deck, discard, hand, count, rng) {
  for (let n = 0; n < count; n += 1) {
    if (deck.length === 0) {
      if (discard.length === 0) return;
      deck.push(...discard.splice(0));
      for (let i = deck.length - 1; i > 0; i -= 1) {
        const j = rollInt(rng, i + 1);
        [deck[i], deck[j]] = [deck[j], deck[i]];
      }
    }
    hand.push(deck.pop());
  }
}
