// Ember Duel — the duel itself: state, rules, and the rival's mind.
// One turn: you spend up to 3 energy playing cards from your hand, then
// end the turn; the rival plays the move it telegraphed at the start of
// your turn, then you draw back up to 5 and the rival telegraphs again.
// Shield absorbs damage and lasts until it is spent. Flame Chain: a second
// Flame card in the same turn deals bonus damage. First to 0 life loses.
import { CARDS, ENERGY_MAX, HAND_SIZE, MAX_HP, RIVAL_NAME } from './config.js';
import { buildDeck, drawCards } from './deck.js';
import { makeRng, rollInt } from './random.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_WIN = 'win';
export const SCREEN_LOSS = 'loss';

export const PHASE_PLAYER = 'player';
export const PHASE_RIVAL = 'rival';

export function newDuel(seed) {
  const rng = makeRng(seed);
  const duel = {
    seed,
    screen: SCREEN_TITLE,
    phase: PHASE_PLAYER,
    turn: 1,
    energy: ENERGY_MAX,
    flameChain: 0,
    player: { hp: MAX_HP, maxHp: MAX_HP, shield: 0 },
    rival: { hp: MAX_HP, maxHp: MAX_HP, shield: 0 },
    deck: buildDeck(rng),
    hand: [],
    discard: [],
    rivalDeck: buildDeck(rng),
    rivalHand: [],
    rivalDiscard: [],
    rivalIntent: null,
    rivalPlayed: [],
    log: ['The duel begins. Play a card, then end your turn.'],
    stats: { cardsPlayed: 0, damageDealt: 0, damageTaken: 0 },
  };
  drawCards(duel.deck, duel.discard, duel.hand, HAND_SIZE, rng);
  drawCards(duel.rivalDeck, duel.rivalDiscard, duel.rivalHand, HAND_SIZE, rng);
  duel.rivalIntent = planRivalIntent(duel, rng);
  duel.rng = rng;
  return duel;
}

export function startDuel(duel) {
  duel.screen = SCREEN_PLAY;
  duel.log.push('Your move — spend energy, then end the turn.');
}

/** Damage first eats shield, then life. Returns the life lost. */
function dealDamage(target, amount) {
  const blocked = Math.min(target.shield, amount);
  target.shield -= blocked;
  const life = amount - blocked;
  target.hp = Math.max(0, target.hp - life);
  return life;
}

function heal(target, amount) {
  target.hp = Math.min(target.maxHp, target.hp + amount);
}

/**
 * Apply one card's effect. `byPlayer` picks the side playing it.
 * Returns a short line for the log.
 */
export function applyCard(duel, cardId, byPlayer) {
  const card = CARDS[cardId];
  const me = byPlayer ? duel.player : duel.rival;
  const foe = byPlayer ? duel.rival : duel.player;
  const who = byPlayer ? 'You' : RIVAL_NAME;
  const effect = card.effect;
  let damage = effect.amount;
  if (effect.chainBonus && duel.flameChain > 0) damage += effect.chainBonus;
  let line = '';
  switch (effect.kind) {
    case 'damage':
      dealDamage(foe, damage);
      line = `${who} played ${card.name} — ${damage} damage.`;
      if (byPlayer) duel.stats.damageDealt += damage;
      else duel.stats.damageTaken += damage;
      break;
    case 'shield':
      me.shield += effect.amount;
      line = `${who} played ${card.name} — +${effect.amount} shield.`;
      break;
    case 'heal':
      heal(me, effect.amount);
      line = `${who} played ${card.name} — restored ${effect.amount} life.`;
      break;
    case 'draw':
      drawCards(byPlayer ? duel.deck : duel.rivalDeck, byPlayer ? duel.discard : duel.rivalDiscard, byPlayer ? duel.hand : duel.rivalHand, effect.amount, duel.rng);
      line = `${who} played ${card.name} — drew ${effect.amount}.`;
      break;
    case 'damageDraw':
      dealDamage(foe, damage);
      drawCards(byPlayer ? duel.deck : duel.rivalDeck, byPlayer ? duel.discard : duel.rivalDiscard, byPlayer ? duel.hand : duel.rivalHand, 2, duel.rng);
      line = `${who} played ${card.name} — ${damage} damage, drew 2.`;
      if (byPlayer) duel.stats.damageDealt += damage;
      else duel.stats.damageTaken += damage;
      break;
    case 'shieldDamage':
      me.shield += effect.amount;
      dealDamage(foe, effect.amount);
      line = `${who} played ${card.name} — +${effect.amount} shield, ${effect.amount} damage.`;
      if (byPlayer) duel.stats.damageDealt += effect.amount;
      else duel.stats.damageTaken += effect.amount;
      break;
    case 'damageHeal':
      dealDamage(foe, effect.amount);
      heal(me, 3);
      line = `${who} played ${card.name} — ${effect.amount} damage, restored 3 life.`;
      if (byPlayer) duel.stats.damageDealt += effect.amount;
      else duel.stats.damageTaken += effect.amount;
      break;
    case 'healDraw':
      heal(me, effect.amount);
      drawCards(byPlayer ? duel.deck : duel.rivalDeck, byPlayer ? duel.discard : duel.rivalDiscard, byPlayer ? duel.hand : duel.rivalHand, 1, duel.rng);
      line = `${who} played ${card.name} — restored ${effect.amount} life, drew 1.`;
      break;
    default:
      line = `${who} played ${card.name}.`;
  }
  if (card.suit === 'flame') duel.flameChain += 1;
  return line;
}

/** Can this hand card be played right now? */
export function canPlay(duel, handIndex) {
  if (duel.screen !== SCREEN_PLAY || duel.phase !== PHASE_PLAYER) return false;
  const cardId = duel.hand[handIndex];
  if (!cardId) return false;
  return CARDS[cardId].cost <= duel.energy;
}

/** Play the hand card at `handIndex`. Returns false when it cannot be played. */
export function playCard(duel, handIndex) {
  if (!canPlay(duel, handIndex)) return false;
  const cardId = duel.hand[handIndex];
  const card = CARDS[cardId];
  duel.energy -= card.cost;
  duel.hand.splice(handIndex, 1);
  duel.discard.push(cardId);
  duel.stats.cardsPlayed += 1;
  duel.log.push(applyCard(duel, cardId, true));
  checkEnd(duel);
  return true;
}

/** The rival telegraphs its next move — the player reads it and counters it. */
function planRivalIntent(duel, rng) {
  const rival = duel.rival;
  const player = duel.player;
  const hand = duel.rivalHand;
  const pick = (ids) => {
    const owned = ids.filter((id) => hand.includes(id));
    return owned.length ? owned[rollInt(rng, owned.length)] : null;
  };
  // Hurt and holding a mend: heal. Player shielded up: break it with a blast.
  // Otherwise: a heavy attack, sometimes a wall of its own.
  let cardId = null;
  let kind = 'attack';
  if (rival.hp <= 12) {
    cardId = pick(['groveBloom', 'groveMend']) ?? pick(['tideFortress', 'emberBlast']);
    kind = cardId && cardId.startsWith('grove') ? 'heal' : 'attack';
  } else if (player.shield >= 8) {
    cardId = pick(['ignite', 'emberBlast', 'emberStrike']);
  } else if (rng() < 0.25) {
    cardId = pick(['tideFortress', 'tideWall', 'tideRiposte']);
    kind = 'shield';
  }
  if (!cardId) {
    cardId = pick(['emberBlast', 'emberStrike', 'emberChain', 'stormSurge', 'stormZap']) ?? hand[rollInt(rng, hand.length)];
  }
  if (!cardId) return null;
  const card = CARDS[cardId];
  let text = '';
  if (kind === 'heal') text = `mends for ${card.effect.amount}`;
  else if (kind === 'shield') text = `raises ${card.effect.amount} shield`;
  else text = `strikes for ${card.effect.amount}`;
  return { cardId, kind, text: `Rival plans: ${text}` };
}

/** End the player's turn: the rival plays its telegraphed card, then a new turn starts. */
export function endTurn(duel) {
  if (duel.screen !== SCREEN_PLAY || duel.phase !== PHASE_PLAYER) return false;
  duel.phase = PHASE_RIVAL;
  duel.rivalPlayed = [];
  const intent = duel.rivalIntent;
  if (intent) {
    const index = duel.rivalHand.indexOf(intent.cardId);
    if (index !== -1) {
      duel.rivalHand.splice(index, 1);
      duel.rivalDiscard.push(intent.cardId);
      duel.rivalPlayed.push(intent.cardId);
      duel.log.push(applyCard(duel, intent.cardId, false));
    }
  }
  // The rival sometimes follows up with a cheap second card.
  const followUp = duel.rivalHand.find((id) => CARDS[id].cost <= 1 && CARDS[id].suit !== 'grove');
  if (followUp && duel.rng() < 0.75) {
    const index = duel.rivalHand.indexOf(followUp);
    duel.rivalHand.splice(index, 1);
    duel.rivalDiscard.push(followUp);
    duel.rivalPlayed.push(followUp);
    duel.log.push(applyCard(duel, followUp, false));
  }
  if (checkEnd(duel)) return true;
  duel.turn += 1;
  duel.energy = ENERGY_MAX;
  duel.flameChain = 0;
  drawCards(duel.deck, duel.discard, duel.hand, HAND_SIZE - duel.hand.length, duel.rng);
  drawCards(duel.rivalDeck, duel.rivalDiscard, duel.rivalHand, HAND_SIZE - duel.rivalHand.length, duel.rng);
  duel.rivalIntent = planRivalIntent(duel, duel.rng);
  duel.phase = PHASE_PLAYER;
  duel.log.push(`Turn ${duel.turn} — your move.`);
  return true;
}

/** Win/loss check after any effect. Returns true when the duel is over. */
function checkEnd(duel) {
  if (duel.rival.hp <= 0) {
    duel.screen = SCREEN_WIN;
    duel.log.push(`Victory! ${RIVAL_NAME} is out of life.`);
    return true;
  }
  if (duel.player.hp <= 0) {
    duel.screen = SCREEN_LOSS;
    duel.log.push('Defeat — your life reached 0.');
    return true;
  }
  return false;
}
