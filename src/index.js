const blessed = require('blessed');
const contrib = require('blessed-contrib');

const createExchange = require('./binance.js');
const ExchangeDaemon = require('./daemon.js');


const daemon = new ExchangeDaemon(createExchange());
daemon.addAssets({
  BTC: { available: 0.01581497 },
  USDT: { available: 2.02662874 },
  BNB: { available: 0.91386066 },
  ETH: { available: 0.36084826 },
  LTC: { available: 0.00502228 },
  DOGE: { available: 0.0 },
  XMR: { available: 1.09400000 },
  BCHABC: { available: 0.19500000 },
  IOTA: { available: 153.00000000 },
  EOS: { available: 13.23000000 },
  TRX: { available: 2334.00000000 },
  BAT: { available: 147.00000000 },
  XLM: { available: 503.68777041 },
  ADA: { available: 752.00000000 },
  BTT: { available: 67669.07797300 },
  BTS: { available: 1017.00000000 },
  STEEM: { available: 134.55000000 },
});


function initTerminalScreen() {
  const screen = blessed.screen({
    log: process.env.HOME + '/blessed-terminal.log',
    autoPadding: false,
    fullUnicode: true,
    warnings: true
  });
  
  // Quit on Escape, q, or Control-C.
  screen.key(['escape', 'q', 'C-c'], function(ch, key) {
    return process.exit(0);
  });

  return screen;
}

function buildListTable() {
  const table = blessed.listtable({
    top: 'center',
    left: 'center',
    data: null,
    border: 'line',
    align: 'center',
    tags: true,
    keys: true,
    //width: '80%',
    width: '80%',
    height: '70%',
    vi: true,
    mouse: true,
    style: {
      border: {
        fg: 'red'
      },
      header: {
        fg: 'blue',
        bold: true
      },
      cell: {
        fg: 'magenta',
        selected: {
          bg: 'blue'
        }
      }
    }
  });
  return table;
}

const screen = initTerminalScreen();
const table = buildListTable();
screen.append(table);

table.focus();
screen.render();

function wrapControl(name, text) {
  if (name == null) return text;
  return '{' + name + '}' + text + '{/' + name + '}';
}

daemon.start(_ => {
  const pairs = daemon.getPairs();
  const list = [[ 'SYM', 'price', 'quantity', 'asks', 'askQty', 'bids', 'bidQty' ]];
  for (let [symbol, pair] of pairs) {
    const info = pair.currentInfo();
    const trend = info.diff < 0 ? 'red-fg' : 'green-fg';
    const item = [
      symbol,
      info.price >= 0
        ? wrapControl(trend, String(info.price))
        : String('unknown'),
      Number(info.quantity).toFixed(5),
      info.asks.toFixed(2),
      info.askQty.toFixed(2),
      info.bids.toFixed(2),
      info.bidQty.toFixed(2),
    ];
    list.push(item);
  }
  table.setData(list);
  //screen.render();
});

setInterval(time => screen.render(), 333);

