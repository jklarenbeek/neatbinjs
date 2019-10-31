
const publicStreams = {
  singleUri: 'wss://stream.binance.com:9443/ws/',
  combineUri: 'wss://stream.binance.com:9443/stream?streams=',
  endpoints: {
    aggTrade: {
      path: '${symbol}@aggTrade',
      params: { symbol: String },
      interval: 0,
      example: {
        'e': 'aggTrade',  // Event type
        'E': 123456789,   // Event time
        's': 'BNBBTC',    // Symbol
        'a': 12345,       // Aggregate trade ID
        'p': '0.001',     // Price
        'q': '100',       // Quantity
        'f': 100,         // First trade ID
        'l': 105,         // Last trade ID
        'T': 123456785,   // Trade time
        'm': true,        // Is the buyer the market maker?
        'M': true         // Ignore
      }
    },
    trade: {
      path: '${symbol}@trade',
      params: { symbol: String },
      interval: 0,
      example: {
        'e': 'trade',     // Event type
        'E': 123456789,   // Event time
        's': 'BNBBTC',    // Symbol
        't': 12345,       // Trade ID
        'p': '0.001',     // Price
        'q': '100',       // Quantity
        'b': 88,          // Buyer order ID
        'a': 50,          // Seller order ID
        'T': 123456785,   // Trade time
        'm': true,        // Is the buyer the market maker?
        'M': true         // Ignore
      }
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
      example: {
        'u': 400900217,     // order book updateId
        's': 'BNBUSDT',     // symbol
        'b': '25.35190000', // best bid price
        'B': '31.21000000', // best bid qty
        'a': '25.36520000', // best ask price
        'A': '40.66000000'  // best ask qty
      }
    },
    bookTickerAll: {
      path: '!bookTicker',
      interval: 0,
      example: 'binanceConfig.streams.endpoints.bookTicker.example'
    },
    partialDepth1s: {
      path: '${symbol}@depth${level}',
      params: {
        symbol: String,
        level: [5, 10, 20],
      },
      interval: 1000,
      example: {
        'lastUpdateId': 160,  // Last update ID
        'bids': [             // Bids to be updated
          [
            '0.0024',         // Price level to be updated
            '10'              // Quantity
          ]
        ],
        'asks': [             // Asks to be updated
          [
            '0.0026',         // Price level to be updated
            '100'            // Quantity
          ]
        ]
      }
    },
    partialDepth100ms: {
      path: '${symbol}@depth${level}@100ms',
      params: {
        symbol: String,
        level: [5, 10, 20],
      },
      interval: 100,
      level: [5, 10, 20],
      example: 'binanceConfig.streams.endpoints.partialDepth1s.example',
    },
    diffDepth1s: {
      path: '${symbol}@depth',
      params: { symbol: String },
      interval: 1000,
      example: {
        'e': 'depthUpdate', // Event type
        'E': 123456789,     // Event time
        's': 'BNBBTC',      // Symbol
        'U': 157,           // First update ID in event
        'u': 160,           // Final update ID in event
        'b': [              // Bids to be updated
          [
            '0.0024',       // Price level to be updated
            '10'            // Quantity
          ]
        ],
        'a': [              // Asks to be updated
          [
            '0.0026',       // Price level to be updated
            '100'           // Quantity
          ]
        ]
      }
    },
    diffDepth100ms: {
      path: '${symbol}@depth@100ms',
      params: { symbol: String },
      example: 'binanceConfig.streams.endpoints.diffDepth1s.example',
    }
  },
};


module.exports = Object.freeze({
  publicStreams,
});