

const { ENDPOINT, createPublicStreamCollector } = require('./collect');

const OPTIONS = {
  symbols: 'BTCUSDT',
  params: { level: 5 },
  ws: undefined,
};

function fixPrecision(number, count = 8) {
  return Number(number.toFixed(count));
}

const CONST_24H_INMS = 1000 * 60 * 60 * 24;
const CONST_24H_UNIT = (2 * Math.PI) / CONST_24H_INMS;

function convertDateToRad24H(date) {
  return +((date % CONST_24H_INMS) * CONST_24H_UNIT) - Math.PI;
}
function normalize24H(date) {
  return +((Math.sin(convertDateToRad24H(date)) + 1.0) / 2.0);
}

function calcTradeStats(queue /* Queue<Trade> */) /* : Object */ {
  // fetch first and last items
  const current = queue.getItem();
  const first = queue.getItem(1);
  const size = queue.size;

  // get event times
  const closeTime = current.tradeTime;
  const openTime = (first.tradeTime || closeTime);

  // get price groups
  let lowPrice = Number(current.price);
  let highPrice = lowPrice;
  let sumPrice = lowPrice;

  // get quantity groups
  let lowQty = Number(current.quantity);
  let highQty = lowQty;
  let sumQty = lowQty;

  // calculate volume of cache
  for (let i = 1; i < size; ++i) {
    const item = queue.getItem(i);
    const price = Number(item.price);
    const qty = Number(item.quantity);

    lowPrice = Math.min(lowPrice, price);
    highPrice = Math.max(highPrice, price);
    sumPrice += price;

    lowQty = Math.min(lowQty, qty);
    highQty = Math.max(highQty, qty);
    sumQty += qty;
  }

  // create and fill trade object
  return {
    eventTime: current.eventTime,

    firstTradeId: first.tradeId,
    lastTradeId: current.tradeId,
  
    // calculate and set trade interval
    openTime: openTime,
    closeTime: closeTime,

    // set price groups
    openPrice: Number(first.price),
    closePrice: Number(current.price),
    closeQty: Number(current.quantity),

    lowPrice: lowPrice,
    highPrice: highPrice,
    sumPrice: sumPrice,

    // set quantity groups
    lowQty: lowQty,
    highQty: highQty,
    sumQty: sumQty,

    // divider
    count: size,
  }
}

function calcBestStats(queue /* Queue<BookTicker> */) /* : Object */ {
  const current = queue.getItem(0);
  const first = queue.getItem(1);
  const size = queue.size;

  let lowAskPrice = Number(current.bestAskPrice);
  let highAskPrice = lowAskPrice;
  let sumAskPrice = lowAskPrice;
  let sumAskQty = Number(current.bestAskQty);

  let lowBidPrice = Number(current.bestBidPrice);
  let highBidPrice = lowBidPrice;
  let sumBidPrice = lowBidPrice;
  let sumBidQty = Number(current.bestBidQty);

  let lowSpread = Number(current.bestAskPrice) - Number(current.bestBidPrice);
  let highSpread = lowSpread;
  let sumSpread = lowSpread;

  for (let i = 1; i < size; ++i) {
    const item = queue.getItem(i);
    const ap = Number(item.bestAskPrice);
    const aq = Number(item.bestAskQty);
    const bp = Number(item.bestBidPrice);
    const bq = Number(item.bestBidQty);

    lowAskPrice = Math.min(lowAskPrice, ap);
    highAskPrice = Math.max(highAskPrice, ap);
    sumAskPrice += ap;
    sumAskQty += aq;

    lowBidPrice = Math.min(lowBidPrice, bp);
    highBidPrice = Math.max(highBidPrice, bp);
    sumBidPrice += bp;
    sumBidQty += bq;
  }

  return {
    firstUpdateId: first.lastUpdateId,
    lastUpdateId: current.lastUpdateId,

    bestAskPrice: Number(current.bestAskPrice),
    bestAskQty: Number(current.bestAskQty),

    bestBidPrice: Number(current.bestBidPrice),
    bestBidQty: Number(current.bestBidQty),

    lowAskPrice: lowAskPrice,
    highAskPrice: highAskPrice,
    sumAskPrice: sumAskPrice,
    sumAskQty: sumAskQty,

    lowBidPrice: lowBidPrice,
    highBidPrice: highBidPrice,
    sumBidPrice: sumBidPrice,
    sumBidQty: sumBidQty,
    
    bestSpread: fixPrecision(
      Number(current.bestAskPrice) - Number(current.bestBidPrice)
    ),

    // divider
    count: size,
  };
}

const currentAsks = new Map();
const currentBids = new Map();

function getCurrentAsks(symbol /* : String */) /* : Map<float, float> */ {
  if (currentAsks.has(symbol))
    return currentAsks.get(symbol);
  // create a new depth map
  const depth = new Map();
  currentAsks.set(symbol, depth);
  return depth;
}

function getCurrentBids(symbol /* : String */) /* : Map<float, float> */ {
  if (currentBids.has(symbol))
    return currentBids.get(symbol);
  // create a new depth map
  const depth = new Map();
  currentBids.set(symbol, depth);
  return depth;
}

function updateDepthTarget(
  target /* : Map<float, float> */,
  source /* : Map<float, float> */) /* : Map<float, float> */ {
  const result = new Map();

  for (const [ p, q ] of source) {
    const price = Number(p);
    const quantity = Number(q);
    if (quantity === 0)
      target.delete(price);
    else {
      target.set(price, quantity);
      result.set(price, quantity);
    }
  }

  return result;
}

function calcDepthVolume(depth /* : Map<float, float> */ ) /* : Object */ {
  // get price and quantity
  let lowPrice = Number.MAX_VALUE;
  let highPrice = +0.0;
  let sumPrice = +0.0;
  let sumQty = +0.0;

  // calculate volume
  for (const [price , quantity] of depth) {
    const p = Number(price);
    const q = Number(quantity);
    lowPrice = Math.min(lowPrice, p);
    highPrice = Math.max(highPrice, p);
    sumPrice += p;
    sumQty += q;
  }

  const size = depth.size;

  return {
    lowPrice: lowPrice,
    highPrice: highPrice,
    sumPrice: sumPrice,
    sumQty: sumQty,
    count: size,
  }
}

function calcDepthStats(
  queue /* : Queue<DepthUpdate> */,
  asks /* : Map<float, float> */,
  bids /* : Map<float, float> */) /* : Object */ {
  const current = queue.getItem();

  updateDepthTarget(asks, current.asks);
  updateDepthTarget(bids, current.bids);

  const askStat = calcDepthVolume(asks);
  const bidStat = calcDepthVolume(bids);

  return {
    eventTime: current.eventTime,
    startUpdateId: current.startUpdateId,
    lastUpdateId: current.lastUpdateId,
    askStat,
    bidStat,
    asks: current.asks,
    bids: current.bids,
  }
}

function createPublicStreamProcessor(options, callback) {
  let lastLocalTime = +(new Date());
  let lastEventTime = lastLocalTime;
  let lastTradeTime = lastLocalTime;
  
  return createPublicStreamCollector(options, function (err, json) {
    if (err) {
      callback(err, json);
      return;
    }

    const endpoint = json.endpoint;
    const symbol = json.symbol;

    let stats;
    switch (endpoint) {
      case ENDPOINT.TRADE: {
        stats = calcTradeStats(json.queue);
        lastLocalTime = +(new Date());
        lastEventTime = stats.eventTime;
        lastTradeTime = stats.closeTime;
        break;
      }
      case ENDPOINT.BESTBET: {
        stats = calcBestStats(json.queue);
        const l = +(new Date());
        const d = lastLocalTime - lastEventTime;
        lastLocalTime = l;
        lastEventTime = +(l + d);
        break;
      }
      case ENDPOINT.DIFFDEPTH: {
        const asks = getCurrentAsks(symbol);
        const bids = getCurrentBids(symbol);
        stats = calcDepthStats(json.queue, asks, bids);
        lastLocalTime = +(new Date());
        lastEventTime = stats.eventTime;
        break;
      }
    }
    callback(null, {
      ...json,
      
      lastEventTime: lastEventTime,
      lastTradeTime: lastTradeTime,

      stats,
    });
  });
}

module.exports = {
  createPublicStreamProcessor,
}
