const createExchange = require('./binance.js');

const blessed = require('blessed');
const contrib = require('blessed-contrib');

//#region addAssets
const exchange = createExchange();
exchange.addAsset('BNB', 0.91386066);
exchange.addAsset('USDT', 2.02662874);
exchange.addAsset('BTC', 0.01581497);
//exchange.addAsset('ETH', 0.36084826);
//exchange.addAsset('LTC', 0.00502228);
//exchange.addAsset('DOGE', 0.0);
//exchange.addAsset('XMR', 1.09400000);
//exchange.addAsset('BCHABC', 0.19500000);
//exchange.addAsset('IOTA', 153.00000000);
//exchange.addAsset('EOS', 13.23000000);
//exchange.addAsset('TRX', 2,334.00000000);
//exchange.addAsset('BAT', 147.00000000);
//exchange.addAsset('XLM', 503.68777041);
//exchange.addAsset('ADA', 752.00000000);
//exchange.addAsset('BTT', 67669.07797300);
//exchange.addAsset('BTS', 1017.00000000);
//exchange.addAsset('STEEM', 134.55000000);

exchange.fetchTradePairs();
exchange.startTradeFeeds();

//#endregion

//#region build screen
const screen = blessed.screen({
  smartCSR: true,
  log: process.env.HOME + '/blessed-terminal.log',
  fullUnicode: true,
  dockBorders: true,
  ignoreDockContrast: true
});

// Quit on Escape, q, or Control-C.
screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});
