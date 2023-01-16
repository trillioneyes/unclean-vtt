const express = require('express');
const fs = require('fs/promises');
const app = express();
const port = 3000;

async function handleTokensGet(req, resp) {
  resp.send(await loadTokens());
}
async function handleTokensPost(req, resp) {
  const tokens = req.body;
  const tabletop = await loadTokens();
  for (const token of tokens) {
    let found = false;
    for (const [i, existing] of tabletop.entries()) {
      if (existing.id == token.id) {
        tabletop[i] = token;
        found = true;
        break;
      }
    }
    if (!found) {
      tabletop.push(token);
    }
  }
  writeTokens(tabletop);
  resp.send();
}

async function handleTokensDelete(req, resp) {

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

function writeTokens(tokens) {
  return fs.open('./data/tabletops.json', 'w')
           .then((filehandle) => {
             filehandle.writeFile(JSON.stringify(tokens));
             filehandle.close();
           });
}

app.use(express.static('static'));
app.use(express.json());

app.get('/api/tokens', handleTokensGet);

app.post('/api/tokens', handleTokensPost);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
