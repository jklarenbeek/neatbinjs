const { createPublicStream } = require('./streams');

const streamInfo = {
  symbols: 'BTCUSDT',
  endpoints: ['trade', 'bookTicker', 'diffDepth100ms'],
  params: { level: 5 },
  ws: undefined,
};

function startCollecting(symbols, callback) {
  return createPublicStream({ ...streamInfo, symbols }, callback);
}

module.exports = {
  startCollecting,
}
