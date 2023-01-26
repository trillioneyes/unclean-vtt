async function tokenPost(tokenData) {
  if (!window.uncleanClientId) {
    setTimeout(() => tokenPost(tokenData), 1);
    return;
  }
  const body = {
    clientId: window.uncleanClientId,
    tokens: tokenData
  };
  const response = await fetch('./api/tokens', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  const json = await response.json();
  for (const id of Object.keys(json)) {
    tokenFromProperties(json[id]);
  }
}

async function tokenPostPromote(tokenData) {
  if (!window.uncleanClientId) {
    setImmediate(() => tokenPostPromote(tokenData));
    return;
  }
  const body = {
    clientId: window.uncleanClientId,
    tokens: tokenData
  };
  const response = await fetch('./api/tokens/promote', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  const json = await response.json();
  for (const id of Object.keys(json)) {
    tokenFromProperties(json[id]);
  }
}

async function tokenGetCommitted(id) {
  const response = await fetch('./api/tokens/revert', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({token: id})
  });
  const json = await response.json();
  return json;
}

async function tokensGet() {
  return fetch('./api/tokens')
    .then((response) => response.json());
}

async function getNewId() {
  const response = await fetch('./api/new-id');
  return (await response.json()).id;
}

async function tokensDelete(ids) {
  const body = {
    clientId: window.uncleanClientId,
    ids: ids
  };
  return fetch('./api/tokens', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
}

async function syncDirtyTokens() {
  const dirtyTokens = Array.from(
    document.querySelectorAll('[is=unclean-token][data-dirty=true][id]')
  );
  for (const token of dirtyTokens) {
    token.setAttribute('data-dirty', false);
  }
  if (dirtyTokens.length) {
    tokenPost(dirtyTokens.map(tokenToProperties));
  }
}

async function openWebSocket(messageHandler) {
  const url = new URL(document.URL);
  url.protocol = 'wss://';
  url.pathname = '/api/updates/.websocket';
  // url.port += 1;
  const socket = new WebSocket(url);
  socket.addEventListener('message', function(messageEvent) {
    const message = JSON.parse(messageEvent.data);
    window.uncleanClientId = message.yourId;
    if (message.body) messageHandler(message.body);
  });
  socket.addEventListener('error', console.log);
  return new Promise((resolve, reject) => {
    socket.addEventListener(
      'open',
      () => resolve(socket),
      {once: true}
    );
    if (!reject) return;
    socket.addEventListener(
      'close',
      (event) => reject(event),
      {once: true}
    );
  });
}
