// Deck, Hand, Draw Pile & Discard Pile Manager
export class DeckManager {
  constructor(initialDeckInstances = []) {
    this.initialDeck = [...initialDeckInstances];
    this.drawPile = [];
    this.hand = [];
    this.discardPile = [];
    this.exhaustPile = [];
    this.maxHandSize = 7;
    this.resetForBattle();
  }

  resetForBattle() {
    this.drawPile = this.shuffle([...this.initialDeck]);
    this.hand = [];
    this.discardPile = [];
    this.exhaustPile = [];
  }

  shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Draw count cards. If draw pile is depleted, discard pile is shuffled into draw pile.
  drawCards(count = 4, onReshuffleCallback = null) {
    const drawn = [];
    for (let i = 0; i < count; i++) {
      if (this.hand.length >= this.maxHandSize) {
        break; // Hand is full
      }

      if (this.drawPile.length === 0) {
        if (this.discardPile.length > 0) {
          // Continuous Deck Loop Reshuffle!
          this.drawPile = this.shuffle([...this.discardPile]);
          this.discardPile = [];
          if (onReshuffleCallback) {
            onReshuffleCallback();
          }
        } else {
          // No cards anywhere in draw or discard pile
          break;
        }
      }

      if (this.drawPile.length > 0) {
        const card = this.drawPile.pop();
        this.hand.push(card);
        drawn.push(card);
      }
    }
    return drawn;
  }

  playCardFromHand(instanceId) {
    const idx = this.hand.findIndex(c => c.instanceId === instanceId);
    if (idx === -1) return null;
    const [card] = this.hand.splice(idx, 1);
    card.playCount = (card.playCount || 0) + 1;
    return card;
  }

  discardCardFromHand(instanceId) {
    const idx = this.hand.findIndex(c => c.instanceId === instanceId);
    if (idx === -1) return null;
    const [card] = this.hand.splice(idx, 1);
    this.discardPile.push(card);
    return card;
  }

  discardRandomCard() {
    if (this.hand.length === 0) return null;
    const idx = Math.floor(Math.random() * this.hand.length);
    const [card] = this.hand.splice(idx, 1);
    this.discardPile.push(card);
    return card;
  }

  sendToDiscard(card) {
    if (!card) return;
    this.discardPile.push(card);
  }

  sendToExhaust(card) {
    if (!card) return;
    this.exhaustPile.push(card);
  }

  reclaimCardFromDiscard(filterFn = null) {
    if (this.discardPile.length === 0) return null;
    let idx = -1;
    if (filterFn) {
      idx = this.discardPile.findIndex(filterFn);
    } else {
      idx = this.discardPile.length - 1; // Last discarded
    }
    if (idx !== -1) {
      const [reclaimed] = this.discardPile.splice(idx, 1);
      if (this.hand.length < this.maxHandSize) {
        this.hand.push(reclaimed);
      } else {
        this.discardPile.push(reclaimed);
        return null;
      }
      return reclaimed;
    }
    return null;
  }
}
