class AggTradesResponse {
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
}

class TradeResponse {
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
}

class BookTickerResponse {
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
}

class PartialDepthResponse {
  // Last update ID
  // get lastUpdateId() { return this.lastUpdateId; }
  // Bids to be updated
  // get bids() { return this.bids; }
  // Asks to be updated
  // get asks() { return this.asks; }
}

class DepthUpdateResponse {
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
}

const publicStreams = {
  baseSingle: 'wss://stream.binance.com:9443/ws/',
  baseCombine: 'wss://stream.binance.com:9443/stream?streams=',
  endpoints: {
    aggTrade: {
      path: '${symbol}@aggTrade',
      params: { symbol: String },
      interval: 0,
      response: AggTradesResponse,
    },
    trade: {
      path: '${symbol}@trade',
      params: { symbol: String },
      interval: 0,
      response: TradeResponse,
    },
    klines2s: {
      path: '${symbol}@kline_${interval}',
      params: {
        symbol: String,
        interval: ['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '8h', '12h', '1d', '3d', '1w', '1M'],
      },
      interval: 2000,
      example: {
        'e': 'kline',     // Event type
        'E': 123456789,   // Event time
        's': 'BNBBTC',    // Symbol
        'k': {
          't': 123400000, // Kline start time
          'T': 123460000, // Kline close time
          's': 'BNBBTC',  // Symbol
          'i': '1m',      // Interval
          'f': 100,       // First trade ID
          'L': 200,       // Last trade ID
          'o': '0.0010',  // Open price
          'c': '0.0020',  // Close price
          'h': '0.0025',  // High price
          'l': '0.0015',  // Low price
          'v': '1000',    // Base asset volume
          'n': 100,       // Number of trades
          'x': false,     // Is this kline closed?
          'q': '1.0000',  // Quote asset volume
          'V': '500',     // Taker buy base asset volume
          'Q': '0.500',   // Taker buy quote asset volume
          'B': '123456'   // Ignore
        }
      }
    },
    miniTicker1s: {
      path: '${symbol}@miniTicker',
      params: { symbol: String },
      interval: 1000,
      example: {
        'e': '24hrMiniTicker',  // Event type
        'E': 123456789,         // Event time
        's': 'BNBBTC',          // Symbol
        'c': '0.0025',          // Close price
        'o': '0.0010',          // Open price
        'h': '0.0025',          // High price
        'l': '0.0010',          // Low price
        'v': '10000',           // Total traded base asset volume
        'q': '18'               // Total traded quote asset volume
      }
    },
    miniTicker1sAll: {
      path: '!miniTicker@arr',
      interval: 1000,
      example: 'binanceConfig.streams.endpoints.miniTicker.example',
    },
    ticker1s: {
      path: '${symbol}@ticker',
      params: { symbol: String },
      interval: 1000,
      example: {
        'e': '24hrTicker',  // Event type
        'E': 123456789,     // Event time
        's': 'BNBBTC',      // Symbol
        'p': '0.0015',      // Price change
        'P': '250.00',      // Price change percent
        'w': '0.0018',      // Weighted average price
        'x': '0.0009',      // First trade(F)-1 price (first trade before the 24hr rolling window)
        'c': '0.0025',      // Last price
        'Q': '10',          // Last quantity
        'b': '0.0024',      // Best bid price
        'B': '10',          // Best bid quantity
        'a': '0.0026',      // Best ask price
        'A': '100',         // Best ask quantity
        'o': '0.0010',      // Open price
        'h': '0.0025',      // High price
        'l': '0.0010',      // Low price
        'v': '10000',       // Total traded base asset volume
        'q': '18',          // Total traded quote asset volume
        'O': 0,             // Statistics open time
        'C': 86400000,      // Statistics close time
        'F': 0,             // First trade ID
        'L': 18150,         // Last trade Id
        'n': 18151          // Total number of trades
      }
    },
    ticker1sAll: {
      path: '!ticker@arr',
      interval: 1000,
      example: 'binanceConfig.streams.endpoints.ticker.example',
    },
    bookTicker: {
      path: '${symbol}@bookTicker',
      params: { symbol: String },
      interval: 0,
      response: BookTickerResponse,
    },
    bookTickerAll: {
      path: '!bookTicker',
      interval: 0,
      response: { items: { $ref: BookTickerResponse } },
    },
    partialDepth1s: {
      path: '${symbol}@depth${level}',
      params: {
        symbol: String,
        level: [5, 10, 20],
      },
      interval: 1000,
      response: PartialDepthResponse,
    },
    partialDepth100ms: {
      path: '${symbol}@depth${level}@100ms',
      params: {
        symbol: String,
        level: [5, 10, 20],
      },
      interval: 100,
      response: { items: { $ref: PartialDepthResponse } },
    },
    diffDepth1s: {
      path: '${symbol}@depth',
      //path: '${symbol}@depth${interval}',
      params: {
        symbol: String,
        //interval: { enum: [null, 100], template: '${interval}ms' }
      },
      interval: 1000,
      response: DepthUpdateResponse,
    },
    diffDepth100ms: {
      path: '${symbol}@depth@100ms',
      params: { symbol: String },
      response: DepthUpdateResponse,
    }
  },
};


module.exports = Object.freeze({
  publicStreams,
});