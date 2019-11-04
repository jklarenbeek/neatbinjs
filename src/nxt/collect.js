const { openPublicStream } = require('./streams');

const CONFIG = {
  TRADE_QUEUE_SIZE: 42,
  BEST_QUEUE_SIZE: 42,
  DEPTH_QUEUE_SIZE: 42,
}

const ENDPOINT = {
  TRADE: 'trade',
  BESTBET: 'bookTicker',
  DIFFDEPTH: 'diffDepth100ms', 
}

class Queue {
  constructor(size, initValue = {}) {
    // init queue
    const queue = new Array(size);
    for (let i = 0; i < queue.length; ++i)
      queue[i] = initValue;
    this.queue = queue;

    // init queue pointers
    this.size = 0;
    this.idx = -1;
  }

  isBuffering() {
    return this.size < this.queue.length;
  }

  parseItem(item) {
    return item;
  }

  addItem(item) {
    const queue = this.queue;
    const idx = (this.idx + 1) % queue.length;
    const size = Math.min(
      (this.size + 1),
      queue.length);

    this.idx = idx;
    this.size = size;

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

const tradeFeeds = new Map();
const bestFeeds = new Map();
const depthFeeds = new Map();
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

function createPublicStreamCollector(options, callback) {

  const actions = {}
  actions[ENDPOINT.TRADE] = getTradeQueue;
  actions[ENDPOINT.BESTBET] = getBestQueue;
  actions[ENDPOINT.DIFFDEPTH] = getDepthQueue;

  return openPublicStream(
    { ...options, endpoints: Object.values(ENDPOINT) },
    function processPublicStream(err, json) {
      if (err) {
        callback(err, json);
        return;
      }

      const endpoint = json.endpoint;
      const getQueue = actions[endpoint];
      if (!getQueue) {
        callback('stream response error: unknown endpoint', json);
        return;
      }

      const symbol = json.symbol;
      const data = json.data;

      queue = getQueue(symbol)
      queue.addItem(data);

      callback(null, {
        endpoint,
        symbol,
        queue,
      });
});
}

module.exports = {
  ENDPOINT,
  createPublicStreamCollector,
}
