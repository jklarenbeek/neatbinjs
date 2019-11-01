
const publicStreamTypes = {
  aggTrades: class aggTrades {
    // Event type
    get eventType() { return this.e; }
    // Event time
    get eventTime() { return this.E; }
    // Symbol
    get symbol() { return this.s; }
    // Trade ID
    get aggTradeId() { return this.t; }
    // Trade Time
    get tradeTime() { return this.T; }
    // Price
    get price() { return this.p; }
    // quantity
    get quantity() { return this.q; }
    // first trade ID
    get firstTradeId() { return this.f; }
    // last trade ID
    get lastTradeId() { return this.l; }
    // Is the buyer the market maker?
    get isBuyerMarketMaker() { return this.m }
    // Ignore
    get __ignore__() { return this.M; }
  },
  trade: class trade {
    // Event type
    get eventType() { return this.e; }
    // Event time
    get eventTime() { return this.E; }
    // Symbol
    get symbol() { return this.s; }
    // Trade ID
    get tradeId() { return this.t; }
    // Trade Time
    get tradeTime() { return this.T; }
    // Price
    get price() { return this.p; }
    // quantity
    get quantity() { return this.q; }
    // Buyer order ID
    get buyerOrderId() { return this.b; }
    // Seller order ID
    get sellerOrderID() { return this.a; }
    // Is the buyer the market maker?
    get isBuyerMarketMaker() { return this.m }
    // Ignore
    get __ignore__() { return this.M; }
  },
  depthUpdate: class depthUpdate {
    // Event type
    get eventType() { return this.e; }
    // Event time
    get eventTime() { return this.E; }
    // Symbol
    get symbol() { return this.s; }
    // First update ID in event
    get startUpdateId() { return this.U; }
    // Final update ID in event
    get lastUpdateId() { return this.u; }
    // Bids to be updated
    get bids() { return this.b; }
    // Asks to be updated
    get asks() { return this.a; }
    // foreach asks or bids entry contains [ price, qty ]
  },
  bookTicker: class bookTicker {
    // order book updateId
    get lastUpdateId() { return this.u; }
    // symbol
    get symbol() { return this.s; }
    // best bid price
    get bestBidPrice() { return this.b; }
    // best bid qty
    get bestBidQty() { return this.B; }
    // best ask price
    get bestAskPrice() { return this.a; }
    // best ask qty
    get bestAskQty() { return this.A; }
  },
  partialDepth: class partialDepth {
    // Last update ID
    // get lastUpdateId() { return this.lastUpdateId; }
    // Bids to be updated
    // get bids() { return this.bids; }
    // Asks to be updated
    // get asks() { return this.asks; }
  }
}

module.exports = {
  publicStreamTypes,
}
