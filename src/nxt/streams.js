const WebSocket = require('ws');
const { performance } = require('perf_hooks');
const { publicStreams } = require('./config');

//#region stream functions

function replacePathParams(endpoint, values) {
  let path = endpoint.path;
  const params = endpoint.params;

  const keys = Object.keys(params);
  for (const key of keys) {
    // construct the replacement string
    const rp = '${' + key + '}';
    // if we cant find it in the path, exit
    if (path.indexOf(rp) === -1) 
      throw new Error('Cant find parameter ' + key + ' in path ' + path);
    // get value of key and test it
    const val = values[key];
    if (val == null)
      throw new Error('Cant find value for parameter ' + key + ' in path ' + path);

    // get constraint of parameter
    const ctr = params[key];
    // if the contraint is a function, it must inherit from type
    if (typeof ctr === 'function') {
      if (!(val.constructor === ctr))
        throw new Error('value for param ' + key + ' is not of type ' + ctr.name + ' in path ' + path);
    }
    else if (ctr != null && ctr.pop) {
      if (ctr.includes(val) === false)
        throw new Error('invalid choice for param ' + key + ' in path ' + path);
    }
    // now that we survived our constraints, replace it
    path = path.replace(rp, values[key]);
  }
  return path;
}

function createEndPointUrl(symbols, ends, values) {
  if (symbols == null || ends == null)
    throw new Error('parameters can not be null');

  // fix value object, we validate later
  values = values == null
    ? {}
    : typeof values === 'object'
      ? values
      : {};

  // handle single endpoint
  if (ends.constructor === String && symbols.constructor === String) {
    // get available endpoint from config
    const endpoint = publicStreams.endpoints[ends];
    if (endpoint == null)
      throw new Error('cant find endpoint ' + ends);
    
    // we are parsing a single stream
    return publicStreams.singleUri
      + replacePathParams(endpoint, { ...values, symbol: symbols.toLowerCase() });
  }

  // handle multiple endpoints for single symbol
  if (ends.constructor === Array && symbols.constructor === String) {
    const endpoints = [];
    // match all endpoints from config
    for (const end of ends) {
      const endpoint = publicStreams.endpoints[end];
      if (endpoint == null)
        throw new Error('cant find endpoint ' + end);
      
      endpoints.push(replacePathParams(
        endpoint,
        { ...values, symbol: symbols.toLowerCase() }
      ));
    }

    // we are parsing a combined stream of a single symbol
    return publicStreams.combineUri
      + endpoints.join('/');

  }

  throw new Error('not implemented');
}

function createWebSocket(url, options, callback) {
  const wss = new WebSocket(url, options);

  wss.onopen = () => callback('open', url);
  wss.onclose = () => callback('close', url);
  wss.onerror = (error) => callback(error, url);
  wss.onmessage = (event) => callback(null, event);

  return function () {
    return {
      get state() { return wss.readyState },
      close() { wss.close() }
    }
  }

}

function createPublicStream(info = {}, callback) {
  //const url = setupEndPointUrl('trade', 'BTCUSDT');
  //const url = setupEndPointUrl('partialDepth1s', 'BTCUSDT', { level: 20 });
  //const url = setupEndPointUrl(['trade', 'bookTicker', 'partialDepth100ms'], ['BTCUSDT', 'ETHUSDT', 'ETHBTC'])

  const url = createEndPointUrl(
    info.symbols,
    info.endpoints,
    info.params);

  return createWebSocket(
    url,
    info.ws,
    callback);
}

//#endregion

module.exports = {
  createPublicStream,
};
