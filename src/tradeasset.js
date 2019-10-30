class TradeAsset {
  constructor(base, available, inorder) {
    this.base = base;
    this.available = available;
    this.inorder = inorder;
  }

  clone() {
    return new TradeAsset(this.base, this.available, this.inorder);
  }
}

module.exports = TradeAsset;
