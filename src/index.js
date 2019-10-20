const Binance = require('binance-api-node').default
const blessed = require('blessed');
const contrib = require('blessed-contrib');

const tradeConfig = {
  MAX_TRADES_SIZE: 42,
}

class TradePair {

  constructor(exchange, json) {
    this.exchange = exchange;
    this.client = exchange.client;
    this.json = json;
  
    this.trades = new Array(tradeConfig.MAX_TRADES_SIZE);
    this.tradeIdx = -1;

    this.asks = new Map();
    this.bids = new Map();

    this.clean = {};
  }

  peekLastTrade() {
    return this.trandeIdx === -1
      ? undefined
      : this.trades[this.tradeIdx];
  }
  addTrade(trade) {
    this.tradeIdx = (this.tradeIdx + 1) % tradeConfig.MAX_TRADES_SIZE;
    this.trades[this.tradeIdx];
  }
}

class BinanceExchange {
  constructor(client) {
    this.client = client;

    this.timezone = '';
    this.serverTime = 0;

    this.rateLimits = [];

    this.assets = new Map();
    this.pairs = new Map();
    this.fees = new Map();

    this.clean = {};
  }

  addWallet(base, available = 0.0, locked = 0.0) {
    if (base == null || base === '' || base.constructor !== String)
      return null;

    const asset = { base, available, locked };
    this.assets.set(base, asset);
    return asset;
  }

  fetchTradePairs() {
    const self = this;
    const exchangeInfo = self.client.exchangeInfo;
    return exchangeInfo().then(function (info) {
      // save time
      self.timezone = info.timezone;
      self.serverTime = info.serverTime;

      // save rateLimits
      self.rateLimits = info.rateLimits;

      // add trading pairs that are trading
      self.pairs.clear();
      const symbols = info.symbols;
      const len = symbols.length;
      for (let i = 0; i < len; ++i) {
        const json = symbols[i];
        if (json == null) continue;
        if (json.status !== 'TRADING') continue;
        if (!self.assets.has(json.baseAsset)) continue;
        if (!self.assets.has(json.quoteAsset)) continue;
          
        self.pairs.set(json.symbol, new TradePair(self, json));
      }
      return info;
    });
  }

  fetchTradeFees() {
    const self = this;
    const tradeFees = self.client.tradeFee;
    return tradeFees().then(function (fees) {
      const len = fees.length;
      for (let i = 0; i < len; ++i) {
        const fee = fees[i];
        if (fee == null) continue;
        if (!self.hasTradePair(fee.symbol)) continue;
        self.fees.set(fee.symbol, fee);
      }
      return fees;
    });
  }

  startAggTrades(callback) {
    const self = this;
    const clean = self.clean['aggTrade'];
    if (clean) clean();
  
    const pairs = self.pairs;
    const symbols = Array.from(pairs.keys());
  
    self.clean['aggTrade'] = self.client.ws.trades(
      symbols,
      trade => {
        const symbol = trade.symbol;
        const pair = pairs.get(symbol);
        pair.addTrade(trade);
        callback(trade);
      },
    );
  }
  
  stopAggTrades() {
    const clean = this.clean['aggTrade'];
    if (clean) {
      delete this.clean['aggTrade'];
      clean();
    }
  }

}

const client = Binance();

const market = new BinanceExchange(client);

market.addWallet('BNB', 0.91386066);
market.addWallet('USDT', 2.02662874);
market.addWallet('BTC', 0.01581497);
//market.addWallet('ETH', 0.36084826);
//market.addWallet('LTC', 0.00502228);
//market.addWallet('DOGE', 0.0);
//market.addWallet('XMR', 1.09400000);
//market.addWallet('BCHABC', 0.19500000);
//market.addWallet('IOTA', 153.00000000);
//market.addWallet('EOS', 13.23000000);
//market.addWallet('TRX', 2,334.00000000);
//market.addWallet('BAT', 147.00000000);
//market.addWallet('XLM', 503.68777041);
//market.addWallet('ADA', 752.00000000);
//market.addWallet('BTT', 67669.07797300);
//market.addWallet('BTS', 1017.00000000);
//market.addWallet('STEEM', 134.55000000);

// Create a screen object.
screen = blessed.screen({
  smartCSR: true,
  log: process.env.HOME + '/blessed-terminal.log',
  fullUnicode: true,
  dockBorders: true,
  ignoreDockContrast: true
});

// Quit on Escape, q, or Control-C.
screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});


lineControl1 = contrib.line({
  showNthLabel: 5,
  maxY: 8000,
  minY: 7900,
  label: 'Total Transactions',
  showLegend: true,
  legend: { width: 10 }
});
screen.append(lineControl1);

const lineData = new Map();
market.fetchTradePairs(m => {
  console.log('Count Pairs: ', m.pairs.size);
  const colors = ['red', 'blue', 'yellow', 'green'];

  //console.log(m.pairs)
  for (const [ symbol, pair ] of m.pairs) {
    const data = {
      title: symbol,
      style: { line: colors.pop() },
      x: [],
      y: [],
    }
    lineData.set(symbol, data);
  }

  market.startAggTrades(c => {
    //console.log(c);
  });
  run();
});

function run() {
  setInterval(function () {
    for (const [ symbol, data ] of market.pairs) {
      const pair = market.pairs.get(symbol);
      const line = lineData.get(symbol);
      const xdata = [];
      const ydata = [];
      for (const [tradeId, trade] of pair.trades) {
        xdata[xdata.length] = trade.eventTime;
        ydata[ydata.length] = trade.price;
      }
      line.x = xdata;
      line.y = ydata;
    }
    //console.log(lineData);

    lineControl1.setData(Array.from(lineData.values()));

    screen.render();

  }, 1000);
}