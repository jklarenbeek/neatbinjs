
class GamePair {
  constructor(pair, base, quote) {
    if (pair instanceof TradePair
      && base instanceof TradeAsset
      && qoute instanceof TradeAsset) {
      this.pair = pair;
      this.base = base;
      this.quote = quote;
    }
  }
}

class TheExchangeGame {
  constructor(exchange) {
    const assets = exchange.cloneAssets();
    this.assets = assets;
    this.pairs = new Map();
    for (const [symbol, pair] of exchange.pairs) {
      const baseAsset = assets.get(pair.baseAsset);
      const quoteAsset = assets.get(pair.quoteAsset);
      const gamepair = new GamePair(pair, baseAsset, quoteAsset);
      this.pairs.set(symbol, gamepair);
    }
  }
}

module.exports = TheExchangeGame;
