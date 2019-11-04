const { openPublicStream } = require('./streams');

const CONFIG = {
  TRADE_QUEUE_SIZE: 42,
  BEST_QUEUE_SIZE: 42,
  DEPTH_QUEUE_SIZE: 42,
}

const ENDPOINT = {
  TRADE: 'trade',
  BOOKTICKER: 'bookTicker',
  DIFFDEPTH: 'diffDepth100ms', 
}

const OPTIONS = {
  symbols: 'BTCUSDT',
  endpoints: Object.values(ENDPOINT),
  params: { level: 5 },
  ws: undefined,
};

class Queue {
  constructor(size, initValue = {}) {
    // init queue
    const queue = new Array(size);
    for (let i = 0; i < queue.length; ++i)
      queue[i] = initValue;
    this.queue = queue;

    // init queue pointers
    this.size = 0;
    this.idx = 0;
  }

  isBuffering() {
    return this.size < this.queue.length;
  }

  parseItem(item) {
    return item;
  }

  addItem(item) {
    const idx = (this.idx + 1) % queue.length;
    const size = Math.min(
      (this.size + 1),
      queue.length);

    this.idx = idx;
    this.size = size;

    const queue = this.queue;
    queue[idx] = this.parseItem(item);
  }

  calcIndex(offset = 0) {
    if (Number.isNaN(offset))
      return 0;
    
    offset = (this.idx + offset) % this.size;
    return offset < 0
      ? this.size + offset
      : offset;
  }

  getItem(offset) {
    return this.queue[this.calcIndex(offset)];
  }

}

//#region trade feeds
const tradeFeeds = new Map();

function getTradeQueue(symbol) /* : Queue */ {
  if (tradeFeeds.has(symbol))
    return tradeFeeds.get(symbol);
  // create a new trade queue
  const queue = new Queue(
    CONFIG.TRADE_QUEUE_SIZE,
    {}
  );
  tradeFeeds.set(symbol, queue);
  return queue;
}

function calcTradeStats(queue) /* : Object */ {
  // fetch first and last items
  const current = queue.getItem();
  const first = queue.getItem(1);
  const size = queue.size;

  // get event times
  const closeTime = current.tradeTime;
  const openTime = first.tradeTime || closeTime;

  // get price and quantity
  let sumPrice = Number(current.price);
  let sumQty = Number(current.quantity);
  let sumVol = sumPrice * sumQty;

  // calculate volume of cache
  for (let i = 1; i < size; ++i) {
    const item = queue.getItem(i);
    const price = item.price;
    const qty = item.quantity;
    sumPrice += price;
    sumQty += qty;
    sumVol += (price * qty);
  }

  // create and fill trade object
  return {
    firstTradeId: first.tradeId,
    lastTradeId: current.tradeId,
  
    // calculate and set trade interval
    openTime: openTime,
    closeTime: closeTime,
    avgTradeTime: (closeTime - openTime) / size,

    // set open and close prices 
    openPrice: first.price,
    price: current.price,
    quantity: current.quantity,

    // add sums to stats
    sumQty: sumQty,
    sumVol: sumVol,

    // calculate averages
    avgPrice: sumPrice / size,
    avgQty: sumQty / size,
    avgVol: sumVol / size,
    avgUnit: sumPrice / sumQty,
  }
}

function handleTradeEndPoint(symbol, data, callback) {
  const queue = getTradeQueue(symbol)
  queue.addItem(data);

  const stats = calcTradeStats(queue);
  callback(null, stats);
}

//#endregion

//#region best price feeds
const bestFeeds = new Map();

function getBestQueue(symbol) /* : Queue */ {
  if (bestFeeds.has(symbol))
    return bestFeeds.get(symbol);
  // create a new best price queue  
  const queue = new Queue(
    CONFIG.BEST_QUEUE_SIZE,
    {}
  );
  
  bestFeeds.set(symbol, queue);
  return queue;
}

function calcBestStats(queue) /* : Object */ {
  const current = queue.getItem(0);
  const first = queue.getItem(1);

  return {
    bestAskPrice: current.bestAskPrice,
    bestAskQty: current.bestAskQty,
    bestBidPrice: current.bestBidPrice,
    bestBidQty: current.bestBidQty,
    spread: bestAskPrice - bestBidPrice,
  };
}

function handleBestEndPoint(symbol, data, callback) {
  const queue = getBestQueue(symbol);
  // const item = parseBestItem(json.data);
  queue.addItem(data);

  const stats = calcBestStats(queue);
  callback(null, stats);
}

//#endregion

//#region depth feeds
const depthFeeds = new Map();
const currentAsks = new Map();
const currentBids = new Map();

function getDepthQueue(symbol) /* : Queue */ {
  if (depthFeeds.has(symbol))
    return depthFeeds.get(symbol);
  // create a new diff depth queue
  const queue = new Queue(
    CONFIG.DEPTH_QUEUE_SIZE,
    {}
  );

  depthFeeds.set(symbol, queue);
  return queue;
}

function getCurrentAsks(symbol) /* : Map<float, float> */ {
  if (currentAsks.has(symbol))
    return currentAsks.get(symbol);
  // create a new depth map
  const depth = new Map();
  currentAsks.set(symbol, depth);
  return depth;
}

function getCurrentBids(symbol) /* : Map<float, float> */ {
  if (currentBids.has(symbol))
    return currentBids.get(symbol);
  // create a new depth map
  const depth = new Map();
  currentBids.set(symbol, depth);
  return depth;
}

function updateDepthTarget(target, source) /* : Map<float, float> */ {
  const result = new Map();

  for (const [ p, q ] of source) {
    const price = Number(p);
    const quantity = Number(q);
    if (quantity === 0)
      target.remove(price);
    else {
      target.set(price, quantity);
      result.set(price, quantity);
    }
  }

  return result;
}

function calcDepthVolume(depth) {
  // get price and quantity
  let sumPrice = 0;
  let sumQty = 0;
  let sumVol = 0;

  // calculate volume
  const size = depth.length;
  for (let i = 0; i < size; ++i) {
    const item = depth[i];
    const price = Number(item[0]);
    const qty = Number(item[1]);
    sumPrice += price;
    sumQty += qty;
    sumVol += (price * qty);
  }

  return {
    // add sums to stats
    sumQty: sumQty,
    sumVol: sumVol,

    // calculate averages
    avgPrice: sumPrice / size,
    avgQty: sumQty / size,
    avgVol: sumVol / size,
    avgUnit: sumPrice / sumQty,
  }
}

function calcDepthStats(queue, asks, bids) /* : Object */ {
  const current = queue.getItem();

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

function handleDepthEndPoint(symbol, data, callback) {
  const queue = getDepthQueue(symbol);
  const asks = getCurrentAsks(symbol);
  const bids = getCurrentBids(symbol);

  // const item = parseDepthItem(data);
  updateDepthTarget(asks, data.asks);
  updateDepthTarget(bids, data.bids);
  queue.addItem(data);

  const stats = calcDepthStats(queue, asks, bids);
  callback(null, stats);
}

//#endregion

function createPublicStreamCollector(symbols, callback) {
  if (typeof symbols !== 'string')
    throw new Error('not implemented');
  
  return openPublicStream(
    { ...OPTIONS, symbols },
    function processPublicStream(err, json) {
      if (!err) {
        callback(err, json);
        return;
      }

      const symbol = json.symbol;
      switch (json.endpoint) {
        case ENDPOINT.TRADE:
          handleTradeEndPoint(symbol, json.data, callback);
        case ENDPOINT.BOOKTICKER:
          handleBestEndPoint(symbol, json.data, callback);
        case ENDPOINT.DIFFDEPTH:
          handleDepthEndPoint(symbol, json.data, callback);
        default:
          callback('unknown response endpoint', json.endpoint);
      }
    });
}

module.exports = {
  createPublicStreamCollector,
}
