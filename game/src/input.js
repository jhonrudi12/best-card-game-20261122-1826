// Ember Duel — keyboard and mouse.
// Keys 1–5 play the hand card in that slot, Space or Enter ends the turn,
// Enter starts from the title, R restarts after a win or a loss. Clicking
// a card plays it; clicking End Turn ends the turn. Arrow keys move a
// selection highlight across the hand; Enter plays the selected card.
import { SCREEN_LOSS, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './world.js';

export function bindInput(duel, actions) {
  let selected = 0;

  function playSelected() {
    if (duel.screen === SCREEN_PLAY) actions.play(selected);
  }

  document.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const key = event.key;
    if (duel.screen === SCREEN_TITLE && (key === 'Enter' || key === ' ')) {
      event.preventDefault();
      actions.start();
      return;
    }
    if ((duel.screen === SCREEN_WIN || duel.screen === SCREEN_LOSS) && (key === 'r' || key === 'R' || key === 'Enter')) {
      actions.restart();
      return;
    }
    if (duel.screen !== SCREEN_PLAY) return;
    if (key >= '1' && key <= '5') {
      actions.play(Number(key) - 1);
      return;
    }
    if (key === ' ' || key === 'Enter') {
      event.preventDefault();
      actions.endTurn();
      return;
    }
    if (key === 'ArrowLeft' || key === 'ArrowRight') {
      event.preventDefault();
      const dir = key === 'ArrowLeft' ? -1 : 1;
      selected = Math.max(0, Math.min(duel.hand.length - 1, selected + dir));
      actions.select(selected);
    }
  });

  return {
    /** The hand slot the arrow keys currently highlight. */
    get selected() {
      return selected;
    },
    select(index) {
      selected = index;
    },
    playSelected,
  };
}
