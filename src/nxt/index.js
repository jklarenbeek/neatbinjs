

const { ENDPOINT, createPublicStreamCollector } = require('./collect');

const OPTIONS = {
  symbols: 'BTCUSDT',
  params: { level: 5 },
  ws: undefined,
};

function fixPrecision(number) {
  return Number(number.toFixed(8));
}

function calcTradeStats(queue) /* : Object */ {
  // fetch first and last items
  const current = queue.getItem();
  const first = queue.getItem(1);
  const size = queue.size;

  // get event times
  const closeTime = current.tradeTime; // * Number.EPSILON;
  const openTime = (first.tradeTime || closeTime); // * Number.EPSILON;

  // get price and quantity
  let sumPrice = Number(current.price);
  let sumQty = Number(current.quantity);
  let sumVol = sumPrice * sumQty;

  // calculate volume of cache
  for (let i = 1; i < size; ++i) {
    const item = queue.getItem(i);
    const price = Number(item.price);
    const qty = Number(item.quantity);
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
    closePrice: current.price,
    closeQuantity: current.quantity,

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


function calcBestStats(queue) /* : Object */ {
  const current = queue.getItem(0);
  const first = queue.getItem(1);

  return {
    lastUpdateId: current.lastUpdateId,
    bestAskPrice: Number(current.bestAskPrice),
    bestAskQty: Number(current.bestAskQty),
    bestBidPrice: Number(current.bestBidPrice),
    bestBidQty: Number(current.bestBidQty),
    spread: fixPrecision(
      Number(current.bestAskPrice) - Number(current.bestBidPrice)
    ),
  };
}

const currentAsks = new Map();
const currentBids = new Map();

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
      target.delete(price);
    else {
      target.set(price, quantity);
      result.set(price, quantity);
    }
  }

  return result;
}

function calcDepthVolume(depth) /* : Object */ {
  // get price and quantity
  let sumPrice = 0;
  let sumQty = 0;
  let sumVol = 0;

  // calculate volume
  for (const [price , quantity] of depth) {
    const p = Number(price);
    const q = Number(quantity);
    sumPrice += p;
    sumQty += q;
    sumVol += (p * q);
  }

  const size = depth.size;

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

const connection = createPublicStreamCollector(OPTIONS, function (err, json) {
  if (err == null) {
    const endpoint = json.endpoint;
    const symbol = json.symbol;
    let stats;
    switch (endpoint) {
      case ENDPOINT.TRADE: {
        stats = calcTradeStats(json.queue);
        break;
      }
      case ENDPOINT.BESTBET: {
        stats = calcBestStats(json.queue);
        break;
      }
      case ENDPOINT.DIFFDEPTH: {
        const asks = getCurrentAsks(symbol);
        const bids = getCurrentBids(symbol);
        stats = calcDepthStats(json.queue, asks, bids);
        break;
      }
    }
    console.log('message =>', { ...json, stats});
  }
  else if (typeof err === 'string')
    console.info(err, json);
  else
    console.error(err, json);
});

