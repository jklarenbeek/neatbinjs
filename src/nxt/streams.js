const WebSocket = require('ws');
const streamConfig = require('./config').publicStreams;

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

function parseEndPoints(symbols, ends, values) {
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
    const endpoint = streamConfig.endpoints[ends];
    if (endpoint == null)
      throw new Error('cant find endpoint ' + ends + ' in config.');
    
    // register a single stream
    const endpoints = {};
    const idx = replacePathParams(endpoint, { ...values, symbol: symbols.toLowerCase() });
    endpoints[idx] = ends; 
    return endpoints
  }

  // handle multiple endpoints for single symbol
  if (ends.constructor === Array && symbols.constructor === String) {
    const endpoints = {};
    // match all endpoints from config
    for (const end of ends) {
      const endpoint = streamConfig.endpoints[end];
      if (endpoint == null)
        throw new Error('cant find endpoint ' + end);
      
      const idx = replacePathParams(endpoint, { ...values, symbol: symbols.toLowerCase() });
      endpoints[idx] = end;
    }

    // we are parsing a combined stream of a single symbol
    return endpoints;
  }

  throw new Error('not implemented');
}

function formatEndPointUrl(endsObj) {
  const keys = Object.keys(endsObj);
  const len = keys.length;
  if (len === 0)
    throw new Error('What am I doing here!?');
  
  else if (len === 1)
    return streamConfig.baseSingle + keys[0];
  else
    return streamConfig.baseCombine + keys.join('/');
}

function openPublicWebSocket(url, options, callback) {
  const wss = new WebSocket(url, options);

  wss.onopen = () => callback('open', url);
  wss.onclose = () => callback('close', url);
  wss.onerror = (error) => callback(error, url);
  wss.onmessage = (event) => {
    const json = JSON.parse(event.data);
    callback(null, json);
  }

  return {
    get state() { return wss.readyState },
    close() { wss.close() }
  }
}

function openPublicEndPoint(endsObj, options, callback) {
  //const url = setupEndPointUrl('trade', 'BTCUSDT');
  //const url = setupEndPointUrl('partialDepth1s', 'BTCUSDT', { level: 20 });
  //const url = setupEndPointUrl(['trade', 'bookTicker', 'partialDepth100ms'], ['BTCUSDT', 'ETHUSDT', 'ETHBTC'])

  const url = formatEndPointUrl(endsObj);

  const keys = Object.keys(endsObj);
  if (keys.length === 1)
    // unify callback params
    return openPublicWebSocket(
      url,
      options,
      function singleEndPoint(err, json) {
        if (err) callback(err, json);
        else callback(
          null,
          {
            stream: keys[0],
            data: json,
          });
      });
  else
    // unified
    return openPublicWebSocket(
      url,
      options,
      callback);
}

function processPublicStream(info, callback) {
  const endpoints = parseEndPoints(
    info.symbols,
    info.endpoints,
    info.params);

  const conn = openPublicEndPoint(
    endpoints,
    info.ws,
    function (err, json) {
      if (err) callback(err, json);
      else {
        // we have a new incoming message
        const endpoint = json.stream;
        const data = json.data;

        // parse response type and symbol
        const endparts = endpoint.split('@');
        const endsym = endparts[0].toUpperCase();
        const endkey = endpoints[endpoint];

        // resolve data type
        const dataType = streamConfig.endpoints[endkey].response;

        if (Array.isArray(data)) {
          // every item must be of dataType
          throw new Error('not implemented');
        }
        else {
          // clue type interface to data structure
          data.__proto__ = dataType.prototype;
          data.constructor = dataType;
          // call next function with data of type
          callback(null, { endpointUri: endpoint, endpoint: endkey, symbol: endsym, data });
        }
      }
    });
  
  return conn;
}

function createPublicStream(info, callback) {
  return processPublicStream(info, callback);
}

module.exports = {
  createPublicStream,
};
