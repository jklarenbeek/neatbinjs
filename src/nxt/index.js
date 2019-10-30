

const { createPublicStream } = require('./streams');

const terminate = createPublicStream('BTCUSDT', function (err, event) {
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

