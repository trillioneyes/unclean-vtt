const express = require('express');
const fs = require('fs/promises');
const {readFileSync} = require('fs');
const NodeCache = require('node-cache');
const https = require('https');

const app = express();
const port = 3000;
const creds = {
  key: readFileSync('./data/cert/selfsigned.key'),
  cert: readFileSync('./data/cert/selfsigned.crt')
};

async function loadCache() {
  const stores = {
    manual: {path: "./data/table1/manual.json",
             cache: new NodeCache()},
    auto: {path: "./data/table1/auto.json",
           cache: new NodeCache()}
  };
  for (const {path, cache} of Object.values(stores)) {
    const file = await fs.open(path);
    for (const token of
         Object.values(JSON.parse(await file.readFile()))) {
      cache.set(token.id, token);
    }
    file.close();
  }
  return stores;
}

async function handleTokensGet(req, resp) {
  const cacheDump = global.stores.auto.cache.mget(
    global.stores.auto.cache.keys()
  );
  resp.send(Object.values(cacheDump));
}
async function handleTokensPost(req, resp) {
  const tokens = req.body;
  const {cache} = global.stores.auto;
  for (const token of tokens) {
    cache.set(token.id, token);
  }
  writeTokens(global.stores.auto);
  resp.send(cache.mget(tokens.map((token) => token.id)));
}
async function handleTokensPostPromote(req, resp) {
  const tokens = req.body;
  const {cache: autoCache} = global.stores.auto;
  const {cache: manualCache} = global.stores.manual;
  for (const token of tokens) {
    autoCache.set(token.id, token);
    manualCache.set(token.id, token);
  }
  writeTokens(global.stores.auto);
  writeTokens(global.stores.manual);
  resp.send(autoCache.mget(tokens.map((token) => token.id)));
}

async function handleTokensDelete(req, resp) {
  const {cache} = global.stores.auto;
  cache.del(req.body.ids);
  writeTokens(global.stores.auto);
  resp.send();
}

async function handleTokensRevert(req, resp) {
  const {cache} = global.stores.manual;
  resp.send(cache.get(req.body.token));
}

function loadTokens() {
  return fs.open('./data/tabletops.json')
           .then((filehandle) => {
             const str = filehandle.readFile();
             filehandle.close();
             return str;
           })
           .then(JSON.parse);
}

function writeTokens(store) {
  const {cache, path} = store;
  const tokens = cache.mget(cache.keys());
  return fs.open(path, 'w')
           .then((filehandle) => {
             filehandle.writeFile(JSON.stringify(tokens));
             filehandle.close();
           });
}

function nextUnusedId() {
  const id = String(global.nextId);
  global.nextId++;
  return id;
}

async function handleIdGet(req, resp) {
  resp.send({id: nextUnusedId()});
}

app.use(express.static('static'));
app.use(express.json());

app.get('/api/tokens', handleTokensGet);
app.get('/api/new-id', handleIdGet);

app.post('/api/tokens', handleTokensPost);

app.delete('/api/tokens', handleTokensDelete);

app.post('/api/tokens/revert', handleTokensRevert);

app.post('/api/tokens/promote', handleTokensPostPromote);

// const redirectApp = express();
// redirectApp.all('*', function(req, res) {
//   console.log("Redirecting");
//   if (req.isSocket) {
//     return res.redirect('wss://' + req.headers.host + req.url);
//   } else {
//     return res.redirect('https://' + req.headers.host + req.url);
//   }
// });

loadCache().then((stores) => {
  global.stores = stores;
  const numericIds =
        global
        .stores.manual.cache.keys()
        .filter((str) => str.match(/^[0-9]+$/g));
  numericIds.push(0);
  global.nextId =
    Math.max(...numericIds) + 1;
  console.log("Loaded data store with tokens:");
  console.log({
    manual: global.stores.manual.cache.keys(),
    auto: global.stores.auto.cache.keys()
  });
  console.log("Next id: " + global.nextId);
  const httpsServer = https.createServer(creds, app);
  httpsServer.listen(port);
});
