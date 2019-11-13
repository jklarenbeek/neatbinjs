

// const { ENDPOINT } = require('./collect');
const { createPublicStreamProcessor } = require('./process');

const OPTIONS = {
  symbols: 'BTCUSDT',
  params: { level: 5 },
  ws: undefined,
};

const connection = createPublicStreamProcessor(OPTIONS, function (err, json) {
  if (err == null) {
    console.log('message =>', json);
  }
  else if (typeof err === 'string')
    console.info(err, json);
  else
    console.error(err, json);
});

