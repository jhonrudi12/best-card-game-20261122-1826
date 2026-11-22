// Ember Duel — card catalogue and table constants.
// Four suits, told apart by colour AND shape: Flame ▲ red, Tide ● blue,
// Grove ◆ green, Storm ★ amber. Every card shows its cost in energy pips,
// its suit glyph, and its effect in plain numbers.
export const SUITS = {
  flame: { name: 'Flame', glyph: '▲', color: '#e5484d', dark: '#8f1d22' },
  tide: { name: 'Tide', glyph: '●', color: '#3e9bff', dark: '#14508f' },
  grove: { name: 'Grove', glyph: '◆', color: '#46c26a', dark: '#1d6b38' },
  storm: { name: 'Storm', glyph: '★', color: '#f5b301', dark: '#8a6400' },
};

export const MAX_HP = 30;
export const ENERGY_MAX = 3;
export const HAND_SIZE = 5;

// effect: { kind, amount, extra } — kinds: damage, shield, heal, draw,
// damageDraw, shieldDamage, damageHeal. chainBonus adds +2 damage to a
// Flame card when another Flame card was already played this turn.
export const CARDS = {
  emberStrike: { name: 'Ember Strike', suit: 'flame', cost: 1, effect: { kind: 'damage', amount: 4 }, text: 'Deal 4 damage.' },
  emberBlast: { name: 'Ember Blast', suit: 'flame', cost: 2, effect: { kind: 'damage', amount: 7 }, text: 'Deal 7 damage.' },
  ignite: { name: 'Ignite', suit: 'flame', cost: 3, effect: { kind: 'damage', amount: 10 }, text: 'Deal 10 damage.' },
  emberChain: { name: 'Ember Chain', suit: 'flame', cost: 1, effect: { kind: 'damage', amount: 3, chainBonus: 3 }, text: 'Deal 3 damage. +3 if a Flame card was played this turn.' },
  tideWall: { name: 'Tide Wall', suit: 'tide', cost: 1, effect: { kind: 'shield', amount: 5 }, text: 'Gain 5 shield.' },
  tideFortress: { name: 'Tide Fortress', suit: 'tide', cost: 2, effect: { kind: 'shield', amount: 9 }, text: 'Gain 9 shield.' },
  tideRiposte: { name: 'Tide Riposte', suit: 'tide', cost: 1, effect: { kind: 'shieldDamage', amount: 3 }, text: 'Gain 3 shield. Deal 3 damage.' },
  groveMend: { name: 'Grove Mend', suit: 'grove', cost: 1, effect: { kind: 'heal', amount: 5 }, text: 'Restore 5 life.' },
  groveBloom: { name: 'Grove Bloom', suit: 'grove', cost: 2, effect: { kind: 'healDraw', amount: 7 }, text: 'Restore 7 life. Draw 1 card.' },
  groveThorn: { name: 'Grove Thorn', suit: 'grove', cost: 1, effect: { kind: 'damageHeal', amount: 2 }, text: 'Deal 2 damage. Restore 3 life.' },
  stormZap: { name: 'Storm Zap', suit: 'storm', cost: 0, effect: { kind: 'damage', amount: 2 }, text: 'Deal 2 damage.' },
  stormSurge: { name: 'Storm Surge', suit: 'storm', cost: 2, effect: { kind: 'damageDraw', amount: 3 }, text: 'Deal 3 damage. Draw 2 cards.' },
};

// Two copies of each card make the 24-card deck.
export const DECK_LIST = Object.keys(CARDS).flatMap((id) => [id, id]);

export const RIVAL_NAME = 'Ash, the Cinder Rival';
export const PLAYER_NAME = 'You, the Ember Duelist';
