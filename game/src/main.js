// Ember Duel — boot: builds the table, wires input, and renders.
// A ?shot=title|table|win|loss&seed=N query stages a screenshot scene
// instead of a fresh title screen; without it, a new duel waits on the
// title screen for Enter or a click.
import { endTurn, newDuel, playCard, startDuel } from './world.js';
import { bindInput } from './input.js';
import { collectElements, render } from './render.js';
import { stageShot } from './shots.js';

const params = new URLSearchParams(window.location.search);
const seedParam = Number(params.get('seed'));
const seed = Number.isFinite(seedParam) && seedParam > 0 ? Math.floor(seedParam) : 20261123;
const shot = params.get('shot');

const el = collectElements();
let duel;
if (shot) {
  duel = stageShot(shot, seed).duel;
} else {
  duel = newDuel(seed);
}

const input = bindInput(duel, {
  play(index) {
    if (playCard(duel, index)) draw();
  },
  endTurn() {
    if (endTurn(duel)) draw();
  },
  start() {
    if (duel.screen === 'title') {
      startDuel(duel);
      draw();
    }
  },
  restart() {
    duel = newDuel((seed + duel.turn * 7919) % 2147483647);
    startDuel(duel);
    draw();
  },
  select(index) {
    highlight(index);
  },
});

function highlight(index) {
  [...el.hand.children].forEach((node, i) => {
    node.classList.toggle('selected', i === index);
  });
}

function draw() {
  render(duel, {
    el,
    onPlayCard(index) {
      if (playCard(duel, index)) draw();
    },
    onEndTurn() {
      if (endTurn(duel)) draw();
    },
    onStart() {
      if (duel.screen === 'title') {
        startDuel(duel);
        draw();
      }
    },
    onRestart() {
      duel = newDuel((seed + duel.turn * 7919) % 2147483647);
      startDuel(duel);
      draw();
    },
  });
}

draw();
