

const { createPublicStream } = require('./streams');

const streamInfo = {
  symbols: 'BTCUSDT',
  endpoints: ['trade', 'bookTicker', 'partialDepth1s'],
  params: { level: 5 },
  ws: undefined,
};

const connection = createPublicStream(streamInfo, function (err, event) {
  if (err == null) {
    console.log(event.data);
  }
  else if (typeof err === 'string') {
    console.info(err, event);
  }
  else {
    console.error(err, event);
  }
});

