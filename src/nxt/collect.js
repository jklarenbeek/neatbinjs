const { openPublicStream } = require('./streams');

const CONFIG = {
  TRADE_ARRAY_SIZE: 42,
}

const ENDPOINT = {
  TRADE: 'trade',
  BOOKTICKER: 'bookTicker',
  DIFFDEPTH: 'diffDepth100ms', 
}

const OPTIONS = {
  symbols: 'BTCUSDT',
  endpoints: Object.values(ENDPOINTS),
  params: { level: 5 },
  ws: undefined,
};

//#region process trade feed
const tradeStats = {};
const tradeQueue = new Array(CONFIG.TRADE_ARRAY_SIZE);
let tradeIdx = tradeQueue.length - 1;

function peekTradeItem(idx = 0) {
  idx = (tradeIdx + idx) % CONFIG.TRADE_ARRAY_SIZE;
  if (idx < 0) idx = CONFIG.TRADE_ARRAY_SIZE + idx;
  return tradeQueue[idx];
}

function addTradeItem(trade) {
  const idx = (tradeIdx + 1) % CONFIG.TRADE_ARRAY_SIZE;
  tradeIdx = idx;
  tradeQueue[idx] = trade;
}

function processTradeFeed(json) {
  const trade = json.data;
  addTradeItem(trade);
}
//#endregion

//#region process book ticker feed
function processBookTickerFeed(json) {

}
//#endregion

//#region process depth diff feed
function processDiffDepthFeed(json) {

}
//#endregion

function createSinglePublicStream(symbols, callback) {
  return openPublicStream(
    {
      ...OPTIONS,
      symbols
    },
    function processPublicStream(err, json) {
      if (!err) {
        let res;
        switch (json.endpoint) {
          case ENDPOINT.TRADE:
            res = processTradeFeed(json);
            break;
          case ENDPOINT.BOOKTICKER:
            res = processBookTickerFeed(json);
            break;
          case ENDPOINT.DIFFDEPTH:
            res = processDiffDepthFeed(json);
            break;
          default:
            callback('unknown endpoint response', json.endpoint);
            return;
        }
        callback(null, res)
      }
      callback(err, json);
    });
}

module.exports = {
  createPublicStream: createSinglePublicStream,
}
