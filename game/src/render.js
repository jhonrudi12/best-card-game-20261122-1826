// Ember Duel — draws the table into the page's DOM.
// Every number a player needs is on the table in large type: both life
// totals, both shields, energy pips, the rival's telegraphed intent, the
// turn, and the deck. Cards are big, suit-coloured, and legible small.
import { CARDS, ENERGY_MAX, HAND_SIZE, RIVAL_NAME, SUITS } from './config.js';
import { PHASE_PLAYER, SCREEN_LOSS, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './world.js';

function hpBar(side, label) {
  const pct = Math.max(0, Math.round((side.hp / side.maxHp) * 100));
  const shield = side.shield > 0 ? ` <span class="shield">🛡 ${side.shield}</span>` : '';
  return `<div class="hp-label">${label} — <b>${side.hp} / ${side.maxHp}</b>${shield}</div>
    <div class="hp-bar"><div class="hp-fill" style="width:${pct}%"></div></div>`;
}

function energyPips(energy) {
  let pips = '';
  for (let i = 0; i < ENERGY_MAX; i += 1) {
    pips += `<span class="pip${i < energy ? ' on' : ''}">●</span>`;
  }
  return `<div class="energy" title="Energy">Energy ${pips}</div>`;
}

function cardHtml(cardId, opts = {}) {
  const card = CARDS[cardId];
  const suit = SUITS[card.suit];
  const cls = ['card', `suit-${card.suit}`];
  if (opts.playable === false) cls.push('cant');
  if (opts.faceDown) cls.push('back');
  if (opts.small) cls.push('small');
  if (opts.faceDown) {
    return `<div class="${cls.join(' ')}"><div class="card-back-glyph">▲</div><div class="card-back-word">EMBER</div></div>`;
  }
  const costPips = '●'.repeat(card.cost) || 'free';
  return `<div class="${cls.join(' ')}" data-card="${cardId}">
    <div class="card-cost" style="background:${suit.dark}">${card.cost === 0 ? '0' : costPips}</div>
    <div class="card-glyph" style="color:${suit.color}">${suit.glyph}</div>
    <div class="card-name">${card.name}</div>
    <div class="card-suit">${suit.name}</div>
    <div class="card-text">${card.text}</div>
  </div>`;
}

/** Render the whole table from the duel state. `ui` carries the element refs and callbacks. */
export function render(duel, ui) {
  const { el, onPlayCard, onEndTurn, onStart, onRestart } = ui;
  el.title.classList.toggle('hidden', duel.screen !== SCREEN_TITLE);
  el.end.classList.toggle('hidden', duel.screen !== SCREEN_WIN && duel.screen !== SCREEN_LOSS);
  el.table.classList.toggle('dimmed', duel.screen === SCREEN_TITLE);

  if (duel.screen === SCREEN_WIN) {
    el.endTitle.textContent = 'VICTORY';
    el.endTitle.className = 'end-title win';
    el.endText.textContent = `${RIVAL_NAME} is out of life. You won in ${duel.turn} turn${duel.turn === 1 ? '' : 's'} — ${duel.stats.cardsPlayed} cards played, ${duel.stats.damageDealt} damage dealt.`;
  } else if (duel.screen === SCREEN_LOSS) {
    el.endTitle.textContent = 'DEFEAT';
    el.endTitle.className = 'end-title loss';
    el.endText.textContent = `Your life reached 0 on turn ${duel.turn}. ${RIVAL_NAME} takes this duel — press R or click below to play again.`;
  }

  el.rivalHp.innerHTML = hpBar(duel.rival, RIVAL_NAME);
  el.playerHp.innerHTML = hpBar(duel.player, 'You');
  el.energy.innerHTML = energyPips(duel.energy);
  el.turnInfo.textContent = `Turn ${duel.turn}  ·  Deck ${duel.deck.length}  ·  Discard ${duel.discard.length}`;

  el.intent.textContent = duel.rivalIntent ? duel.rivalIntent.text : '';
  el.intent.classList.toggle('hidden', !duel.rivalIntent || duel.screen !== SCREEN_PLAY);

  // Rival hand: face-down backs, plus the cards it just played, face up.
  let rivalHtml = '';
  for (let i = 0; i < duel.rivalHand.length; i += 1) rivalHtml += cardHtml('emberStrike', { faceDown: true, small: true });
  el.rivalHand.innerHTML = rivalHtml;
  el.rivalPlayed.innerHTML = duel.rivalPlayed.map((id) => cardHtml(id, { small: true })).join('');

  // Player hand: click a card to play it (keys 1–5 do the same).
  el.hand.innerHTML = duel.hand.map((id, i) => {
    const affordable = CARDS[id].cost <= duel.energy && duel.phase === PHASE_PLAYER && duel.screen === SCREEN_PLAY;
    return cardHtml(id, { playable: affordable });
  }).join('');
  [...el.hand.children].forEach((node, i) => {
    node.addEventListener('click', () => onPlayCard(i));
  });

  el.log.innerHTML = duel.log.slice(-4).map((line) => `<div>${line}</div>`).join('');
  el.chain.textContent = duel.flameChain > 0
    ? `Flame Chain ×${duel.flameChain} — your next Flame card deals bonus damage`
    : '';
  el.chain.classList.toggle('hidden', duel.flameChain === 0);

  el.endTurn.disabled = duel.screen !== SCREEN_PLAY || duel.phase !== PHASE_PLAYER;
  el.endTurn.textContent = duel.phase === PHASE_PLAYER ? 'End Turn  (Space)' : 'Rival plays…';

  el.startBtn.onclick = onStart;
  el.againBtn.onclick = onRestart;
  el.endTurn.onclick = onEndTurn;
}

/** Collect the page's element refs once at boot. */
export function collectElements() {
  const byId = (id) => document.getElementById(id);
  return {
    title: byId('title-screen'),
    table: byId('table'),
    end: byId('end-screen'),
    endTitle: byId('end-title'),
    endText: byId('end-text'),
    rivalHp: byId('rival-hp'),
    playerHp: byId('player-hp'),
    energy: byId('energy'),
    turnInfo: byId('turn-info'),
    intent: byId('rival-intent'),
    rivalHand: byId('rival-hand'),
    rivalPlayed: byId('rival-played'),
    hand: byId('player-hand'),
    log: byId('log'),
    chain: byId('chain-note'),
    endTurn: byId('end-turn'),
    startBtn: byId('start-btn'),
    againBtn: byId('again-btn'),
  };
}

export { HAND_SIZE };
