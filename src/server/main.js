const express = require('express');
const fs = require('fs/promises');
const NodeCache = require('node-cache');

const app = express();
const port = 3000;

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

async function handleTokensDelete(req, resp) {
  const {cache} = global.stores.auto;
  cache.del(req.body.ids);
  writeTokens(global.stores.auto);
  resp.send();
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

app.use(express.static('static'));
app.use(express.json());

app.get('/api/tokens', handleTokensGet);

app.post('/api/tokens', handleTokensPost);

app.delete('/api/tokens', handleTokensDelete);

loadCache().then((stores) => {
  global.stores = stores;
  app.listen(port, () => {
    console.log(`Unclean VTT listening on port ${port}`);
  });
});
