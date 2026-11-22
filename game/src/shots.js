// Ember Duel — screenshot scenes behind ?shot=title|table|win|loss.
// Each scene plays the real rules forward from a fresh duel with a fixed
// seed, steered by a simple autopilot, so the frame is what a short game
// really looks like and the same seed always gives the same frame.
// title: the title screen over a freshly dealt table.
// table: eight turns of sensible play, up to two cards a turn — shields
// against telegraphed attacks, heals when hurt, Flame chains when open —
// a busy mid-game table with both duelists still standing.
// win: the autopilot plays every Flame card it can afford until the rival
// falls; a full duel, won for real.
// loss: the autopilot plays only free Zaps and never shields or heals,
// so the rival's attacks carry the player to 0.
import { CARDS } from './config.js';
import { SCREEN_LOSS, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN, endTurn, newDuel, playCard, startDuel } from './world.js';

const TABLE_TURNS = 8;
const DUEL_TURN_CAP = 60;

/** Greedy play: spend energy on the best affordable card, then end the turn. */
function greedyTurn(duel, cautious, maxCards = 12) {
  let guard = 0;
  let played = 0;
  while (guard < 12 && played < maxCards) {
    guard += 1;
    const intent = duel.rivalIntent;
    let best = -1;
    let bestScore = -1;
    for (let i = 0; i < duel.hand.length; i += 1) {
      const card = CARDS[duel.hand[i]];
      if (card.cost > duel.energy) continue;
      let score = 0;
      if (card.effect.kind === 'damage' || card.effect.kind === 'damageDraw' || card.effect.kind === 'shieldDamage' || card.effect.kind === 'damageHeal') score += card.effect.amount * 2;
      if (card.suit === 'flame' && duel.flameChain > 0) score += 3;
      if (cautious && intent && intent.kind === 'attack' && (card.effect.kind === 'shield' || card.effect.kind === 'shieldDamage')) score += 6;
      if (cautious && duel.player.hp <= 12 && (card.effect.kind === 'heal' || card.effect.kind === 'healDraw' || card.effect.kind === 'damageHeal')) score += 6;
      if (card.effect.kind === 'draw' || card.effect.kind === 'damageDraw' || card.effect.kind === 'healDraw') score += 1;
      if (card.cost === 0) score += 1;
      if (score > bestScore) {
        bestScore = score;
        best = i;
      }
    }
    if (best === -1) break;
    if (!playCard(duel, best)) break;
    played += 1;
    if (duel.screen !== SCREEN_PLAY) return;
  }
}

/** The autopilot that loses: only free Zaps, never a shield or a heal. */
function carelessTurn(duel) {
  let guard = 0;
  while (guard < 12) {
    guard += 1;
    const i = duel.hand.findIndex((id) => CARDS[id].cost === 0);
    if (i === -1) break;
    if (!playCard(duel, i)) break;
    if (duel.screen !== SCREEN_PLAY) return;
  }
}

/**
 * Set the duel to the named scene and return the screen to draw.
 * Any name other than table/win/loss is the title scene.
 */
export function stageShot(name, seed) {
  const duel = newDuel(seed);
  if (name !== 'table' && name !== 'win' && name !== 'loss') {
    return { duel, screen: SCREEN_TITLE };
  }
  startDuel(duel);
  if (name === 'table') {
    for (let t = 0; t < TABLE_TURNS && duel.screen === SCREEN_PLAY; t += 1) {
      greedyTurn(duel, true, 2);
      if (duel.screen === SCREEN_PLAY) endTurn(duel);
    }
    return { duel, screen: duel.screen === SCREEN_PLAY ? SCREEN_PLAY : duel.screen };
  }
  if (name === 'win') {
    for (let t = 0; t < DUEL_TURN_CAP && duel.screen === SCREEN_PLAY; t += 1) {
      greedyTurn(duel, true);
      if (duel.screen === SCREEN_PLAY) endTurn(duel);
    }
    return { duel, screen: duel.screen };
  }
  // loss
  for (let t = 0; t < DUEL_TURN_CAP && duel.screen === SCREEN_PLAY; t += 1) {
    carelessTurn(duel);
    if (duel.screen === SCREEN_PLAY) endTurn(duel);
  }
  return { duel, screen: duel.screen };
}

export { SCREEN_LOSS, SCREEN_WIN };
