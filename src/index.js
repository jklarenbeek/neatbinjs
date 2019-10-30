const blessed = require('blessed');
const contrib = require('blessed-contrib');

const createExchange = require('./exchange').createExchange;
const ExchangeDaemon = require('./daemon');


function initBlessedScreen() {
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

function buildListTable(parent) {
  const table = blessed.listtable({
    parent: parent,
    left: 0,
    top: 0,
    width: '100%',
    height: '100%-8',
    border: false,
    align: 'right',
    tags: true,
    keys: true,
    vi: true,
    mouse: true,
    style: {
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
    },
  });
  return table;
}

function buildLoggerBox(parent) {
  const logger = blessed.log({
    parent: parent,
    bottom: 0,
    left: 'center',
    width: '100%',
    height: 8,
    border: 'line',
    tags: true,
    keys: true,
    vi: true,
    mouse: true,
    scrollback: 100,
    scrollbar: {
      ch: ' ',
      track: {
        bg: 'yellow'
      },
      style: {
        inverse: true
      }
    }
  });
  logger.log('Starting {#0fe1ab-fg}daemon{/} at: {bold}%s{/bold}.', Date.now().toString(36));
  return logger;
}

function wrapControl(name, text) {
  if (name == null) return text;
  return '{' + name + '}' + text + '{/' + name + '}';
}

const screen = initBlessedScreen();
const table = buildListTable(screen);
const logger = buildLoggerBox(screen);

screen.append(table);

table.focus();
screen.render();

// fix missing blessed methods for logging
const Log = logger.__proto__.constructor;
Log.prototype.warn = function (...args) { return this.log(...args); }
Log.prototype.error = function (...args) { return this.log(...args); }

const daemon = new ExchangeDaemon(createExchange({
  logger: logger,
  log: txt => {
    logger.warn(txt)
  },
}));

daemon.addAssets({
  BTC: { available: 0.01581497 },
  USDT: { available: 2.02662874 },
  BNB: { available: 0.91386066 },
  ETH: { available: 0.36084826 },
  LTC: { available: 0.00502228 },
  XRP: { available: 0.0 },
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

function formatTime(date) {
  const str = date.toISOString();
  const it = str.indexOf('T') + 1;
  return str.substring(it, str.indexOf('Z', it));
}

daemon.start(_ => {
  const pairs = Array.from(daemon.getPairs().values())
    .map(obj => {
      return obj.currentInfo();
    })
    .sort((a, b) => {
      return a.responseAvg - b.responseAvg;
    });
  
  const list = [['symbol', 'price', 'asks', 'load', 'response']];
  
  for (const info of pairs) {
  
    const pa = Math.round((1 / ((info.asks + info.bids) / info.asks)) * 100);

    const ua = info.asks / info.askQty;
    const ub = info.bids / info.bidQty;
    const la = Math.round((1 / ((ua + ub) / ua)) * 100);

    const st = info.responseAvg;

    const trend_sym = info.symbol === 'BTCUSDT'
      ? 'white-fg'
      : undefined;
    const trend_diff = info.diff < 0
      ? 'red-fg'
      : info.diff === 0
        ? 'blue-fg'
        : 'green-fg';
    const trend_pa = pa < 50
      ? (pa < 25 ? 'green-fg' : 'yellow-fg')
      : (pa > 75 ? 'red-fg' : 'yellow-fg');
    const trend_la = la < 50
      ? (la < 25 ? 'green-fg' : 'yellow-fg')
      : (la > 75 ? 'red-fg' : 'yellow-fg');
    const trend_st = (st.getUTCHours() > 0 || st.getUTCMinutes() > 0)
      ? 'red-fg'
      : st.getUTCSeconds() > 0
        ? 'yellow-fg'
        : st.getUTCMilliseconds() > 800
          ? 'yellow-fg'
          : 'green-fg';

    const item = [
      wrapControl(trend_sym, info.symbol),
      wrapControl(trend_diff, String(info.price)),
      wrapControl(trend_pa, '' + pa + '%'),
      wrapControl(trend_la, '' + la + '%'),
      wrapControl(trend_st, formatTime(st)),
    ];
    list.push(item);
  }
  const sel = table.selected;
  table.setData(list);
  table.select(sel);
  //screen.render();
});

setInterval(time => screen.render(), 200);
