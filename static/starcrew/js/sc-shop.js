/**
 * sc-shop.js — shop inter-vagues.
 * Overlay DOM affiche 6s. Navigation A/D ou fleches, achat ENTREE, ECHAP pour passer.
 */

class ScShop {
  constructor() {
    this.visible = false;
    this.selected = 0;
    this.timer = 0;
    this.purchases = {};             // {COOL: n, GRAPPLE: n, LIFE: n, CANNON: n}
    this.onEnd = null;
    this._lastNavTime = 0;
  }
  reset() {
    this.visible = false;
    this.selected = 0;
    this.timer = 0;
    this.purchases = {};
    this.onEnd = null;
  }

  bought(id) { return this.purchases[id] || 0; }

  show(metal, waveNext, onEnd) {
    this.visible = true;
    this.selected = 0;
    this.timer = SC.WAVE.SHOP_DELAY;
    this.onEnd = onEnd;
    this._metal = metal;
    this._waveNext = waveNext;
    const overlay = document.getElementById('crew-shop');
    overlay.style.display = 'flex';
    document.getElementById('sc-shop-metal').textContent = metal;
    document.getElementById('sc-shop-wave').textContent  = waveNext;
    this._renderItems();
    this._renderCountdown();
  }

  hide() {
    this.visible = false;
    const overlay = document.getElementById('crew-shop');
    overlay.style.display = 'none';
  }

  // Retourne l'effet applique : { id, success, metalSpent }
  tryBuy(metal) {
    const items = SC.SHOP.ITEMS;
    const item = items[this.selected];
    if (!item) return { success: false };
    const cur = this.bought(item.id);
    if (cur >= item.max) return { success: false, reason: 'max' };
    if (metal < item.price) return { success: false, reason: 'money' };
    this.purchases[item.id] = cur + 1;
    return { success: true, id: item.id, metalSpent: item.price };
  }

  // Appelle a chaque frame tant que visible
  update(dt, inputs) {
    if (!this.visible) return null;
    this.timer -= dt;
    this._renderCountdown();

    // Navigation (P1 A/D ou P2 flèches)
    const now = performance.now();
    const move = (dir) => {
      if (now - this._lastNavTime < 160) return;
      this._lastNavTime = now;
      const items = SC.SHOP.ITEMS;
      this.selected = (this.selected + dir + items.length) % items.length;
      this._renderItems();
    };
    if (inputs.p1.left  || inputs.p2.rotL) move(-1);
    if (inputs.p1.right || inputs.p2.rotR) move(+1);

    // Enter (P2)
    if (consumeScEnter()) {
      return { action: 'buy' };
    }
    // Echap (n'importe qui)
    if (consumeScEscape()) {
      return { action: 'skip' };
    }
    if (this.timer <= 0) {
      return { action: 'timeout' };
    }
    return null;
  }

  refresh(metal) {
    this._metal = metal;
    document.getElementById('sc-shop-metal').textContent = metal;
    this._renderItems();
  }

  _renderCountdown() {
    const el = document.getElementById('sc-shop-countdown');
    if (el) el.textContent = Math.max(0, Math.ceil(this.timer));
  }

  _renderItems() {
    const container = document.getElementById('sc-shop-items');
    if (!container) return;
    const items = SC.SHOP.ITEMS;
    container.innerHTML = items.map((it, i) => {
      const bought   = this.bought(it.id);
      const soldOut  = bought >= it.max;
      const afford   = (this._metal || 0) >= it.price;
      const classes  = ['sc-shop-item'];
      if (i === this.selected) classes.push('selected');
      if (soldOut) classes.push('sold-out');
      if (!afford && !soldOut) classes.push('unaffordable');
      const lvl = it.max > 1 ? ` <span style="color:#888">(${bought}/${it.max})</span>` : '';
      const priceText = soldOut ? 'EPUISE' : `${it.price} METAL`;
      return `<div class="${classes.join(' ')}" data-idx="${i}">
        <div class="sc-shop-item-name">${it.name}${lvl}</div>
        <div class="sc-shop-item-desc">${it.desc}</div>
        <div class="sc-shop-item-price">${priceText}</div>
      </div>`;
    }).join('');
    // Click aussi
    container.querySelectorAll('.sc-shop-item').forEach(node => {
      node.addEventListener('click', () => {
        this.selected = parseInt(node.dataset.idx, 10);
        this._renderItems();
      });
    });
  }
}
