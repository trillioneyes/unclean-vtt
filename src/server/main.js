const express = require('express');
const fs = require('fs/promises');
const app = express();
const port = 3000;

async function handleTokensGet(req, resp) {
    const data = await fs.open('./data/tabletops.json')
          .then((filehandle) => {
              const str = filehandle.readFile();
              filehandle.close();
              return str;
          })
          .then(JSON.parse);
    resp.send(data);
}
async function handleTokensPost(req, resp) {
    const file = fs.open('./data/tabletops.json')
          .then((filehandle) => {
              const str = filehandle.readFile();
              filehandle.close();
              return str;
          })
          .then(JSON.parse);
    const tokens = req.body;
    const tabletop = await file;
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
    fs.open('./data/tabletops.json', 'w')
        .then((filehandle) => {
            filehandle.writeFile(JSON.stringify(tabletop));
            filehandle.close();
        });
    resp.send();
}

app.use(express.static('static'));
app.use(express.json());

app.get('/api/tokens', handleTokensGet);

app.post('/api/tokens', handleTokensPost);

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
