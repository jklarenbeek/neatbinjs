

const { startCollecting } = require('./collect');

const connection = startCollecting('BTCUSDT', function (err, json) {
  if (err == null) {
    console.log('message =>', json);
  }
  else if (typeof err === 'string')
    console.info(err, json);
  else
    console.error(err, json)
});

